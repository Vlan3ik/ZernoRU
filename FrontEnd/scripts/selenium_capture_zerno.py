import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse

from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = "https://www.zerno.ru/"
WAIT_SECONDS = 12
WINDOW_WIDTH = 1920
WINDOW_HEIGHT = 2200
MAX_FULLPAGE_HEIGHT = 5000

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def slugify(value: str) -> str:
    text = re.sub(r"\s+", "_", (value or "").strip().lower())
    text = re.sub(r"[^a-zA-Z0-9_\-а-яА-Я]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("_")
    return text[:80] if text else "page"


def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    if not parsed.scheme:
        return urljoin(BASE_URL, url)
    return url


def should_keep(url: str) -> bool:
    if not url:
        return False
    lowered = url.lower().strip()
    if lowered.startswith("javascript:") or lowered.startswith("mailto:") or lowered.startswith("tel:"):
        return False
    return True


def build_driver():
    errors = []

    chrome_opts = webdriver.ChromeOptions()
    chrome_opts.add_argument("--headless=new")
    chrome_opts.add_argument(f"--window-size={WINDOW_WIDTH},{WINDOW_HEIGHT}")
    chrome_opts.add_argument("--disable-gpu")
    chrome_opts.add_argument("--ignore-certificate-errors")
    chrome_opts.add_argument("--disable-dev-shm-usage")
    chrome_opts.add_argument("--no-sandbox")

    try:
        driver = webdriver.Chrome(options=chrome_opts)
        return driver, "chrome"
    except Exception as exc:  # noqa: BLE001
        errors.append(f"Chrome: {exc}")

    edge_opts = webdriver.EdgeOptions()
    edge_opts.add_argument("--headless=new")
    edge_opts.add_argument(f"--window-size={WINDOW_WIDTH},{WINDOW_HEIGHT}")
    edge_opts.add_argument("--disable-gpu")
    edge_opts.add_argument("--ignore-certificate-errors")

    try:
        driver = webdriver.Edge(options=edge_opts)
        return driver, "edge"
    except Exception as exc:  # noqa: BLE001
        errors.append(f"Edge: {exc}")

    raise RuntimeError("Не удалось запустить браузер. Ошибки: " + " | ".join(errors))


def first_visible(elements):
    for element in elements:
        try:
            if element.is_displayed() and element.size.get("height", 0) > 0:
                return element
        except WebDriverException:
            continue
    return None


def get_header_root(driver):
    roots = driver.find_elements(By.CSS_SELECTOR, "header")
    root = first_visible(roots)
    if root:
        return root

    navs = driver.find_elements(By.CSS_SELECTOR, "nav")
    root = first_visible(navs)
    if root:
        return root

    return driver.find_element(By.TAG_NAME, "body")


def get_top_level_items(header_root):
    selectors = [
        "nav > ul > li",
        "ul.menu > li",
        "ul.main-menu > li",
        ".menu > li",
        ".main-menu > li",
        ".navbar-nav > li",
        "ul > li",
    ]

    best = []
    for selector in selectors:
        try:
            items = [item for item in header_root.find_elements(By.CSS_SELECTOR, selector) if item.is_displayed()]
        except WebDriverException:
            continue

        if len(items) > len(best):
            best = items

        if len(best) >= 6:
            break

    if not best:
        # fallback: direct links from header
        links = [a for a in header_root.find_elements(By.CSS_SELECTOR, "a[href]") if a.is_displayed()]
        return links

    return best


def anchor_from_item(item):
    try:
        anchors = item.find_elements(By.CSS_SELECTOR, ":scope > a[href]")
        if anchors:
            return anchors[0]
    except WebDriverException:
        pass

    try:
        anchors = item.find_elements(By.CSS_SELECTOR, "a[href]")
        if anchors:
            return anchors[0]
    except WebDriverException:
        return None

    return None


def collect_links(driver):
    collected = []
    seen = set()

    wait = WebDriverWait(driver, WAIT_SECONDS)
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

    header = get_header_root(driver)
    top_items = get_top_level_items(header)

    for idx, item in enumerate(top_items, start=1):
        try:
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", item)
            ActionChains(driver).move_to_element(item).pause(0.4).perform()
            time.sleep(0.4)
        except WebDriverException:
            pass

        top_anchor = anchor_from_item(item)
        if top_anchor:
            top_title = (top_anchor.text or "").strip() or f"header_{idx}"
            top_href = normalize_url(top_anchor.get_attribute("href") or "")
            if should_keep(top_href) and top_href not in seen:
                seen.add(top_href)
                collected.append((f"header/{top_title}", top_title, top_href))

        submenu_selectors = [
            "ul li a[href]",
            ".submenu a[href]",
            ".dropdown-menu a[href]",
            "li li a[href]",
        ]

        submenu_anchors = []
        for selector in submenu_selectors:
            try:
                submenu_anchors = [a for a in item.find_elements(By.CSS_SELECTOR, selector) if a.is_displayed()]
            except WebDriverException:
                continue
            if submenu_anchors:
                break

        if not submenu_anchors:
            try:
                siblings = driver.find_elements(By.CSS_SELECTOR, "header .submenu a[href], header .dropdown-menu a[href]")
                submenu_anchors = [a for a in siblings if a.is_displayed()]
            except WebDriverException:
                submenu_anchors = []

        for sub_index, anchor in enumerate(submenu_anchors, start=1):
            sub_title = (anchor.text or "").strip() or f"sub_{idx}_{sub_index}"
            href = normalize_url(anchor.get_attribute("href") or "")
            if should_keep(href) and href not in seen:
                seen.add(href)
                group = (top_anchor.text or "").strip() if top_anchor else f"header_{idx}"
                collected.append((f"header/{group}/{sub_title}", sub_title, href))

    # Fallback for cases where top menu detection fails
    if len(collected) < 3:
        generic_links = [a for a in header.find_elements(By.CSS_SELECTOR, "a[href]") if a.is_displayed()]
        for i, anchor in enumerate(generic_links, start=1):
            title = (anchor.text or "").strip() or f"header_link_{i}"
            href = normalize_url(anchor.get_attribute("href") or "")
            if should_keep(href) and href not in seen:
                seen.add(href)
                collected.append((f"header/{title}", title, href))

    return collected


def make_output_dir():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out = Path("screenshots") / f"zerno_ru_header_{timestamp}"
    out.mkdir(parents=True, exist_ok=True)
    return out


def save_screenshot(driver, output_path: Path):
    try:
        page_height = driver.execute_script(
            "return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);"
        )
        target_height = int(min(max(page_height, WINDOW_HEIGHT), MAX_FULLPAGE_HEIGHT))
        driver.set_window_size(WINDOW_WIDTH, target_height)
        time.sleep(0.4)
    except WebDriverException:
        driver.set_window_size(WINDOW_WIDTH, WINDOW_HEIGHT)

    driver.save_screenshot(str(output_path))


def main():
    output_dir = make_output_dir()
    manifest_path = output_dir / "manifest.txt"

    driver, browser_name = build_driver()
    driver.set_page_load_timeout(30)

    try:
        print(f"Браузер: {browser_name}")
        driver.get(BASE_URL)

        links = collect_links(driver)
        if not links:
            raise RuntimeError("Не удалось найти ссылки в хедере.")

        print(f"Найдено уникальных ссылок: {len(links)}")

        with manifest_path.open("w", encoding="utf-8") as manifest:
            for index, (menu_path, title, url) in enumerate(links, start=1):
                try:
                    driver.get(url)
                    WebDriverWait(driver, WAIT_SECONDS).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
                    time.sleep(0.7)
                except TimeoutException:
                    print(f"[WARN] Таймаут при открытии: {url}")

                filename = f"{index:03d}_{slugify(menu_path)}.png"
                screenshot_path = output_dir / filename
                save_screenshot(driver, screenshot_path)

                final_url = driver.current_url
                line = f"{index:03d} | {menu_path} | {title} | {url} | {final_url} | {filename}\n"
                manifest.write(line)
                print(line.strip())

        print(f"Скриншоты сохранены в: {output_dir.resolve()}")
        print(f"Манифест: {manifest_path.resolve()}")

    finally:
        driver.quit()


if __name__ == "__main__":
    main()
