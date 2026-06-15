import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  DislikeOutlined,
  FileTextOutlined,
  FilterOutlined,
  LikeOutlined,
  MessageOutlined,
  PaperClipOutlined,
  SearchOutlined,
  StarFilled,
  TagOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { forumSections } from "../data/portalContent";
import { useAppStore } from "../store/appStore";
import type {
  ForumAttachment,
  ForumExpertProfile,
  ForumPost,
  ForumReply,
} from "../types/domain";

type ForumStatusKey = "expert" | "answered" | "empty" | "discussion" | "closed";

type ForumStatus = {
  key: ForumStatusKey;
  label: string;
  tone: "success" | "warning" | "info" | "muted";
};

type ForumTopicMeta = {
  culture: string;
  region: string;
  sectionId: string;
};

const sectionMap: Record<string, string> = {
  agronomy: "Агрономия",
  trade: "Торговля",
  tech: "Техника",
};

const sectionMeta = [
  {
    id: "agronomy",
    name: "Агрономия",
    icon: "А",
    description: "Севооборот, питание, болезни, урожайность и агротехника.",
  },
  {
    id: "trade",
    name: "Торговля",
    icon: "₽",
    description: "Цены, поставки, качество партии, договоры и документы.",
  },
  {
    id: "tech",
    name: "Техника",
    icon: "Т",
    description: "Хранение, транспорт, оборудование, сервис и ремонт.",
  },
] as const;

const cultureOptions = [
  "Пшеница",
  "Ячмень",
  "Кукуруза",
  "Рожь",
  "Овес",
  "Техника",
];
const regionOptions = [
  "Смоленская область",
  "ЦФО",
  "ЮФО",
  "ПФО",
  "Сибирь",
  "Не важно",
];
const forumSortOptions = [
  { label: "Сначала важные", value: "important" },
  { label: "Свежие", value: "fresh" },
  { label: "Обсуждаемые", value: "discussion" },
  { label: "Есть проверенный ответ", value: "answered" },
];

function sectionIdForName(name: string) {
  return (
    Object.entries(sectionMap).find(([, value]) => value === name)?.[0] ??
    "trade"
  );
}

function normalizeText(value: string) {
  return value.toLowerCase().replaceAll("#", "").trim();
}

function inferMeta(post: ForumPost): ForumTopicMeta {
  const source = normalizeText(
    `${post.title} ${post.content} ${post.tags.join(" ")}`,
  );
  const sectionId = sectionIdForName(post.section);

  let culture = "Общий вопрос";
  if (source.includes("пшениц")) culture = "Пшеница";
  else if (source.includes("ячмен")) culture = "Ячмень";
  else if (source.includes("кукуруз")) culture = "Кукуруза";
  else if (source.includes("рож")) culture = "Рожь";
  else if (source.includes("овес")) culture = "Овес";
  else if (source.includes("техник")) culture = "Техника";

  let region = "Не указан";
  if (source.includes("смолен")) region = "Смоленская область";
  else if (source.includes("цфо")) region = "ЦФО";
  else if (source.includes("юфо")) region = "ЮФО";
  else if (source.includes("пфо")) region = "ПФО";
  else if (source.includes("сибир")) region = "Сибирь";

  return { culture, region, sectionId };
}

function inferStatus(post: ForumPost, repliesCount: number): ForumStatus {
  if (post.verifiedAnswer) {
    return {
      key: "answered",
      label: "Есть проверенный ответ",
      tone: "success",
    };
  }

  if (repliesCount === 0) {
    return { key: "empty", label: "Без ответа", tone: "muted" };
  }

  if (repliesCount === 1) {
    return { key: "expert", label: "Нужен эксперт", tone: "warning" };
  }

  if (repliesCount >= 4) {
    return { key: "closed", label: "Закрыта", tone: "success" };
  }

  return { key: "discussion", label: "Обсуждение", tone: "info" };
}

function statusClass(status: ForumStatus) {
  return `forum-status forum-status--${status.tone}`;
}

function topicRank(status: ForumStatus) {
  switch (status.key) {
    case "expert":
      return 0;
    case "empty":
      return 1;
    case "discussion":
      return 2;
    case "answered":
      return 3;
    case "closed":
      return 4;
    default:
      return 5;
  }
}

function topicViews(
  repliesCount: number,
  hasVerifiedAnswer: boolean,
  viewBoost = 0,
) {
  return 112 + repliesCount * 12 + (hasVerifiedAnswer ? 28 : 0) + viewBoost;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value: string) {
  return dayjs(value).format("DD.MM.YYYY HH:mm");
}

function formatShortDate(value: string) {
  return dayjs(value).format("DD.MM");
}

type ForumMediaType = "image" | "video" | "file";

type DraftAttachment = {
  id: string;
  name: string;
  type: ForumMediaType;
  url: string;
  size: number;
  mimeType?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(value: string) {
  let output = escapeHtml(value);
  output = output.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  output = output.replace(
    /(^|[^*])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g,
    "$1<em>$2</em>",
  );
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
  );
  return output;
}

function MarkdownContent({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) {
    return null;
  }

  return (
    <>
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim());
        const isQuote = lines.every((line) => line.startsWith(">"));
        const isList = lines.every((line) => /^[-*]\s+/.test(line));

        if (isQuote) {
          return (
            <blockquote
              key={`${index}-${block}`}
              className="forum-markdown forum-markdown--quote"
              dangerouslySetInnerHTML={{
                __html: lines
                  .map((line) => line.replace(/^>\s?/, ""))
                  .join("<br/>"),
              }}
            />
          );
        }

        if (isList) {
          return (
            <ul
              key={`${index}-${block}`}
              className="forum-markdown forum-markdown--list"
            >
              {lines.map((line) => (
                <li
                  key={line}
                  dangerouslySetInnerHTML={{
                    __html: renderInlineMarkdown(line.replace(/^[-*]\s+/, "")),
                  }}
                />
              ))}
            </ul>
          );
        }

        return (
          <p
            key={`${index}-${block}`}
            className="forum-markdown"
            dangerouslySetInnerHTML={{
              __html: renderInlineMarkdown(block).replace(/\n/g, "<br/>"),
            }}
          />
        );
      })}
    </>
  );
}

type ForumAttachmentView = Pick<
  ForumAttachment,
  "url" | "type" | "name" | "mimeType" | "size"
>;

function formatFileSize(size?: number) {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function AttachmentCard({
  attachment,
  compact = false,
  onOpen,
}: {
  attachment?: ForumAttachmentView | null;
  compact?: boolean;
  onOpen?: (attachment: ForumAttachmentView) => void;
}) {
  if (!attachment?.url) {
    return null;
  }

  const body = (
    <>
      <div className="forum-attachment__thumb">
        {attachment.type === "image" ? (
          <img src={attachment.url} alt={attachment.name ?? "Вложение"} />
        ) : attachment.type === "video" ? (
          <div className="forum-attachment__thumb-placeholder">Видео</div>
        ) : (
          <div className="forum-attachment__thumb-placeholder">Файл</div>
        )}
      </div>
      <div className="forum-attachment__meta">
        <strong>{attachment.name ?? "Вложение"}</strong>
        <span>
          {attachment.type === "image"
            ? "Изображение"
            : attachment.type === "video"
              ? "Видео"
              : "Документ"}
          {attachment.size ? ` · ${formatFileSize(attachment.size)}` : ""}
        </span>
      </div>
    </>
  );

  if (attachment.type === "file") {
    return (
      <a
        className={`forum-attachment forum-attachment--file ${compact ? "forum-attachment--compact" : ""}`}
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
      >
        <FileTextOutlined />
        <span>{attachment.name ?? "Файл"}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      className={`forum-attachment forum-attachment--tile ${compact ? "forum-attachment--compact" : ""}`}
      onClick={() => onOpen?.(attachment)}
    >
      {body}
    </button>
  );
}

function DraftAttachmentRow({
  attachment,
  onRemove,
  onOpen,
}: {
  attachment: DraftAttachment;
  onRemove: () => void;
  onOpen?: (attachment: ForumAttachmentView) => void;
}) {
  const view: ForumAttachmentView = {
    url: attachment.url,
    type: attachment.type,
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
  };

  return (
    <div className="forum-draft-attachment">
      <button
        type="button"
        className="forum-draft-attachment__body"
        onClick={() => onOpen?.(view)}
      >
        <div className="forum-draft-attachment__icon">
          {attachment.type === "image"
            ? "IMG"
            : attachment.type === "video"
              ? "VID"
              : "DOC"}
        </div>
        <div className="forum-draft-attachment__copy">
          <strong>{attachment.name}</strong>
          <span>
            {attachment.type === "image"
              ? "Изображение"
              : attachment.type === "video"
                ? "Видео"
                : "Документ"}
            {attachment.size ? ` · ${formatFileSize(attachment.size)}` : ""}
          </span>
        </div>
      </button>
      <Button
        type="text"
        size="small"
        danger
        icon={<CloseOutlined />}
        className="forum-draft-attachment__remove"
        onClick={onRemove}
      />
    </div>
  );
}

function AttachmentViewerModal({
  attachment,
  onClose,
}: {
  attachment: ForumAttachmentView | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={Boolean(attachment)}
      onCancel={onClose}
      footer={null}
      width={920}
      destroyOnClose
      title={attachment?.name ?? "Просмотр вложения"}
    >
      {attachment?.type === "video" ? (
        <video
          className="forum-media-viewer__video"
          controls
          autoPlay
          preload="metadata"
          src={attachment.url}
        />
      ) : attachment?.type === "image" ? (
        <img
          className="forum-media-viewer__image"
          src={attachment.url}
          alt={attachment.name ?? "Вложение"}
        />
      ) : attachment ? (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Text>Документ: {attachment.name}</Typography.Text>
          <Typography.Link
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
          >
            Открыть или скачать файл
          </Typography.Link>
        </Space>
      ) : null}
    </Modal>
  );
}

async function fileToAttachment(file: File): Promise<DraftAttachment> {
  const type = file.type.startsWith("video/")
    ? "video"
    : file.type.startsWith("image/")
      ? "image"
      : "file";
  const url = URL.createObjectURL(file);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    type,
    url,
    size: file.size,
    mimeType: file.type || undefined,
  };
}

function ForumMarkdownEditor({
  value = "",
  onChange,
  placeholder,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="forum-md-editor">
      <MdEditor
        modelValue={value}
        onChange={(nextValue) => onChange?.(nextValue)}
        placeholder={placeholder}
        noUploadImg
        toolbarsExclude={[
          "github",
          "catalog",
          "htmlPreview",
          "pageFullscreen",
          "fullscreen",
        ]}
      />
    </div>
  );
}

function ForumTagCloud({ tags }: { tags: string[] }) {
  return (
    <Space wrap size={[8, 8]}>
      {tags.map((tag) => (
        <Tag key={tag} className="forum-chip forum-chip--outline">
          {tag}
        </Tag>
      ))}
    </Space>
  );
}

function ForumStatusTag({ status }: { status: ForumStatus }) {
  return <Tag className={statusClass(status)}>{status.label}</Tag>;
}

function ForumSectionCard({
  meta,
  topicsCount,
  repliesCount,
  lastUpdate,
  bestAnswers,
  active,
  onClick,
}: {
  meta: (typeof sectionMeta)[number];
  topicsCount: number;
  repliesCount: number;
  lastUpdate: string | null;
  bestAnswers: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={`forum-section-card ${active ? "forum-section-card--active" : ""}`}
      onClick={onClick}
    >
      <Space align="start" size={14} className="forum-section-card__inner">
        <div className="forum-section-card__icon">{meta.icon}</div>
        <div className="forum-section-card__copy">
          <Typography.Title level={4}>{meta.name}</Typography.Title>
          <Typography.Paragraph className="forum-muted forum-section-card__description">
            {meta.description}
          </Typography.Paragraph>
          <Space wrap size={[8, 8]}>
            {bestAnswers > 0 && (
              <Tag className="forum-chip forum-chip--success">
                1 лучший ответ
              </Tag>
            )}
            <Tag className="forum-chip forum-chip--outline">
              {topicsCount} тем
            </Tag>
            <Tag className="forum-chip forum-chip--outline">
              {repliesCount} ответов
            </Tag>
          </Space>
        </div>
        <div className="forum-section-card__meta">
          <strong>{topicsCount}</strong>
          <span>тем</span>
          <Typography.Text type="secondary">
            {lastUpdate ? formatShortDate(lastUpdate) : "Нет тем"}
          </Typography.Text>
        </div>
      </Space>
    </Card>
  );
}

function ForumTopicCard({
  post,
  repliesCount,
  views = 0,
  active,
  compact,
  onClick,
}: {
  post: ForumPost;
  repliesCount: number;
  views?: number;
  active?: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  const meta = inferMeta(post);
  const status = inferStatus(post, repliesCount);
  const viewCount = topicViews(
    repliesCount,
    Boolean(post.verifiedAnswer),
    views,
  );

  return (
    <Card
      className={[
        "forum-topic-card",
        compact ? "forum-topic-card--compact" : "",
        status.key === "answered" ? "forum-topic-card--verified" : "",
        active ? "forum-topic-card--active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      <div className="forum-topic-card__layout">
        <div className="forum-topic-card__main">
          <Space wrap size={[8, 8]}>
            <Tag className="forum-chip forum-chip--outline">{post.section}</Tag>
            {status.key === "expert" ? (
              <Tag className="forum-chip forum-chip--warning">
                Нужен эксперт
              </Tag>
            ) : (
              <ForumStatusTag status={status} />
            )}
          </Space>

          <Typography.Title level={4}>{post.title}</Typography.Title>
          <Typography.Paragraph className="forum-muted forum-topic-card__description">
            {post.content}
          </Typography.Paragraph>
          <ForumTagCloud tags={post.tags} />

          <Space wrap size={[12, 8]} className="forum-topic-card__meta">
            <span>
              <UserOutlined /> {post.authorName}
            </span>
            <span>
              <EnvironmentOutlined /> {meta.region}
            </span>
            <span>
              <TagOutlined /> {meta.culture}
            </span>
            <span>
              <ClockCircleOutlined /> {formatShortDate(post.createdAt)}
            </span>
          </Space>
        </div>

        <div className="forum-topic-card__side">
          <Typography.Text type="secondary" className="forum-topic-card__date">
            {formatDate(post.createdAt)}
          </Typography.Text>
          <Space
            direction="vertical"
            size={4}
            className="forum-topic-card__stats"
          >
            <span>
              <MessageOutlined /> {repliesCount}
            </span>
            <span>
              <EyeOutlined /> {viewCount}
            </span>
          </Space>
          <Button
            type={status.key === "answered" ? "default" : "primary"}
            size="middle"
            className="forum-topic-card__button"
          >
            Открыть
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="forum-section-head">
      <div>
        <Typography.Title level={2}>{title}</Typography.Title>
        {subtitle && (
          <Typography.Paragraph className="forum-muted forum-section-head__subtitle">
            {subtitle}
          </Typography.Paragraph>
        )}
      </div>
      {action}
    </div>
  );
}

function TopicMessage({
  id,
  author,
  role,
  date,
  content,
  attachments,
  replyToAuthorName,
  best,
  accent,
  pending,
  likes = 0,
  dislikes = 0,
  onComment,
  onLike,
  onDislike,
  onOpenAttachment,
}: {
  id?: string;
  author: string;
  role: string;
  date: string;
  content: string | string[];
  attachments?: ForumAttachmentView[] | null;
  replyToAuthorName?: string;
  best?: boolean;
  accent?: boolean;
  pending?: boolean;
  likes?: number;
  dislikes?: number;
  onComment?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onOpenAttachment?: (attachment: ForumAttachmentView) => void;
}) {
  const text = Array.isArray(content) ? content.join("\n\n") : content;

  return (
    <article
      id={id}
      className={`forum-message ${best ? "forum-message--best" : ""} ${accent ? "forum-message--accent" : ""} ${pending ? "forum-message--pending" : ""}`}
    >
      <div className="forum-message__head">
        <div className="forum-message__avatar">{initials(author)}</div>
        <div className="forum-message__who">
          <strong>{author}</strong>
          <small>
            {role} · {formatDate(date)}
            {pending && " · На модерации"}
          </small>
        </div>
        {best && (
          <Tag className="forum-chip forum-chip--success">
            <StarFilled /> Лучший ответ
          </Tag>
        )}
        {pending && (
          <Tag className="forum-chip forum-chip--outline">На модерации</Tag>
        )}
      </div>
      {replyToAuthorName && (
        <Tag className="forum-chip forum-chip--outline forum-message__reply-to">
          Ответ пользователю: {replyToAuthorName}
        </Tag>
      )}
      <div className="forum-message__content">
        <MarkdownContent text={text} />
      </div>
      {attachments?.length ? (
        <Space wrap size={[10, 10]} className="forum-message__attachments">
          {attachments.map((attachment) => (
            <AttachmentCard
              key={`${attachment.name}-${attachment.url}`}
              attachment={attachment}
              compact
              onOpen={onOpenAttachment}
            />
          ))}
        </Space>
      ) : null}
      <div className="forum-message__actions">
        <Button
          size="small"
          type="text"
          icon={<LikeOutlined />}
          onClick={onLike}
        >
          {likes}
        </Button>
        <Button
          size="small"
          type="text"
          icon={<DislikeOutlined />}
          onClick={onDislike}
        >
          {dislikes}
        </Button>
        {onComment && (
          <Button
            size="small"
            type="text"
            icon={<MessageOutlined />}
            onClick={onComment}
          >
            Комментировать
          </Button>
        )}
      </div>
    </article>
  );
}

function ForumSidebarCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="forum-sidebar-card" title={title} extra={action}>
      {children}
    </Card>
  );
}

function ForumExpertsList({ experts }: { experts: ForumExpertProfile[] }) {
  if (!experts.length) {
    return (
      <Typography.Text type="secondary">
        Пока нет доступных экспертов.
      </Typography.Text>
    );
  }

  return (
    <Space direction="vertical" size={10} className="forum-sidebar-list">
      {experts.map((expert) => (
        <div key={expert.id} className="forum-expert-item">
          <div className="forum-expert-item__avatar">
            {initials(expert.name)}
          </div>
          <div className="forum-expert-item__copy">
            <strong>{expert.name}</strong>
            <span>{expert.specialization}</span>
            <small>{expert.company}</small>
          </div>
          <div className="forum-expert-item__meta">
            <Tag className="forum-chip forum-chip--success">
              ★ {expert.rating.toFixed(1)}
            </Tag>
            <Typography.Text type="secondary">
              {expert.responseCount} ответов
            </Typography.Text>
          </div>
        </div>
      ))}
    </Space>
  );
}

function collectMeta(
  posts: ForumPost[],
  repliesByTopic: Record<string, number>,
) {
  const metaBySection = Object.fromEntries(
    sectionMeta.map((meta) => [
      meta.name,
      {
        topicsCount: 0,
        repliesCount: 0,
        bestAnswers: 0,
        lastUpdate: null as string | null,
      },
    ]),
  );

  posts.forEach((post) => {
    const meta = metaBySection[post.section];
    if (!meta) return;
    meta.topicsCount += 1;
    meta.bestAnswers += post.verifiedAnswer ? 1 : 0;
    meta.repliesCount += repliesByTopic[post.id] ?? 0;
    if (!meta.lastUpdate || dayjs(post.createdAt).isAfter(meta.lastUpdate)) {
      meta.lastUpdate = post.createdAt;
    }
  });

  return metaBySection;
}

function countRepliesByTopic(replies: ForumReply[]) {
  return replies.reduce<Record<string, number>>((acc, reply) => {
    acc[reply.postId] = (acc[reply.postId] ?? 0) + 1;
    return acc;
  }, {});
}

export function ForumPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const posts = useAppStore((state) => state.posts);
  const replies = useAppStore((state) => state.replies);
  const forumTopicViews = useAppStore((state) => state.forumTopicViews);
  const repliesByTopic = useMemo(() => countRepliesByTopic(replies), [replies]);
  const activeSection = searchParams.get("section") ?? "all";
  const sort = searchParams.get("sort") ?? "important";
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const sectionStats = useMemo(
    () => collectMeta(posts, repliesByTopic),
    [posts, repliesByTopic],
  );

  const forumStats = useMemo(() => {
    const totalReplies = replies.length;
    const expertNeeded = posts.filter(
      (post) =>
        inferStatus(post, repliesByTopic[post.id] ?? 0).key === "expert",
    ).length;
    const activeTopics = posts.filter(
      (post) =>
        inferStatus(post, repliesByTopic[post.id] ?? 0).key !== "closed",
    ).length;
    const avgResponse = totalReplies >= activeTopics ? "2 ч" : "4 ч";

    return [
      { value: activeTopics, label: "активных тем" },
      { value: expertNeeded, label: "требуют эксперта" },
      { value: avgResponse, label: "среднее время ответа" },
      { value: forumSections.length, label: "раздела форума" },
    ];
  }, [posts, replies, repliesByTopic]);

  const topicItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts
      .filter((post) => {
        const meta = inferMeta(post);
        const status = inferStatus(post, repliesByTopic[post.id] ?? 0);
        const matchesSearch =
          !query ||
          `${post.title} ${post.content} ${post.tags.join(" ")} ${meta.culture} ${meta.region}`
            .toLowerCase()
            .includes(query);
        const matchesSection =
          activeSection === "all" || post.section === sectionMap[activeSection];

        if (!matchesSearch || !matchesSection) return false;
        if (sort === "answered") return status.key === "answered";
        if (sort === "discussion")
          return status.key === "discussion" || status.key === "expert";
        return true;
      })
      .sort((a, b) => {
        const aStatus = inferStatus(a, repliesByTopic[a.id] ?? 0);
        const bStatus = inferStatus(b, repliesByTopic[b.id] ?? 0);
        const aReplies = repliesByTopic[a.id] ?? 0;
        const bReplies = repliesByTopic[b.id] ?? 0;
        const aDate = dayjs(a.createdAt).valueOf();
        const bDate = dayjs(b.createdAt).valueOf();

        if (sort === "fresh") return bDate - aDate;
        if (sort === "discussion") return bReplies - aReplies || bDate - aDate;
        if (sort === "answered")
          return topicRank(aStatus) - topicRank(bStatus) || bDate - aDate;
        return (
          topicRank(aStatus) - topicRank(bStatus) ||
          bReplies - aReplies ||
          bDate - aDate
        );
      });
  }, [activeSection, posts, repliesByTopic, search, sort]);

  const sectionList = useMemo(
    () =>
      sectionMeta.map((meta) => {
        const stats = sectionStats[meta.name];
        return {
          meta,
          topicsCount: stats?.topicsCount ?? 0,
          repliesCount: stats?.repliesCount ?? 0,
          bestAnswers: stats?.bestAnswers ?? 0,
          lastUpdate: stats?.lastUpdate ?? null,
        };
      }),
    [sectionStats],
  );

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <section className="forum-hero">
        <div className="forum-hero__copy">
          <Typography.Title level={1}>Форум отрасли</Typography.Title>
          <Typography.Paragraph className="forum-muted forum-hero__lead">
            Практическая база вопросов по агрономии, торговле и технике. Сразу
            видно, где нужен эксперт, где есть проверенный ответ и какие темы
            решаются сейчас.
          </Typography.Paragraph>
          <Space wrap size={[10, 10]} className="forum-hero__actions">
            <Button size="large" onClick={() => navigate("/forum/new")}>
              Создать тему
            </Button>
          </Space>
        </div>

        <div className="forum-hero__aside">
          <Alert
            type="success"
            showIcon
            message="Экспертные ответы подняты выше обычных обсуждений"
            description="Темы с проверенным ответом подсвечены зелёной рамкой и доступны в списке первым при сортировке по важности."
          />
        </div>
      </section>

      <div className="forum-stats-grid">
        {forumStats.map((item) => (
          <Card className="forum-stat-card" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </Card>
        ))}
      </div>

      <Card className="forum-toolbar-card">
        <div className="forum-toolbar">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Поиск по темам, тегам, культуре или региону"
            value={search}
            onChange={(event) => {
              const next = event.target.value;
              setSearch(next);
              setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                if (next.trim()) params.set("q", next.trim());
                else params.delete("q");
                return params;
              });
            }}
            className="forum-toolbar__search"
          />
          <Select
            value={activeSection}
            onChange={(value) =>
              setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                if (value === "all") params.delete("section");
                else params.set("section", value);
                return params;
              })
            }
            options={[
              { value: "all", label: "Все разделы" },
              ...sectionMeta.map((meta) => ({
                value: meta.id,
                label: meta.name,
              })),
            ]}
            className="forum-toolbar__select"
          />
          <Select
            value={sort}
            onChange={(value) =>
              setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                params.set("sort", value);
                return params;
              })
            }
            options={forumSortOptions}
            className="forum-toolbar__select"
          />
          <Button icon={<FilterOutlined />}>Фильтры</Button>
        </div>
      </Card>

      <section className="forum-sections-block">
        <SectionTitle
          title="Разделы форума"
          subtitle="Короткий вход в каждый раздел перед списком тем."
        />
        <Row gutter={[16, 16]}>
          {sectionList.map(
            ({ meta, topicsCount, repliesCount, bestAnswers, lastUpdate }) => (
              <Col key={meta.id} xs={24} md={12} xl={8}>
                <ForumSectionCard
                  meta={meta}
                  topicsCount={topicsCount}
                  repliesCount={repliesCount}
                  bestAnswers={bestAnswers}
                  lastUpdate={lastUpdate}
                  onClick={() => navigate(`/forum/section/${meta.id}`)}
                />
              </Col>
            ),
          )}
        </Row>
      </section>

      <div className="forum-layout forum-layout--section">
        <section className="forum-column forum-column--topics">
          <SectionTitle
            title="Темы форума"
            subtitle="Карточки идут во всю ширину и сортируются по важности, свежести и ответам."
            action={
              <Segmented
                value={sort}
                options={forumSortOptions}
                onChange={(value) =>
                  setSearchParams((prev) => {
                    const params = new URLSearchParams(prev);
                    params.set("sort", String(value));
                    return params;
                  })
                }
              />
            }
          />

          <Space direction="vertical" size={12}>
            {topicItems.length ? (
              topicItems.map((post) => (
                <ForumTopicCard
                  key={post.id}
                  post={post}
                  repliesCount={repliesByTopic[post.id] ?? 0}
                  views={forumTopicViews[post.id] ?? 0}
                  onClick={() => navigate(`/forum/topic/${post.id}`)}
                />
              ))
            ) : (
              <Card className="forum-empty-card">
                <Empty description="В этом форуме пока нет подходящих тем">
                  <Button type="primary" onClick={() => navigate("/forum/new")}>
                    Создать первую тему
                  </Button>
                </Empty>
              </Card>
            )}
          </Space>
        </section>
      </div>
    </Space>
  );
}

export function ForumSectionPage() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const posts = useAppStore((state) => state.posts);
  const replies = useAppStore((state) => state.replies);
  const forumTopicViews = useAppStore((state) => state.forumTopicViews);
  const [search, setSearch] = useState("");
  const [culture, setCulture] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");
  const [sort, setSort] = useState<"fresh" | "discussion" | "answered">(
    "fresh",
  );
  const sectionName = sectionMap[sectionId ?? "trade"] ?? "Торговля";
  const repliesByTopic = useMemo(() => countRepliesByTopic(replies), [replies]);

  const sectionAllPosts = useMemo(
    () => posts.filter((post) => post.section === sectionName),
    [posts, sectionName],
  );

  const sectionPosts = useMemo(
    () =>
      sectionAllPosts.filter((post) => {
        const meta = inferMeta(post);
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          `${post.title} ${post.content} ${post.tags.join(" ")} ${meta.culture} ${meta.region}`
            .toLowerCase()
            .includes(query);
        const matchesCulture = culture === "all" || meta.culture === culture;
        const matchesRegion = region === "all" || meta.region === region;
        return matchesSearch && matchesCulture && matchesRegion;
      }),
    [culture, region, search, sectionAllPosts],
  );

  const cultures = useMemo(
    () =>
      Array.from(
        new Set(sectionAllPosts.map((post) => inferMeta(post).culture)),
      ).sort(),
    [sectionAllPosts],
  );
  const regions = useMemo(
    () =>
      Array.from(
        new Set(sectionAllPosts.map((post) => inferMeta(post).region)),
      ).sort(),
    [sectionAllPosts],
  );

  const sortedPosts = useMemo(() => {
    const filtered = [...sectionPosts];

    filtered.sort((a, b) => {
      const aReplies = repliesByTopic[a.id] ?? 0;
      const bReplies = repliesByTopic[b.id] ?? 0;
      const aStatus = inferStatus(a, aReplies);
      const bStatus = inferStatus(b, bReplies);
      const aDate = dayjs(a.createdAt).valueOf();
      const bDate = dayjs(b.createdAt).valueOf();

      if (sort === "answered")
        return topicRank(aStatus) - topicRank(bStatus) || bDate - aDate;
      if (sort === "discussion") return bReplies - aReplies || bDate - aDate;
      return bDate - aDate;
    });

    return filtered;
  }, [repliesByTopic, sectionPosts, sort]);

  const sectionStats = useMemo(() => {
    const topicsCount = posts.filter(
      (post) => post.section === sectionName,
    ).length;
    const resolvedCount = posts.filter(
      (post) => post.section === sectionName && post.verifiedAnswer,
    ).length;
    const waitingCount = posts.filter(
      (post) =>
        post.section === sectionName &&
        inferStatus(post, repliesByTopic[post.id] ?? 0).key === "expert",
    ).length;
    const weekCount = sortedPosts.filter(
      (post) => dayjs().diff(dayjs(post.createdAt), "day") <= 7,
    ).length;
    return { topicsCount, resolvedCount, waitingCount, weekCount };
  }, [posts, repliesByTopic, sectionName, sortedPosts]);

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Breadcrumb
        items={[
          {
            title: (
              <Typography.Link onClick={() => navigate("/forum")}>
                Форум
              </Typography.Link>
            ),
          },
          { title: sectionName },
        ]}
      />

      <section className="forum-hero forum-hero--section">
        <div className="forum-hero__copy">
          <Typography.Title level={1}>{sectionName}</Typography.Title>
          <Typography.Paragraph className="forum-muted forum-hero__lead">
            Быстрое чтение тем внутри раздела, фильтрация по культуре и региону,
            а также приоритет тем, где нужен эксперт.
          </Typography.Paragraph>
          <Space wrap size={[10, 10]}>
            <Button type="primary" onClick={() => navigate("/forum/new")}>
              Создать тему
            </Button>
            <Button onClick={() => navigate("/forum?sort=important")}>
              Подписаться
            </Button>
          </Space>
        </div>

        <div className="forum-hero__aside">
          <div className="forum-mini-stats">
            <div>
              <strong>{sectionStats.topicsCount}</strong>
              <span>тем</span>
            </div>
            <div>
              <strong>{sectionStats.resolvedCount}</strong>
              <span>решены</span>
            </div>
            <div>
              <strong>{sectionStats.waitingCount}</strong>
              <span>ждут эксперта</span>
            </div>
            <div>
              <strong>{sectionStats.weekCount}</strong>
              <span>новых за неделю</span>
            </div>
          </div>
        </div>
      </section>

      <Card className="forum-toolbar-card">
        <div className="forum-toolbar forum-toolbar--section">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Поиск по теме, тегам и описанию"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="forum-toolbar__search"
          />
          <Select
            value={culture}
            onChange={setCulture}
            options={[
              { value: "all", label: "Любая культура" },
              ...cultures.map((item) => ({ value: item, label: item })),
            ]}
            className="forum-toolbar__select"
          />
          <Select
            value={region}
            onChange={setRegion}
            options={[
              { value: "all", label: "Любой регион" },
              ...regions.map((item) => ({ value: item, label: item })),
            ]}
            className="forum-toolbar__select"
          />
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: "fresh", label: "Свежие" },
              { value: "discussion", label: "Обсуждаемые" },
              { value: "answered", label: "Есть проверенный ответ" },
            ]}
            className="forum-toolbar__select"
          />
        </div>
      </Card>

      <div className="forum-layout forum-layout--section">
        <section className="forum-column forum-column--topics">
          <SectionTitle
            title="Темы раздела"
            subtitle="Полные карточки тем с приоритетом для вопросов, где нужен эксперт."
          />

          <Space direction="vertical" size={12}>
            {sortedPosts.length ? (
              sortedPosts.map((post) => (
                <ForumTopicCard
                  key={post.id}
                  post={post}
                  repliesCount={repliesByTopic[post.id] ?? 0}
                  views={forumTopicViews[post.id] ?? 0}
                  compact
                  onClick={() => navigate(`/forum/topic/${post.id}`)}
                />
              ))
            ) : (
              <Card className="forum-empty-card">
                <Empty description="В этом разделе пока нет подходящих тем">
                  <Button type="primary" onClick={() => navigate("/forum/new")}>
                    Создать первую тему
                  </Button>
                </Empty>
              </Card>
            )}
          </Space>
        </section>

        <aside className="forum-column forum-column--sidebar">
          <ForumSidebarCard title="Эксперты раздела">
            <Space
              direction="vertical"
              size={10}
              className="forum-sidebar-list"
            >
              <div className="forum-expert-item">
                <div className="forum-expert-item__avatar">Э1</div>
                <div>
                  <strong>СГАА</strong>
                  <span>Агрономия и питание растений</span>
                </div>
              </div>
              <div className="forum-expert-item">
                <div className="forum-expert-item__avatar">Э2</div>
                <div>
                  <strong>Эксперт портала</strong>
                  <span>Торговля, договоры, качество партий</span>
                </div>
              </div>
              <div className="forum-expert-item">
                <div className="forum-expert-item__avatar">Э3</div>
                <div>
                  <strong>Инженер-технолог</strong>
                  <span>Хранение, техника, сервис</span>
                </div>
              </div>
            </Space>
          </ForumSidebarCard>

          <ForumSidebarCard title="Мои заявки">
            <Space direction="vertical" size={10}>
              <Typography.Paragraph className="forum-muted">
                Отслеживайте заявки, редактируйте черновики и отзывайте их, пока
                они на рассмотрении.
              </Typography.Paragraph>
              <Button
                type="primary"
                onClick={() => navigate("/forum/applications")}
              >
                Открыть страницу заявок
              </Button>
            </Space>
          </ForumSidebarCard>

          <ForumSidebarCard title="Популярные теги">
            <ForumTagCloud
              tags={[
                "#пшеница",
                "#логистика",
                "#документы",
                "#экспорт",
                "#качество",
                "#севооборот",
              ]}
            />
          </ForumSidebarCard>

          <ForumSidebarCard title="Быстрый ориентир">
            <div className="forum-summary-list">
              <div>
                <span>Решено</span>
                <strong>{sectionStats.resolvedCount}</strong>
              </div>
              <div>
                <span>Ждут эксперта</span>
                <strong>{sectionStats.waitingCount}</strong>
              </div>
              <div>
                <span>Новых за неделю</span>
                <strong>{sectionStats.weekCount}</strong>
              </div>
            </div>
          </ForumSidebarCard>
        </aside>
      </div>
    </Space>
  );
}

export function ForumTopicPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const posts = useAppStore((state) => state.posts);
  const replies = useAppStore((state) => state.replies);
  const forumExperts = useAppStore((state) => state.forumExperts);
  const forumTopicViews = useAppStore((state) => state.forumTopicViews);
  const addReply = useAppStore((state) => state.addReply);
  const voteForumReply = useAppStore((state) => state.voteForumReply);
  const markForumTopicViewed = useAppStore(
    (state) => state.markForumTopicViewed,
  );
  const [replyTargetName, setReplyTargetName] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<DraftAttachment[]>(
    [],
  );
  const [topicReactions, setTopicReactions] = useState({
    likes: 0,
    dislikes: 0,
  });
  const [topicReactionVote, setTopicReactionVote] = useState<
    "like" | "dislike" | null
  >(null);
  const [attachmentViewer, setAttachmentViewer] =
    useState<ForumAttachmentView | null>(null);
  const [lastSubmittedReplyId, setLastSubmittedReplyId] = useState<
    string | null
  >(null);
  const currentUser = users.find((user) => user.id === currentUserId) ?? null;
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const topic = posts.find((item) => item.id === topicId) ?? null;
  const topicReplies = topic
    ? replies.filter((item) => item.postId === topic.id)
    : [];

  useEffect(() => {
    if (topic) {
      markForumTopicViewed(topic.id);
    }
  }, [markForumTopicViewed, topic]);

  useEffect(() => {
    if (!lastSubmittedReplyId) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById(`forum-reply-${lastSubmittedReplyId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      setLastSubmittedReplyId(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [lastSubmittedReplyId]);

  if (!topic) {
    return (
      <Card className="forum-empty-card">
        <Empty description="Тема не найдена">
          <Button type="primary" onClick={() => navigate("/forum")}>
            Вернуться к форуму
          </Button>
        </Empty>
      </Card>
    );
  }

  const status = inferStatus(topic, topicReplies.length);
  const meta = inferMeta(topic);
  const firstReply = topicReplies[0] ?? null;
  const sectionExperts = forumExperts.filter(
    (expert) => expert.section === topic.section,
  );
  const viewCount = topicViews(
    topicReplies.length,
    Boolean(topic.verifiedAnswer),
    forumTopicViews[topic.id] ?? 0,
  );
  const replyPrompt = replyTargetName
    ? `Ответ пользователю: ${replyTargetName}`
    : "Ответить в теме";
  const topicAttachments: ForumAttachmentView[] = topic.attachments?.length
    ? topic.attachments
    : topic.mediaUrl
      ? [
          {
            url: topic.mediaUrl,
            type: topic.mediaType ?? "file",
            name: topic.mediaName ?? "Вложение",
          },
        ]
      : [];
  const startReplyTo = (name: string) => {
    setReplyTargetName(name);
    const prefix = `${name}, `;
    setReplyContent((current) => {
      if (!current.trim()) {
        return prefix;
      }
      return current.startsWith(prefix) ? current : `${prefix}\n\n${current}`;
    });
    document
      .getElementById("forum-reply-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const voteTopic = (vote: "like" | "dislike") => {
    if (topicReactionVote === vote) return;
    setTopicReactions((state) =>
      !topicReactionVote
        ? vote === "like"
          ? { likes: state.likes + 1, dislikes: state.dislikes }
          : { likes: state.likes, dislikes: state.dislikes + 1 }
        : vote === "like"
          ? {
              likes: state.likes + 1,
              dislikes: Math.max(0, state.dislikes - 1),
            }
          : {
              likes: Math.max(0, state.likes - 1),
              dislikes: state.dislikes + 1,
            },
    );
    setTopicReactionVote(vote);
  };

  const handleReplyFiles = async (files?: FileList | File[] | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    const items: DraftAttachment[] = [];
    for (const file of selected) {
      if (file.size > 20 * 1024 * 1024) {
        message.error(`Файл ${file.name} превышает 20 МБ`);
        continue;
      }
      items.push(await fileToAttachment(file));
    }
    if (items.length) {
      setReplyAttachments((current) => [...current, ...items].slice(0, 4));
    }
  };

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Breadcrumb
        items={[
          {
            title: (
              <Typography.Link onClick={() => navigate("/forum")}>
                Форум
              </Typography.Link>
            ),
          },
          {
            title: (
              <Typography.Link
                onClick={() =>
                  navigate(`/forum/section/${sectionIdForName(topic.section)}`)
                }
              >
                {topic.section}
              </Typography.Link>
            ),
          },
          { title: topic.title },
        ]}
      />

      <section className="forum-topic-hero">
        <div className="forum-topic-hero__copy">
          <Space wrap size={[8, 8]}>
            <Tag className="forum-chip forum-chip--outline">
              {topic.section}
            </Tag>
            <ForumStatusTag status={status} />
            <ForumTagCloud tags={topic.tags} />
          </Space>
          <Typography.Title level={1}>{topic.title}</Typography.Title>
          <Typography.Paragraph className="forum-muted forum-hero__lead">
            {topic.content}
          </Typography.Paragraph>
          {topicAttachments.length > 0 && (
            <Space wrap size={[10, 10]} className="forum-message__attachments">
              {topicAttachments.map((attachment) => (
                <AttachmentCard
                  key={`${attachment.name}-${attachment.url}`}
                  attachment={attachment}
                  compact
                  onOpen={(value) => setAttachmentViewer(value)}
                />
              ))}
            </Space>
          )}
          <Space wrap size={[14, 10]} className="forum-topic-hero__meta">
            <span>
              <UserOutlined /> {topic.authorName}
            </span>
            <span>
              <ClockCircleOutlined /> {formatDate(topic.createdAt)}
            </span>
            <span>
              <EnvironmentOutlined /> {meta.region}
            </span>
            <span>
              <TagOutlined /> {meta.culture}
            </span>
            <span>
              <EyeOutlined /> {viewCount} просмотров
            </span>
            <span>
              <MessageOutlined /> {topicReplies.length} ответов
            </span>
          </Space>
        </div>

        <div className="forum-topic-hero__actions">
          <Button
            icon={<ArrowRightOutlined />}
            type="primary"
            onClick={() =>
              document
                .getElementById("forum-reply-form")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Ответить
          </Button>
        </div>
      </section>

      <div className="forum-layout forum-layout--topic">
        <section className="forum-column forum-column--thread">
          <SectionTitle
            title="Лента сообщений"
            subtitle="Первый вопрос автора, затем ответы и лучший ответ"
          />

          <div className="forum-thread">
            <TopicMessage
              id={`forum-reply-${topic.id}`}
              author={topic.authorName}
              role="Автор темы"
              date={topic.createdAt}
              content={topic.content}
              attachments={topicAttachments}
              accent
              likes={topicReactions.likes}
              dislikes={topicReactions.dislikes}
              onComment={() => startReplyTo(topic.authorName)}
              onLike={() => voteTopic("like")}
              onDislike={() => voteTopic("dislike")}
              onOpenAttachment={(value) => setAttachmentViewer(value)}
            />

            {topicReplies.length ? (
              topicReplies.map((reply, index) => (
                <TopicMessage
                  key={reply.id}
                  id={`forum-reply-${reply.id}`}
                  author={reply.authorName}
                  role={
                    reply.status === "pending"
                      ? "Участник"
                      : index === 0 && topic.verifiedAnswer
                        ? "Эксперт"
                        : index === 0
                          ? "Участник"
                          : "Проверенный участник"
                  }
                  date={reply.createdAt}
                  content={reply.content}
                  replyToAuthorName={reply.replyToAuthorName}
                  attachments={
                    reply.attachments?.length
                      ? reply.attachments
                      : reply.mediaUrl
                        ? [
                            {
                              url: reply.mediaUrl,
                              type: reply.mediaType ?? "file",
                              name: reply.mediaName ?? "Вложение",
                            },
                          ]
                        : undefined
                  }
                  best={index === 0 && Boolean(topic.verifiedAnswer)}
                  accent={index === 0 && Boolean(topic.verifiedAnswer)}
                  pending={reply.status === "pending"}
                  likes={reply.likes ?? 0}
                  dislikes={reply.dislikes ?? 0}
                  onComment={() => startReplyTo(reply.authorName)}
                  onLike={() => voteForumReply(reply.id, "like")}
                  onDislike={() => voteForumReply(reply.id, "dislike")}
                  onOpenAttachment={(value) => setAttachmentViewer(value)}
                />
              ))
            ) : (
              <Alert
                type="warning"
                showIcon
                message="Пока нет ответов"
                description="Тема будет показываться как без ответа до появления первого сообщения."
              />
            )}

            <Card id="forum-reply-form" className="forum-answer-box">
              <SectionTitle
                title={replyPrompt}
                subtitle="Фото, видео и документы добавляются одной кнопкой"
              />
              <Form
                layout="vertical"
                onFinish={async () => {
                  if (!currentUser) {
                    message.warning("Сначала войдите в аккаунт");
                    navigate("/auth");
                    return;
                  }

                  const content = replyContent.trim();
                  if (!content) {
                    message.warning("Введите текст ответа");
                    return;
                  }

                  const submittedReplyId = await addReply({
                    postId: topic.id,
                    authorId: currentUser.id,
                    authorName: currentUser.name,
                    rating: 4.8,
                    content,
                    replyToAuthorName: replyTargetName ?? undefined,
                    mediaUrl: replyAttachments[0]?.url,
                    mediaType: replyAttachments[0]?.type,
                    mediaName: replyAttachments[0]?.name,
                    attachments: replyAttachments.map((attachment) => ({
                      id: attachment.id,
                      name: attachment.name,
                      type: attachment.type,
                      url: attachment.url,
                      mimeType: attachment.mimeType,
                      size: attachment.size,
                    })),
                  });

                  message.success("Ответ добавлен и отправлен на модерацию");
                  setLastSubmittedReplyId(submittedReplyId);
                  setReplyContent("");
                  setReplyTargetName(null);
                  setReplyAttachments([]);
                }}
              >
                <Form.Item label="Ваш ответ" required>
                  <ForumMarkdownEditor
                    value={replyContent}
                    onChange={setReplyContent}
                    placeholder="Напишите ответ. Markdown можно использовать прямо в редакторе. Фото, видео и документы прикрепляются одной кнопкой ниже."
                  />
                </Form.Item>

                <Space
                  direction="vertical"
                  size={10}
                  className="forum-reply-tools"
                  style={{ width: "100%" }}
                >
                  {replyTargetName && (
                    <Tag className="forum-chip forum-chip--outline">
                      Ответ пользователю: {replyTargetName}
                    </Tag>
                  )}
                  {replyAttachments.length > 0 && (
                    <div className="forum-draft-attachment-list">
                      {replyAttachments.map((attachment) => (
                        <DraftAttachmentRow
                          key={attachment.id}
                          attachment={attachment}
                          onOpen={(value) => setAttachmentViewer(value)}
                          onRemove={() =>
                            setReplyAttachments((current) =>
                              current.filter(
                                (item) => item.id !== attachment.id,
                              ),
                            )
                          }
                        />
                      ))}
                    </div>
                  )}
                </Space>

                <div className="forum-answer-box__actions">
                  <Space wrap>
                    <Button
                      onClick={() => replyFileInputRef.current?.click()}
                      icon={<UploadOutlined />}
                    >
                      Прикрепить медиа/файлы
                    </Button>
                    <Button
                      onClick={() => setReplyAttachments([])}
                      disabled={!replyAttachments.length}
                    >
                      Убрать вложения
                    </Button>
                    <Button type="primary" htmlType="submit">
                      Опубликовать ответ
                    </Button>
                  </Space>
                </div>

                <input
                  ref={replyFileInputRef}
                  type="file"
                  className="forum-hidden-input"
                  style={{ display: "none" }}
                  multiple
                  accept="image/*,video/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(event) => {
                    void handleReplyFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </Form>
            </Card>
          </div>
        </section>

        <aside className="forum-column forum-column--sidebar">
          <ForumSidebarCard title="Сводка темы">
            <div className="forum-summary-list forum-summary-list--vertical">
              <div>
                <span>Статус</span>
                <strong>{status.label}</strong>
              </div>
              <div>
                <span>Ответы</span>
                <strong>{topicReplies.length}</strong>
              </div>
              <div>
                <span>Просмотры</span>
                <strong>{viewCount}</strong>
              </div>
              <div>
                <span>Последняя активность</span>
                <strong>
                  {topicReplies.at(-1)?.createdAt
                    ? formatShortDate(topicReplies.at(-1)!.createdAt)
                    : formatShortDate(topic.createdAt)}
                </strong>
              </div>
            </div>
          </ForumSidebarCard>

          <ForumSidebarCard title="По теме">
            <Space
              direction="vertical"
              size={8}
              className="forum-sidebar-links"
            >
              <Typography.Link onClick={() => navigate("/prices")}>
                Виджет цен по культуре
              </Typography.Link>
              <Typography.Link onClick={() => navigate("/analytics")}>
                Материалы и аналитика
              </Typography.Link>
              <Typography.Link
                onClick={() => navigate("/forum?sort=important")}
              >
                Активные эксперты
              </Typography.Link>
            </Space>
          </ForumSidebarCard>

          <ForumSidebarCard title="Популярные теги">
            <ForumTagCloud
              tags={
                topic.tags.length
                  ? topic.tags
                  : ["#пшеница", "#логистика", "#экспорт", "#документы"]
              }
            />
          </ForumSidebarCard>

          <ForumSidebarCard title="Эксперты темы">
            <ForumExpertsList experts={sectionExperts} />
          </ForumSidebarCard>

          <ForumSidebarCard title="Стать экспертом по теме">
            {currentUser ? (
              <Space direction="vertical" size={10}>
                <Typography.Paragraph className="forum-muted">
                  Заявку теперь удобно отслеживать на отдельной странице. Там же
                  можно отозвать или отредактировать черновик.
                </Typography.Paragraph>
                <Button
                  type="primary"
                  onClick={() =>
                    navigate(
                      `/forum/applications?section=${sectionIdForName(topic.section)}&topicId=${topic.id}`,
                    )
                  }
                >
                  Подать заявку
                </Button>
              </Space>
            ) : (
              <Space direction="vertical" size={10}>
                <Typography.Paragraph className="forum-muted">
                  Войдите, чтобы отправить заявку именно по этой теме.
                </Typography.Paragraph>
                <Button type="primary" onClick={() => navigate("/auth")}>
                  Войти
                </Button>
              </Space>
            )}
          </ForumSidebarCard>

          {firstReply && (
            <ForumSidebarCard title="Лучший ответ">
              <div className="forum-best-answer">
                <Typography.Text strong>
                  {firstReply.authorName}
                </Typography.Text>
                <Typography.Paragraph className="forum-muted">
                  {firstReply.content}
                </Typography.Paragraph>
                {topic.verifiedAnswer && (
                  <Typography.Text
                    type="secondary"
                    className="forum-best-answer__hint"
                  >
                    Проверенный ответ поднят выше остальных сообщений.
                  </Typography.Text>
                )}
              </div>
            </ForumSidebarCard>
          )}
        </aside>
      </div>

      <AttachmentViewerModal
        attachment={attachmentViewer}
        onClose={() => setAttachmentViewer(null)}
      />
    </Space>
  );
}

export function ForumCreateTopicPage() {
  const navigate = useNavigate();
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const addPost = useAppStore((state) => state.addPost);
  const [form] = Form.useForm();
  const [draftTags, setDraftTags] = useState<string[]>([
    "#пшеница",
    "#севооборот",
    "#смоленск",
  ]);
  const [tagInput, setTagInput] = useState("");
  const [draftAttachments, setDraftAttachments] = useState<DraftAttachment[]>(
    [],
  );
  const [attachmentViewer, setAttachmentViewer] =
    useState<ForumAttachmentView | null>(null);
  const topicFileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = users.find((user) => user.id === currentUserId) ?? null;
  const watchedSection = Form.useWatch("section", form) ?? "Торговля";
  const watchedTitle = Form.useWatch("title", form) ?? "Новая тема форума";
  const watchedContent =
    Form.useWatch("content", form) ??
    "Опишите вопрос, условия и ожидаемый результат. Это помогает быстрее получить качественный ответ.";
  const previewAttachments = draftAttachments.map((attachment) => ({
    url: attachment.url,
    type: attachment.type,
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
  }));

  const previewPost: ForumPost = {
    id: "preview",
    section: watchedSection as ForumPost["section"],
    authorId: currentUser?.id ?? "u_buyer_1",
    authorName: currentUser?.name ?? "Пользователь портала",
    title: watchedTitle,
    content: watchedContent,
    tags: draftTags,
    createdAt: new Date().toISOString(),
    mediaUrl: previewAttachments[0]?.url,
    mediaType: previewAttachments[0]?.type,
    mediaName: previewAttachments[0]?.name,
    attachments: previewAttachments.map((attachment, index) => ({
      id: `preview-${index}`,
      name: attachment.name,
      type: attachment.type,
      url: attachment.url,
      mimeType: attachment.mimeType,
      size: attachment.size,
    })),
    verifiedAnswer: undefined,
  };

  const templateTags = [
    "#пшеница",
    "#логистика",
    "#документы",
    "#качество",
    "#экспорт",
  ];
  const checklist = [
    "Раздел выбран и соответствует теме",
    "Заголовок укладывается в 90 символов",
    "Описание содержит минимум 120 символов",
    "Добавлены 3–5 тегов",
    "Есть контекст по культуре и региону",
  ];

  const addTag = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    const tag = normalized.startsWith("#") ? normalized : `#${normalized}`;
    setDraftTags((current) => {
      if (current.some((item) => item.toLowerCase() === tag.toLowerCase())) {
        return current;
      }
      return [...current, tag];
    });
    setTagInput("");
  };

  const addTopicAttachments = async (files?: FileList | File[]) => {
    if (!files || !files.length) return;
    const selected = Array.from(files);
    const attachments: DraftAttachment[] = [];
    for (const file of selected) {
      if (file.size > 20 * 1024 * 1024) {
        message.error(`Файл ${file.name} превышает 20 МБ`);
        continue;
      }
      attachments.push(await fileToAttachment(file));
    }
    if (attachments.length) {
      setDraftAttachments((current) =>
        [...current, ...attachments].slice(0, 5),
      );
    }
  };

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <section className="forum-hero forum-hero--create">
        <div className="forum-hero__copy">
          <Typography.Title level={1}>Новая тема форума</Typography.Title>
          <Typography.Paragraph className="forum-muted forum-hero__lead">
            Разделите вопрос на смысловые блоки, добавьте теги-чипы и проверьте
            предпросмотр перед публикацией.
          </Typography.Paragraph>
        </div>
        <Space wrap size={[10, 10]}>
          <Button onClick={() => message.info("Черновик сохранён локально")}>
            Сохранить черновик
          </Button>
          <Button type="primary" onClick={() => form.submit()}>
            Опубликовать тему
          </Button>
        </Space>
      </section>

      <div className="forum-layout forum-layout--create">
        <section className="forum-column forum-column--form">
          <Card className="forum-form-card">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                section: "Торговля",
                culture: undefined,
                region: undefined,
                title: "",
                content: "",
              }}
              onFinish={(values) => {
                if (!currentUser) {
                  message.warning("Сначала войдите в аккаунт");
                  navigate("/auth");
                  return;
                }
                void addPost({
                  section: values.section,
                  authorId: currentUser.id,
                  authorName: currentUser.name,
                  title: values.title,
                  content: values.content,
                  tags: draftTags,
                  mediaUrl: previewAttachments[0]?.url,
                  mediaType: previewAttachments[0]?.type,
                  mediaName: previewAttachments[0]?.name,
                  attachments: previewAttachments.map((attachment, index) => ({
                    id: `topic-${index}-${attachment.name}`,
                    name: attachment.name,
                    type: attachment.type,
                    url: attachment.url,
                    mimeType: attachment.mimeType,
                    size: attachment.size,
                  })),
                });
                message.success("Тема опубликована");
                setDraftTags(["#пшеница", "#севооборот", "#смоленск"]);
                setDraftAttachments([]);
                setTagInput("");
                form.resetFields();
                navigate("/forum");
              }}
            >
              <div className="forum-form-section">
                <SectionTitle title="Куда публикуем" />
                <Row gutter={[12, 12]}>
                  <Col xs={24} lg={8}>
                    <Form.Item
                      label="Раздел"
                      name="section"
                      rules={[{ required: true, message: "Выберите раздел" }]}
                    >
                      <Select
                        options={forumSections.map((section) => ({
                          value: section,
                          label: section,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Form.Item label="Культура" name="culture">
                      <Select
                        allowClear
                        options={cultureOptions.map((item) => ({
                          value: item,
                          label: item,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Form.Item label="Регион" name="region">
                      <Select
                        allowClear
                        options={regionOptions.map((item) => ({
                          value: item,
                          label: item,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              <div className="forum-form-section">
                <SectionTitle title="Вопрос" />
                <Form.Item
                  label="Заголовок"
                  name="title"
                  rules={[{ required: true, message: "Введите заголовок" }]}
                >
                  <Input
                    maxLength={90}
                    placeholder="Кратко и конкретно сформулируйте вопрос"
                  />
                </Form.Item>
                <Form.Item
                  label="Подробное описание"
                  name="content"
                  rules={[
                    { required: true, message: "Введите подробное описание" },
                  ]}
                >
                  <ForumMarkdownEditor placeholder="Опишите ситуацию, уточните условия и ожидаемый результат. Markdown можно использовать прямо в редакторе." />
                </Form.Item>
              </div>

              <div className="forum-form-section">
                <SectionTitle
                  title="Теги и файлы"
                  subtitle="Теги вводятся чипами, а файлы добавляются через отдельную зону"
                />

                <Form.Item label="Теги">
                  <div className="forum-tag-input">
                    {draftTags.map((tag) => (
                      <Tag
                        key={tag}
                        closable
                        className="forum-chip forum-chip--outline"
                        onClose={(event) => {
                          event.preventDefault();
                          setDraftTags((current) =>
                            current.filter((item) => item !== tag),
                          );
                        }}
                      >
                        {tag}
                      </Tag>
                    ))}
                    <Input
                      value={tagInput}
                      placeholder="#пшеница"
                      onChange={(event) => setTagInput(event.target.value)}
                      onPressEnter={() => addTag(tagInput)}
                      onBlur={() => addTag(tagInput)}
                    />
                  </div>
                  <Typography.Text type="secondary" className="forum-help-text">
                    Рекомендуем 3–5 тегов для точной фильтрации и поиска.
                  </Typography.Text>
                </Form.Item>

                <div
                  className="forum-dropzone forum-dropzone--interactive"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    void addTopicAttachments(event.dataTransfer.files);
                  }}
                  onClick={() => topicFileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <PaperClipOutlined />
                  <Typography.Title level={4}>
                    Перетащите файлы сюда
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    PDF, JPG, PNG или XLSX до 20 МБ
                  </Typography.Text>
                  <Space wrap size={8} className="forum-form-files">
                    <Button
                      icon={<UploadOutlined />}
                      onClick={(event) => {
                        event.stopPropagation();
                        topicFileInputRef.current?.click();
                      }}
                    >
                      Прикрепить медиа/файлы
                    </Button>
                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        setDraftAttachments([]);
                      }}
                      disabled={!draftAttachments.length}
                    >
                      Очистить
                    </Button>
                  </Space>
                  {draftAttachments.length > 0 && (
                    <div className="forum-draft-attachment-list forum-draft-attachment-list--compact">
                      {draftAttachments.map((file) => (
                        <DraftAttachmentRow
                          key={file.id}
                          attachment={file}
                          onRemove={() =>
                            setDraftAttachments((current) =>
                              current.filter((item) => item.id !== file.id),
                            )
                          }
                          onOpen={(value) => setAttachmentViewer(value)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <input
                  ref={topicFileInputRef}
                  type="file"
                  className="forum-hidden-input"
                  style={{ display: "none" }}
                  multiple
                  accept="image/*,video/*,application/pdf,.xlsx,.xls"
                  onChange={(event) => {
                    void addTopicAttachments(event.target.files ?? undefined);
                    event.target.value = "";
                  }}
                />
              </div>
            </Form>
          </Card>
        </section>

        <aside className="forum-column forum-column--sidebar">
          <ForumSidebarCard title="Чеклист качества">
            <Space direction="vertical" size={8} className="forum-checklist">
              {checklist.map((item, index) => (
                <div key={item} className="forum-checklist__item">
                  <CheckCircleOutlined />
                  <span>
                    {index < 3 || draftTags.length >= 3 ? item : item}
                  </span>
                </div>
              ))}
            </Space>
          </ForumSidebarCard>

          <ForumSidebarCard title="Предпросмотр карточки">
            <ForumTopicCard
              post={previewPost}
              repliesCount={0}
              compact
              onClick={() => void 0}
            />
            {previewAttachments.length > 0 && (
              <Space wrap size={[8, 8]} className="forum-message__attachments">
                {previewAttachments.map((attachment) => (
                  <AttachmentCard
                    key={`${attachment.name}-${attachment.url}`}
                    attachment={attachment}
                    compact
                    onOpen={(value) => setAttachmentViewer(value)}
                  />
                ))}
              </Space>
            )}
          </ForumSidebarCard>

          <ForumSidebarCard title="Шаблон описания">
            <div className="forum-template">
              <Typography.Paragraph>
                1. Что именно случилось?
                <br />
                2. В какой культуре, регионе или сделке это произошло?
                <br />
                3. Какие документы, фото или цифры уже есть?
                <br />
                4. Какой результат нужен от эксперта?
              </Typography.Paragraph>
              <Space wrap size={[8, 8]}>
                {templateTags.map((tag) => (
                  <Tag
                    key={tag}
                    className="forum-chip forum-chip--outline"
                    onClick={() => addTag(tag)}
                  >
                    {tag}
                  </Tag>
                ))}
              </Space>
            </div>
          </ForumSidebarCard>
        </aside>
      </div>

      <AttachmentViewerModal
        attachment={attachmentViewer}
        onClose={() => setAttachmentViewer(null)}
      />
    </Space>
  );
}
