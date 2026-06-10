import re
import time
from pathlib import Path
from urllib.parse import quote

from selenium import webdriver
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = "http://127.0.0.1:4173"
WAIT_SECONDS = 10
WINDOW_WIDTH = 1920
WINDOW_HEIGHT = 2200
MAX_HEIGHT = 5400

ROUTES = [
    "/",
    "/news",
    "/news/n-1",
    "/prices",
    "/prices/archive",
    "/prices/pw3",
    "/marketplace",
    "/marketplace?tab=grain",
    "/marketplace?tab=equipment",
    "/marketplace?tab=services",
    "/marketplace/lot/grain_1",
    "/directories",
    "/countries",
    "/cultures",
    "/logistics",
    "/forum",
    "/forum/section/trade",
    "/forum/topic/post_1",
    "/forum/new",
    "/analytics",
    "/cabinet",
    "/seller-verification",
    "/search?q=%D0%BF%D1%88%D0%B5%D0%BD%D0%B8%D1%86%D0%B0",
    "/cart",
    "/checkout",
    "/orders",
    "/orders/ord-1",
    "/deals",
    "/favorites",
    "/compare",
    "/messages",
    "/documents",
    "/billing",
    "/notifications",
    "/help",
    "/about",
    "/advertising",
    "/contacts",
    "/forum-rules",
    "/lot-rules",
    "/privacy",
    "/terms",
    "/exchange",
    "/duties",
    "/rail-tariffs",
    "/routes",
    "/organizations",
    "/analytics/tariffs",
    "/analytics/demo",
    "/analytics/subscription",
]


def slugify(value: str) -> str:
    text = value.strip().lower().replace("/", "_").replace("?", "_").replace("=", "_").replace("&", "_")
    text = re.sub(r"[^a-zA-Z0-9_\-]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("_")
    return text or "home"


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
        return webdriver.Chrome(options=chrome_opts), "chrome"
    except Exception as exc:  # noqa: BLE001
        errors.append(f"Chrome: {exc}")

    edge_opts = webdriver.EdgeOptions()
    edge_opts.add_argument("--headless=new")
    edge_opts.add_argument(f"--window-size={WINDOW_WIDTH},{WINDOW_HEIGHT}")
    edge_opts.add_argument("--disable-gpu")
    edge_opts.add_argument("--ignore-certificate-errors")

    try:
        return webdriver.Edge(options=edge_opts), "edge"
    except Exception as exc:  # noqa: BLE001
        errors.append(f"Edge: {exc}")

    raise RuntimeError("Не удалось запустить браузер: " + " | ".join(errors))


def save_fullpage(driver, output_path: Path):
    try:
        total_height = driver.execute_script(
            "return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);"
        )
        target_height = int(min(max(total_height, WINDOW_HEIGHT), MAX_HEIGHT))
        driver.set_window_size(WINDOW_WIDTH, target_height)
        time.sleep(0.25)
    except WebDriverException:
        driver.set_window_size(WINDOW_WIDTH, WINDOW_HEIGHT)

    driver.save_screenshot(str(output_path))


def main():
    out_dir = Path("скринкаст")
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = out_dir / "manifest.txt"

    driver, browser = build_driver()
    driver.set_page_load_timeout(30)

    try:
        print(f"Браузер: {browser}")
        with manifest.open("w", encoding="utf-8") as mf:
            for idx, route in enumerate(ROUTES, start=1):
                url = f"{BASE_URL}{route}"
                driver.get(url)
                WebDriverWait(driver, WAIT_SECONDS).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
                time.sleep(0.6)

                name = f"{idx:03d}_{slugify(route)}.png"
                path = out_dir / name
                save_fullpage(driver, path)

                line = f"{idx:03d} | {route} | {driver.current_url} | {name}\n"
                mf.write(line)
                print(line.strip())

        print(f"Готово: {out_dir.resolve()}")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
