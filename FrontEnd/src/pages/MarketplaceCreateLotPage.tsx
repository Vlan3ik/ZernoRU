import {
  AppstoreOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FormOutlined,
  PictureOutlined,
  QuestionCircleOutlined,
  TrophyOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  AutoComplete,
  Button,
  Card,
  Col,
  Form,
  type FormInstance,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Steps,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAppStore } from "../store/appStore";
import type { EquipmentLot, ForumAttachment, GrainLot } from "../types/domain";
import {
  normalizeUploadFile,
  type NormalizedUploadFile,
} from "../utils/mediaUpload";

type CreateLotCategory = "grain" | "equipment" | "service";
type SaleFormat = "direct" | "auction";
type FileSlotKey = "cover" | "doc1" | "doc2" | "doc3";
type UploadTarget = FileSlotKey | "gallery";

interface FileSlotConfig {
  key: FileSlotKey;
  label: string;
  accept: string;
  required?: boolean;
  helper: string;
  tooltip: string;
}

interface CreateLotFormValues {
  category: CreateLotCategory;
  title: string;
  region: string;
  saleFormat: SaleFormat;
  price: number;
  description: string;
  grainType?: GrainLot["grainType"];
  grade?: string;
  volumeTons?: number;
  qualityScore?: number;
  hasOwnTransport?: boolean;
  equipmentType?: string;
  brand?: string;
  model?: string;
  year?: number;
  condition?: EquipmentLot["condition"];
  operatingHours?: number;
  enginePowerHp?: number;
  ownershipStatus?: string;
  serviceType?: string;
  unit?: string;
  auctionStep?: number;
  auctionDurationHours?: number;
  auctionStartAt?: string;
}

const createLotSchema = z.object({
  category: z.enum(["grain", "equipment", "service"]),
  title: z.string().trim().min(3, "Название карточки слишком короткое"),
  region: z.string().trim().min(2, "Укажите регион"),
  saleFormat: z.enum(["direct", "auction"]),
  price: z.coerce.number().min(0, "Укажите цену"),
  description: z.string().trim().optional(),
  grainType: z.string().trim().optional(),
  grade: z.string().trim().optional(),
  volumeTons: z.coerce.number().optional(),
  qualityScore: z.coerce.number().optional(),
  hasOwnTransport: z.coerce.boolean().optional(),
  equipmentType: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  year: z.coerce.number().optional(),
  condition: z.enum(["new", "used"]).optional(),
  operatingHours: z.coerce.number().optional(),
  enginePowerHp: z.coerce.number().optional(),
  ownershipStatus: z.string().trim().optional(),
  serviceType: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  auctionStep: z.coerce.number().optional(),
  auctionDurationHours: z.coerce.number().optional(),
  auctionStartAt: z.string().trim().optional(),
});

const categorySteps = [
  {
    key: "category",
    title: "Категория",
    description: "Сначала выберите тип лота",
    icon: <AppstoreOutlined />,
  },
  {
    key: "details",
    title: "Параметры",
    description: "Поля зависят от выбранной категории",
    icon: <FormOutlined />,
  },
  {
    key: "media",
    title: "Файлы",
    description: "Фото, видео и документы",
    icon: <PictureOutlined />,
  },
  {
    key: "review",
    title: "Публикация",
    description: "Проверка данных перед отправкой",
    icon: <CheckCircleOutlined />,
  },
];

const grainSlots: FileSlotConfig[] = [
  {
    key: "cover",
    label: "Обложка",
    accept: "image/*",
    required: true,
    helper: "Первое фото партии зерна",
    tooltip: "Главное фото, которое покупатель увидит в карточке лота.",
  },
  {
    key: "doc1",
    label: "Ветсертификат / Меркурий",
    accept: ".pdf,.jpg,.jpeg,.png,.xlsx,.xls,image/*",
    required: true,
    helper: "Сертификат или фото документа по партии",
    tooltip: "Загрузите выгрузку из Меркурия, сертификат или фото документа, подтверждающего происхождение партии.",
  },
  {
    key: "doc2",
    label: "Декларация соответствия",
    accept: ".pdf,.jpg,.jpeg,.png,.xlsx,.xls,image/*",
    required: true,
    helper: "Скан декларации соответствия",
    tooltip: "Документ с подтверждением соответствия партии требованиям качества и безопасности.",
  },
  {
    key: "doc3",
    label: "Договор хранения / склад",
    accept: ".pdf,.jpg,.jpeg,.png,.xlsx,.xls,image/*",
    required: true,
    helper: "Подтверждение места хранения партии",
    tooltip: "Договор хранения, складская расписка или другой документ, подтверждающий, где находится зерно.",
  },
];

const equipmentSlots: FileSlotConfig[] = [
  {
    key: "cover",
    label: "Обложка",
    accept: "image/*",
    required: true,
    helper: "Главное фото техники",
    tooltip: "Фото техники снаружи, которое будет отображаться первым в карточке.",
  },
  {
    key: "doc1",
    label: "ПСМ / паспорт техники",
    accept: ".pdf,.jpg,.jpeg,.png,image/*",
    required: true,
    helper: "Паспорт самоходной машины, СТС или аналог",
    tooltip: "Документ, по которому можно идентифицировать технику: ПСМ, СТС, паспорт агрегата или заводской паспорт.",
  },
  {
    key: "doc2",
    label: "Документ собственности",
    accept: ".pdf,.jpg,.jpeg,.png,image/*",
    required: true,
    helper: "Договор купли-продажи, счет или акт",
    tooltip: "Документ, который подтверждает право владения или законность продажи техники.",
  },
  {
    key: "doc3",
    label: "Диагностика / сервисная история",
    accept: ".pdf,.jpg,.jpeg,.png,image/*,video/*",
    helper: "Акт диагностики, сервисная книжка, фото шильдика или видео работы",
    tooltip: "Необязательно, но помогает покупателю: диагностика, сервисная история, фото таблички VIN/серийного номера или видео запуска.",
  },
];

const serviceSlots: FileSlotConfig[] = [
  {
    key: "cover",
    label: "Обложка",
    accept: "image/*",
    required: true,
    helper: "Фото услуги, техники или результата работ",
    tooltip: "Изображение, которое будет первым в карточке услуги.",
  },
  {
    key: "doc1",
    label: "Договор / оферта",
    accept: ".pdf,.jpg,.jpeg,.png,image/*",
    required: true,
    helper: "Шаблон договора, оферты или условий оказания услуги",
    tooltip: "Файл с базовыми условиями оказания услуги: договор, оферта, регламент или коммерческое предложение.",
  },
  {
    key: "doc2",
    label: "Прайс / расчет",
    accept: ".pdf,.xlsx,.xls,.jpg,.jpeg,.png,image/*",
    helper: "Файл с тарифами, расчетом или сметой",
    tooltip: "Загрузите таблицу тарифов, прайс-лист, расчет стоимости или пример сметы.",
  },
  {
    key: "doc3",
    label: "Примеры работ",
    accept: "image/*,video/*,.pdf",
    helper: "Фото, видео или документ с примерами выполненных работ",
    tooltip: "Портфолио, фото/видео процесса, отзывы или документы, подтверждающие опыт.",
  },
];

const equipmentTypeOptions = [
  "Трактор",
  "Комбайн",
  "Сеялка",
  "Опрыскиватель",
  "Погрузчик",
  "Прицеп / телега",
  "Навесное оборудование",
  "Запчасти",
  "Другое",
];


const fallbackRegions = [
  "Россия", "Центральный ФО", "Южный ФО", "Приволжский ФО", "Сибирский ФО",
  "Северо-Кавказский ФО", "Уральский ФО", "Северо-Западный ФО", "Дальневосточный ФО",
];

const grainTypeOptions: GrainLot["grainType"][] = [
  "Пшеница",
  "Ячмень",
  "Кукуруза",
  "Рожь",
  "Овес",
];

const gradeOptions = [
  "1 класс",
  "2 класс",
  "3 класс",
  "4 класс",
  "5 класс",
  "Фуражная",
  "Продовольственная",
  "Экстра",
  "ГОСТ",
  "Без класса",
];

const serviceTypeOptions = [
  "Перевозка зерна автотранспортом",
  "Ж/д логистика",
  "Хранение на элеваторе",
  "Сушка зерна",
  "Очистка зерна",
  "Лабораторный анализ",
  "Погрузка / разгрузка",
  "Экспедирование",
  "Ремонт сельхозтехники",
  "Аренда техники с оператором",
  "Агрономическое сопровождение",
];

const serviceUnitOptions = [
  "₽/т",
  "₽/рейс",
  "₽/км",
  "₽/т-км",
  "₽/час",
  "₽/га",
  "₽/анализ",
  "₽/сутки",
  "₽/услуга",
  "по договоренности",
];

const equipmentBrandOptions = [
  "CLAAS",
  "John Deere",
  "Ростсельмаш",
  "МТЗ",
  "New Holland",
  "Case IH",
  "Fendt",
  "Amazone",
  "Kverneland",
  "Lemken",
  "Беларус",
];

const equipmentModelOptions = [
  "Lexion 760",
  "Lexion 750",
  "ACROS 595",
  "Vector 410",
  "Беларус 82.1",
  "МТЗ 1221.3",
  "8R 340",
  "T7.270",
  "Axial-Flow 6140",
];

const ownershipStatusOptions = [
  "В собственности",
  "Лизинг закрыт",
  "В лизинге",
  "По доверенности",
  "С обременением",
  "Документы восстанавливаются",
];

const toSelectOptions = (items: string[]) =>
  items.map((item) => ({ value: item, label: item }));

const selectSearchFilter = (input: string, option?: { label?: ReactNode; value?: string }) =>
  String(option?.label ?? option?.value ?? "")
    .toLowerCase()
    .includes(input.toLowerCase());

const moneyFormatter = (value?: number | string) =>
  `${value ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const moneyParser = (value?: string) =>
  Number((value ?? "").replace(/\s/g, "").replace(/₽/g, ""));

function slotConfigsForCategory(category: CreateLotCategory) {
  if (category === "grain") return grainSlots;
  if (category === "equipment") return equipmentSlots;
  return serviceSlots;
}

function getCategoryLabel(category: CreateLotCategory) {
  if (category === "grain") return "Зерно";
  if (category === "equipment") return "Техника";
  return "Услуга";
}

function getCategoryHint(category: CreateLotCategory) {
  if (category === "grain") {
    return "Для зерна нужны культура, класс, объем, качество партии, цена за тонну и документы по происхождению/хранению.";
  }
  if (category === "equipment") {
    return "Для техники нужны тип, марка, модель, год, состояние, наработка, цена и документы по владению/идентификации.";
  }
  return "Для услуги нужны тип услуги, единица расчета, цена и документы с условиями, тарифами или примерами работ.";
}

function FieldLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <Space size={6} align="center" className="field-label-with-help">
      <span>{label}</span>
      <Tooltip title={tooltip}>
        <span className="field-help-star" aria-label={`Подсказка: ${label}`}>*</span>
      </Tooltip>
      <Tooltip title={tooltip}>
        <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
      </Tooltip>
    </Space>
  );
}

function slotLabel(slot: FileSlotConfig): ReactNode {
  return <FieldLabel label={slot.label} tooltip={slot.tooltip} />;
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function toForumAttachment(file: NormalizedUploadFile): ForumAttachment {
  return {
    id: file.id,
    name: file.name,
    type: file.type,
    url: file.url,
    mimeType: file.mimeType,
    size: file.size,
  };
}

function resetCategorySpecificFields(form: FormInstance<CreateLotFormValues>) {
  form.setFieldsValue({
    grainType: undefined,
    grade: undefined,
    volumeTons: undefined,
    qualityScore: undefined,
    equipmentType: undefined,
    brand: undefined,
    model: undefined,
    year: undefined,
    condition: "used",
    operatingHours: undefined,
    enginePowerHp: undefined,
    ownershipStatus: undefined,
    serviceType: undefined,
    unit: undefined,
  });
}


function composeLotTitle(values: Partial<CreateLotFormValues>, category: CreateLotCategory) {
  if (category === "grain") {
    const culture = values.grainType ?? "Зерно";
    const grade = values.grade ? ` ${values.grade}` : "";
    const volume = values.volumeTons ? `, ${Number(values.volumeTons).toLocaleString("ru-RU")} т` : "";
    return `${culture}${grade}${volume}`.trim();
  }

  if (category === "equipment") {
    return [values.equipmentType, values.brand, values.model, values.year]
      .filter(Boolean)
      .join(" ")
      .trim() || "Сельхозтехника";
  }

  return [values.serviceType ?? "Услуга", values.region]
    .filter(Boolean)
    .join(" · ")
    .trim();
}

function ensureLotTitle(values: Partial<CreateLotFormValues>, category: CreateLotCategory) {
  const manualTitle = values.title?.trim();
  return manualTitle && manualTitle.length >= 3
    ? manualTitle
    : composeLotTitle(values, category);
}

function ensureLotDescription(values: Partial<CreateLotFormValues>, category: CreateLotCategory): string {
  const manualDescription = values.description?.trim();
  if (manualDescription && manualDescription.length >= 3) {
    return manualDescription;
  }

  if (category === "equipment") {
    return [
      "Карточка техники сформирована по выбранным параметрам.",
      values.equipmentType ? `Тип: ${values.equipmentType}.` : "",
      values.brand || values.model ? `Техника: ${[values.brand, values.model].filter(Boolean).join(" ")}.` : "",
      values.year ? `Год выпуска: ${values.year}.` : "",
      values.condition ? `Состояние: ${values.condition === "new" ? "новая" : "б/у"}.` : "",
    ].filter(Boolean).join(" ");
  }

  if (category === "service") {
    return [
      "Карточка услуги сформирована по выбранным параметрам.",
      values.serviceType ? `Тип услуги: ${values.serviceType}.` : "",
      values.unit ? `Единица тарифа: ${values.unit}.` : "",
      values.region ? `Регион оказания: ${values.region}.` : "",
    ].filter(Boolean).join(" ");
  }

  return [
    "Карточка зернового лота сформирована по выбранным параметрам.",
    values.grainType ? `Культура: ${values.grainType}.` : "",
    values.grade ? `Класс / сорт: ${values.grade}.` : "",
    values.volumeTons ? `Объем: ${Number(values.volumeTons).toLocaleString("ru-RU")} т.` : "",
  ].filter(Boolean).join(" ");
}

export function MarketplaceCreateLotPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore(
    (state) =>
      state.users.find((user) => user.id === state.currentUserId) ?? null,
  );
  const addGrainLot = useAppStore((state) => state.addGrainLot);
  const addEquipmentLot = useAppStore((state) => state.addEquipmentLot);
  const addServiceLot = useAppStore((state) => state.addServiceLot);
  const referenceCatalogs = useAppStore((state) => state.referenceCatalogs);
  const activeRegions = useMemo(() => {
    const ref = (referenceCatalogs['regions'] ?? []).map((r) => r.title);
    return ref.length ? [...ref, ...fallbackRegions.filter((r) => !ref.includes(r))] : fallbackRegions;
  }, [referenceCatalogs]);
  const [form] = Form.useForm<CreateLotFormValues>();
  const [step, setStep] = useState(0);
  const [activeCategory, setActiveCategory] = useState<
    CreateLotCategory | undefined
  >();
  const [slotFiles, setSlotFiles] = useState<
    Record<FileSlotKey, NormalizedUploadFile | null>
  >({
    cover: null,
    doc1: null,
    doc2: null,
    doc3: null,
  });
  const [galleryFiles, setGalleryFiles] = useState<NormalizedUploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef<{
    key: UploadTarget;
    multiple: boolean;
  } | null>(null);

  const category = activeCategory ?? "grain";
  const saleFormat = Form.useWatch("saleFormat", form) ?? "direct";
  const slotConfigs = useMemo(
    () => slotConfigsForCategory(category),
    [category],
  );
  const showAuction = saleFormat === "auction";

  const slotValues = useMemo(
    () => Object.values(slotFiles).filter(Boolean) as NormalizedUploadFile[],
    [slotFiles],
  );

  const openPicker = (key: UploadTarget, multiple = false) => {
    pendingSlotRef.current = { key, multiple };
    const input = fileInputRef.current;
    if (!input) return;
    input.multiple = multiple;
    input.accept =
      key === "gallery"
        ? "image/*,video/*,.pdf,.doc,.docx,.xlsx,.xls,.txt"
        : key === "cover"
          ? "image/*"
          : (slotConfigs.find((slot) => slot.key === key)?.accept ?? "*/*");
    input.value = "";
    input.click();
  };

  const handleFileSelection = async (files?: FileList | null) => {
    if (!files?.length || !pendingSlotRef.current) return;
    const { key, multiple } = pendingSlotRef.current;
    const normalized = await Promise.all(
      Array.from(files).map((file) => normalizeUploadFile(file)),
    );

    if (key === "gallery" || multiple) {
      setGalleryFiles((current) => [...current, ...normalized].slice(0, 8));
    } else {
      setSlotFiles((current) => ({ ...current, [key]: normalized[0] ?? null }));
    }
  };

  const removeGalleryFile = (id: string) => {
    setGalleryFiles((current) => current.filter((item) => item.id !== id));
  };

  const removeSlotFile = (key: FileSlotKey) => {
    setSlotFiles((current) => ({ ...current, [key]: null }));
  };

  const validateCurrentStep = async () => {
    const categoryFields: Array<keyof CreateLotFormValues> = ["category"];
    const baseDetailFields: Array<keyof CreateLotFormValues> = [
      "region",
      "saleFormat",
    ];
    const detailFieldsByCategory: Record<
      CreateLotCategory,
      Array<keyof CreateLotFormValues>
    > = {
      grain: ["grainType", "grade", "volumeTons", "qualityScore", "price"],
      equipment: [
        "equipmentType",
        "brand",
        "model",
        "year",
        "condition",
        "operatingHours",
        "ownershipStatus",
        "price",
      ],
      service: ["serviceType", "unit", "price"],
    };
    const auctionFields: Array<keyof CreateLotFormValues> = [
      "auctionStep",
      "auctionDurationHours",
      "auctionStartAt",
    ];

    if (step === 0) {
      await form.validateFields(categoryFields as string[]);
      const selected = form.getFieldValue("category") as CreateLotCategory | undefined;
      if (selected) {
        setActiveCategory(selected);
      }
    }

    if (step === 1) {
      await form.validateFields([
        ...baseDetailFields,
        ...detailFieldsByCategory[category],
        ...(showAuction ? auctionFields : []),
      ] as string[]);

      const currentValues = {
        ...form.getFieldsValue(true),
        category,
      } as Partial<CreateLotFormValues>;
      if (!currentValues.title?.trim()) {
        form.setFieldValue("title", ensureLotTitle(currentValues, category));
      }
    }

    if (step === 2) {
      const requiredSlots = slotConfigs.filter((slot) => slot.required);
      const missing = requiredSlots.filter((slot) => !slotFiles[slot.key]);
      if (missing.length) {
        throw new Error(
          `Загрузите файлы: ${missing.map((slot) => slot.label).join(", ")}`,
        );
      }

      const currentValues = {
        ...form.getFieldsValue(true),
        category,
      } as Partial<CreateLotFormValues>;
      form.setFieldsValue({
        title: ensureLotTitle(currentValues, category),
        description: ensureLotDescription(currentValues, category),
      });
    }
  };

  const publishLot = async () => {
    if (!currentUser) {
      message.warning("Сначала войдите в аккаунт");
      navigate("/auth");
      return;
    }

    await form.validateFields().catch(() => undefined);

    const rawValues = {
      ...form.getFieldsValue(true),
      category,
    } as Partial<CreateLotFormValues>;
    const normalizedRawValues = {
      ...rawValues,
      title: ensureLotTitle(rawValues, category),
      description: ensureLotDescription(rawValues, category),
    };
    form.setFieldsValue({
      category,
      title: normalizedRawValues.title,
      description: normalizedRawValues.description,
    });
    form.setFields([
      { name: 'title', errors: [] },
      { name: 'description', errors: [] },
    ]);
    const parsed = createLotSchema.safeParse({
      ...normalizedRawValues,
      title: normalizedRawValues.title || ensureLotTitle(normalizedRawValues, category),
      description: normalizedRawValues.description || ensureLotDescription(normalizedRawValues, category),
    });
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "Проверьте поля формы");
      return;
    }

    const values = parsed.data;
    const cover = slotFiles.cover;
    const documents = slotConfigs
      .filter((slot) => slot.key !== "cover")
      .map((slot) => ({ slot, file: slotFiles[slot.key] }))
      .filter(
        (item): item is { slot: FileSlotConfig; file: NormalizedUploadFile } =>
          Boolean(item.file),
      );
    const gallery = galleryFiles.map(toForumAttachment);
    const uploadedNames = [
      ...documents.map((item) => `${item.slot.label}: ${item.file.name}`),
      ...(gallery.length
        ? [`Медиа: ${gallery.map((file) => file.name).join(", ")}`]
        : []),
    ];

    const categoryParams =
      values.category === "equipment"
        ? [
            `Тип техники: ${values.equipmentType ?? "не указан"}`,
            `Марка: ${values.brand ?? "не указана"}`,
            `Модель: ${values.model ?? "не указана"}`,
            `Год: ${values.year ?? "не указан"}`,
            `Состояние: ${values.condition === "new" ? "новая" : "б/у"}`,
            `Наработка: ${Number(values.operatingHours ?? 0).toLocaleString("ru-RU")} м/ч`,
            values.enginePowerHp
              ? `Мощность: ${Number(values.enginePowerHp).toLocaleString("ru-RU")} л.с.`
              : "",
            `Правовой статус: ${values.ownershipStatus ?? "не указан"}`,
          ].filter(Boolean)
        : values.category === "grain"
          ? [
              `Культура: ${values.grainType ?? "не указана"}`,
              `Класс: ${values.grade ?? "не указан"}`,
              `Объем: ${Number(values.volumeTons ?? 0).toLocaleString("ru-RU")} т`,
              `Индекс качества: ${Number(values.qualityScore ?? 0)} из 100`,
            ]
          : [
              `Тип услуги: ${values.serviceType ?? "не указан"}`,
              `Единица тарифа: ${values.unit ?? "не указана"}`,
            ];

    const normalizedDescription = [
      (values.description ?? ensureLotDescription(values as Partial<CreateLotFormValues>, category)).trim(),
      categoryParams.length
        ? `\nПараметры лота:\n- ${categoryParams.join("\n- ")}`
        : "",
      uploadedNames.length
        ? `\nЗагруженные файлы:\n- ${uploadedNames.join("\n- ")}`
        : "",
      showAuction
        ? `\nПараметры аукциона:\n- Шаг ставки: ${Number(values.auctionStep ?? 100).toLocaleString("ru-RU")} ₽\n- Длительность: ${Number(values.auctionDurationHours ?? 6)} ч\n- Старт: ${values.auctionStartAt ?? "сразу после публикации"}`
        : "",
    ]
      .join("")
      .trim();

    try {
      if (values.category === "grain") {
        await addGrainLot({
          category: "grain",
          sellerId: currentUser.id,
          sellerName: currentUser.name,
          title: values.title.trim(),
          region: values.region.trim(),
          description: normalizedDescription,
          coverImageUrl: cover?.url,
          grainType: (values.grainType ?? "Пшеница") as GrainLot["grainType"],
          grade: values.grade ?? "3 класс",
          volumeTons: Number(values.volumeTons ?? 0),
          pricePerTon: Number(values.price),
          qualityScore: Number(values.qualityScore ?? 80),
          hasOwnTransport: true,
          auctionEnabled: values.saleFormat === "auction",
          mercuryCertificate:
            documents.find((item) => item.slot.key === "doc1")?.file.name ??
            "Загружен",
          declarationOfConformity:
            documents.find((item) => item.slot.key === "doc2")?.file.name ??
            "Загружена",
          storageContract:
            documents.find((item) => item.slot.key === "doc3")?.file.name ??
            "Загружен",
        });
      } else if (values.category === "equipment") {
        await addEquipmentLot({
          category: "equipment",
          sellerId: currentUser.id,
          sellerName: currentUser.name,
          title: values.title.trim(),
          region: values.region.trim(),
          description: normalizedDescription,
          price: Number(values.price),
          coverImageUrl: cover?.url,
          brand: `${values.brand ?? ""} ${values.model ?? ""}`.trim() || "Не указана",
          year: Number(values.year ?? new Date().getFullYear()),
          condition: values.condition ?? "used",
        });
      } else {
        await addServiceLot({
          category: "service",
          sellerId: currentUser.id,
          sellerName: currentUser.name,
          title: values.title.trim(),
          serviceType: values.serviceType ?? "Услуга",
          region: values.region.trim(),
          unit: values.unit ?? "услуга",
          price: Number(values.price),
          description: normalizedDescription,
          coverImageUrl: cover?.url,
          attachments: [
            ...gallery,
            ...documents.map((item) => toForumAttachment(item.file)),
          ],
          tags: [
            values.serviceType ?? "услуга",
            saleFormat === "auction" ? "аукцион" : "прямая продажа",
          ],
        });
      }

      message.success("Лот опубликован");
      navigate("/marketplace");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Не удалось опубликовать лот",
      );
    }
  };

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card className="section-card">
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Title level={1} style={{ marginBottom: 0 }}>
            Разместить лот
          </Typography.Title>
          <Typography.Paragraph
            className="lead-text"
            style={{ marginBottom: 0 }}
          >
            Сначала выберите категорию. Дальше форма покажет только параметры и
            документы, которые нужны именно для этой категории.
          </Typography.Paragraph>
        </Space>
      </Card>

      <Card>
        <Steps
          current={step}
          items={categorySteps.map((item) => ({
            title: item.title,
            description: item.description,
            icon: item.icon,
          }))}
        />
      </Card>

      <Card
        title={categorySteps[step].title}
        extra={
          <Tag icon={<TrophyOutlined />}>
            Шаг {step + 1} из {categorySteps.length}
          </Tag>
        }
      >
        <Form<CreateLotFormValues>
          form={form}
          layout="vertical"
          initialValues={{
            saleFormat: "direct",
            region: currentUser?.region ?? "",
            hasOwnTransport: true,
            condition: "used",
            qualityScore: 80,
            price: 0,
          }}
        >
          {step === 0 && (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Typography.Paragraph
                className="lead-text"
                style={{ marginBottom: 0 }}
              >
                Выберите категорию. После этого поля «Культура», «Класс» и
                «Объем» будут показываться только для зерна, а для техники —
                параметры техники.
              </Typography.Paragraph>
              <Form.Item
                name="category"
                label={
                  <FieldLabel
                    label="Категория лота"
                    tooltip="Выберите, что размещаете: зерно, технику или услугу. От этого зависит набор следующих полей и документов."
                  />
                }
                rules={[{ required: true, message: "Выберите категорию" }]}
              >
                <Select
                  size="large"
                  placeholder="Выберите категорию"
                  options={[
                    { value: "grain", label: "Зерно" },
                    { value: "equipment", label: "Техника" },
                    { value: "service", label: "Услуга" },
                  ]}
                  onChange={(value: CreateLotCategory) => {
                    form.setFieldValue("category", value);
                    setActiveCategory(value);
                    resetCategorySpecificFields(form);
                    setSlotFiles({
                      cover: null,
                      doc1: null,
                      doc2: null,
                      doc3: null,
                    });
                    setGalleryFiles([]);
                  }}
                />
              </Form.Item>
              {activeCategory && (
                <Card size="small" className="marketplace-review-card">
                  <Space direction="vertical" size={4}>
                    <Typography.Text strong>
                      {getCategoryLabel(category)}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {getCategoryHint(category)}
                    </Typography.Text>
                  </Space>
                </Card>
              )}
            </Space>
          )}

          {step === 1 && (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Card size="small" className="marketplace-review-card">
                <Typography.Text type="secondary">
                  Активная категория: <strong>{getCategoryLabel(category)}</strong>. {getCategoryHint(category)}
                </Typography.Text>
              </Card>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="title"
                    label={
                      <FieldLabel
                        label="Название карточки"
                        tooltip="Можно оставить пустым: название сформируется автоматически из выбранных параметров. Заполните вручную, если нужен особый заголовок."
                      />
                    }
                  >
                    <Input
                      allowClear
                      placeholder={
                        category === "grain"
                          ? "Авто: Пшеница 3 класс, 200 т"
                          : category === "equipment"
                            ? "Авто: Комбайн CLAAS Lexion 760"
                            : "Авто: Перевозка зерна · регион"
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="region"
                    label={
                      <FieldLabel
                        label="Регион"
                        tooltip="Где находится товар, техника или где оказывается услуга. Например: Смоленская область."
                      />
                    }
                    rules={[{ required: true, message: "Укажите регион" }]}
                  >
                    <AutoComplete
                      allowClear
                      placeholder="Выберите или начните вводить регион"
                      options={toSelectOptions(activeRegions)}
                      filterOption={selectSearchFilter}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="saleFormat"
                    label={
                      <FieldLabel
                        label="Формат сделки"
                        tooltip="Прямая продажа — фиксированная цена. Аукцион — покупатели делают ставки от начальной цены."
                      />
                    }
                    rules={[{ required: true, message: "Выберите формат" }]}
                  >
                    <Select
                      options={[
                        { value: "direct", label: "Прямая продажа" },
                        { value: "auction", label: "Аукцион" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {category === "grain" && (
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="grainType"
                      label={
                        <FieldLabel
                          label="Культура"
                          tooltip="Какая культура продается: пшеница, ячмень, кукуруза, рожь, овес и т.д."
                        />
                      }
                      rules={[{ required: true, message: "Укажите культуру" }]}
                    >
                      <Select
                        showSearch
                        allowClear
                        placeholder="Выберите культуру"
                        filterOption={selectSearchFilter}
                        options={toSelectOptions(grainTypeOptions)}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="grade"
                      label={
                        <FieldLabel
                          label="Класс / сорт"
                          tooltip="Класс зерна по документам или лабораторному анализу. Например: 3 класс, 4 класс, фураж."
                        />
                      }
                      rules={[{ required: true, message: "Укажите класс" }]}
                    >
                      <Select
                        showSearch
                        allowClear
                        placeholder="Выберите класс или сорт"
                        filterOption={selectSearchFilter}
                        options={toSelectOptions(gradeOptions)}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="volumeTons"
                      label={
                        <FieldLabel
                          label="Объем, т"
                          tooltip="Доступный объем партии в тоннах. Вводите только число, например 200."
                        />
                      }
                      rules={[{ required: true, message: "Укажите объем" }]}
                    >
                      <InputNumber min={1} step={1} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="qualityScore"
                      label={
                        <FieldLabel
                          label="Индекс качества партии"
                          tooltip="Оценка качества от 1 до 100. Можно поставить по результатам лаборатории или внутренней оценке: чем выше значение, тем лучше партия."
                        />
                      }
                      rules={[{ required: true, message: "Укажите индекс качества" }]}
                    >
                      <InputNumber
                        min={1}
                        max={100}
                        step={1}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="price"
                      label={
                        <FieldLabel
                          label={showAuction ? "Начальная ставка за тонну" : "Цена за тонну"}
                          tooltip="Цена указывается в рублях за одну тонну. Для аукциона это стартовая цена."
                        />
                      }
                      rules={[{ required: true, message: "Укажите цену" }]}
                    >
                      <InputNumber
                        min={0}
                        step={100}
                        addonAfter="₽"
                        formatter={moneyFormatter}
                        parser={moneyParser}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {category === "equipment" && (
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="equipmentType"
                      label={
                        <FieldLabel
                          label="Тип техники"
                          tooltip="Выберите тип: трактор, комбайн, сеялка, опрыскиватель, погрузчик, прицеп, навесное оборудование или запчасти."
                        />
                      }
                      rules={[{ required: true, message: "Укажите тип техники" }]}
                    >
                      <Select
                        showSearch
                        allowClear
                        placeholder="Выберите тип техники"
                        filterOption={selectSearchFilter}
                        options={toSelectOptions(equipmentTypeOptions)}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="brand"
                      label={
                        <FieldLabel
                          label="Марка"
                          tooltip="Производитель техники. Например: CLAAS, John Deere, Ростсельмаш, МТЗ."
                        />
                      }
                      rules={[{ required: true, message: "Укажите марку" }]}
                    >
                      <AutoComplete
                        allowClear
                        placeholder="Начните вводить марку"
                        options={toSelectOptions(equipmentBrandOptions)}
                        filterOption={selectSearchFilter}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="model"
                      label={
                        <FieldLabel
                          label="Модель"
                          tooltip="Модель или модификация техники. Например: Lexion 760, 8R 340, Беларус 82.1."
                        />
                      }
                      rules={[{ required: true, message: "Укажите модель" }]}
                    >
                      <AutoComplete
                        allowClear
                        placeholder="Начните вводить модель"
                        options={toSelectOptions(equipmentModelOptions)}
                        filterOption={selectSearchFilter}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="year"
                      label={
                        <FieldLabel
                          label="Год выпуска"
                          tooltip="Год выпуска по документам или шильдику техники."
                        />
                      }
                      rules={[{ required: true, message: "Укажите год" }]}
                    >
                      <InputNumber
                        min={1970}
                        max={new Date().getFullYear() + 1}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="condition"
                      label={
                        <FieldLabel
                          label="Состояние"
                          tooltip="Укажите новая техника или б/у. Детали состояния можно описать на последнем шаге."
                        />
                      }
                      rules={[{ required: true, message: "Укажите состояние" }]}
                    >
                      <Select
                        options={[
                          { value: "new", label: "Новая" },
                          { value: "used", label: "Б/у" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="operatingHours"
                      label={
                        <FieldLabel
                          label="Наработка, м/ч"
                          tooltip="Сколько моточасов отработала техника. Для новой техники можно поставить 0."
                        />
                      }
                      rules={[{ required: true, message: "Укажите наработку" }]}
                    >
                      <InputNumber min={0} step={50} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="enginePowerHp"
                      label={
                        <FieldLabel
                          label="Мощность, л.с."
                          tooltip="Мощность двигателя в лошадиных силах. Если не применимо, можно оставить пустым."
                        />
                      }
                    >
                      <InputNumber min={0} step={10} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="ownershipStatus"
                      label={
                        <FieldLabel
                          label="Правовой статус"
                          tooltip="Укажите, техника в собственности, лизинге, с обременением или продается по доверенности."
                        />
                      }
                      rules={[{ required: true, message: "Укажите правовой статус" }]}
                    >
                      <Select
                        showSearch
                        allowClear
                        placeholder="Выберите правовой статус"
                        filterOption={selectSearchFilter}
                        options={toSelectOptions(ownershipStatusOptions)}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="price"
                      label={
                        <FieldLabel
                          label={showAuction ? "Начальная ставка" : "Цена"}
                          tooltip="Полная цена техники в рублях. Для аукциона это стартовая ставка."
                        />
                      }
                      rules={[{ required: true, message: "Укажите цену" }]}
                    >
                      <InputNumber
                        min={0}
                        step={1000}
                        addonAfter="₽"
                        formatter={moneyFormatter}
                        parser={moneyParser}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {category === "service" && (
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="serviceType"
                      label={
                        <FieldLabel
                          label="Тип услуги"
                          tooltip="Какая услуга оказывается: перевозка, хранение, лабораторный анализ, сушка, очистка, ремонт и т.д."
                        />
                      }
                      rules={[
                        { required: true, message: "Укажите тип услуги" },
                      ]}
                    >
                      <Select
                        showSearch
                        allowClear
                        placeholder="Выберите или найдите тип услуги"
                        filterOption={selectSearchFilter}
                        options={toSelectOptions(serviceTypeOptions)}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="unit"
                      label={
                        <FieldLabel
                          label="Единица тарифа"
                          tooltip="За что считается цена: за тонну, за рейс, за час, за гектар, за анализ или за услугу целиком."
                        />
                      }
                      rules={[{ required: true, message: "Укажите единицу" }]}
                    >
                      <Select
                        showSearch
                        allowClear
                        placeholder="Выберите единицу тарифа"
                        filterOption={selectSearchFilter}
                        options={toSelectOptions(serviceUnitOptions)}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="price"
                      label={
                        <FieldLabel
                          label={showAuction ? "Начальная ставка" : "Цена"}
                          tooltip="Цена услуги в рублях за выбранную единицу тарифа."
                        />
                      }
                      rules={[{ required: true, message: "Укажите цену" }]}
                    >
                      <InputNumber
                        min={0}
                        step={100}
                        addonAfter="₽"
                        formatter={moneyFormatter}
                        parser={moneyParser}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {showAuction && (
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="auctionStep"
                      label={
                        <FieldLabel
                          label="Шаг ставки"
                          tooltip="Минимальное увеличение ставки в рублях. Например, 500 или 1000."
                        />
                      }
                      rules={[
                        { required: true, message: "Укажите шаг ставки" },
                      ]}
                    >
                      <InputNumber
                        min={100}
                        step={100}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="auctionDurationHours"
                      label={
                        <FieldLabel
                          label="Длительность, ч"
                          tooltip="Сколько часов будет открыт аукцион после старта."
                        />
                      }
                      rules={[
                        { required: true, message: "Укажите длительность" },
                      ]}
                    >
                      <InputNumber
                        min={1}
                        max={72}
                        step={1}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="auctionStartAt"
                      label={
                        <FieldLabel
                          label="Старт аукциона"
                          tooltip="Когда начинать торги: сразу после публикации или укажите дату и время вручную."
                        />
                      }
                    >
                      <Input placeholder="Сразу после публикации или дата/время" />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Space>
          )}

          {step === 2 && (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Typography.Paragraph
                className="lead-text"
                style={{ marginBottom: 0 }}
              >
                {category === "grain"
                  ? "Для зерна загрузите документы по партии и хранению."
                  : category === "equipment"
                    ? "Для техники загрузите документы по идентификации, собственности и, если есть, сервисной истории."
                    : "Для услуги загрузите документы с условиями, тарифами и примерами работ."}
              </Typography.Paragraph>
              <Row gutter={[16, 16]}>
                {slotConfigs.map((slot) => (
                  <Col xs={24} lg={12} key={slot.key}>
                    <MediaSlotCard
                      slot={slot}
                      value={slotFiles[slot.key]}
                      onPick={() => openPicker(slot.key)}
                      onRemove={() => removeSlotFile(slot.key)}
                    />
                  </Col>
                ))}
                <Col xs={24}>
                  <Card
                    title={
                      <FieldLabel
                        label="Дополнительные фото, видео и файлы"
                        tooltip="Необязательные вложения: дополнительные фото, видео работы техники, фото склада, документы, прайсы или файлы с деталями."
                      />
                    }
                    className="marketplace-media-card"
                  >
                    <Space
                      direction="vertical"
                      size={12}
                      style={{ width: "100%" }}
                    >
                      <Typography.Text type="secondary">
                        Можно добавить до 8 дополнительных файлов. Они будут
                        прикреплены к описанию лота.
                      </Typography.Text>
                      <Button
                        icon={<UploadOutlined />}
                        onClick={() => openPicker("gallery", true)}
                      >
                        Прикрепить медиа/файлы
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        style={{ display: "none" }}
                        onChange={(event) => {
                          void handleFileSelection(event.target.files);
                          event.target.value = "";
                        }}
                      />
                      {galleryFiles.length ? (
                        <Space wrap>
                          {galleryFiles.map((file) => (
                            <Tag
                              key={file.id}
                              closable
                              onClose={(event) => {
                                event.preventDefault();
                                removeGalleryFile(file.id);
                              }}
                              icon={
                                file.type === "image" ? (
                                  <FileImageOutlined />
                                ) : (
                                  <FileTextOutlined />
                                )
                              }
                            >
                              {file.name} · {formatBytes(file.size)}
                            </Tag>
                          ))}
                        </Space>
                      ) : (
                        <Typography.Text type="secondary">
                          Файлы не выбраны
                        </Typography.Text>
                      )}
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Space>
          )}

          {step === 3 && (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Card className="marketplace-review-card">
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Typography.Title level={4} style={{ marginBottom: 0 }}>
                    {ensureLotTitle(
                      { ...form.getFieldsValue(true), category },
                      category,
                    ) || "Без названия"}
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    {form.getFieldValue("region") || "Регион не указан"}
                  </Typography.Text>
                  <Space wrap>
                    <Tag color="green">{getCategoryLabel(category)}</Tag>
                    <Tag color={showAuction ? "purple" : "blue"}>
                      {showAuction ? "Аукцион" : "Прямая продажа"}
                    </Tag>
                  </Space>
                  <Typography.Paragraph style={{ marginBottom: 0 }}>
                    {ensureLotDescription(
                      { ...form.getFieldsValue(true), category },
                      category,
                    )}
                  </Typography.Paragraph>
                </Space>
              </Card>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Card size="small" title="Цена">
                    <Typography.Text strong>
                      {Number(form.getFieldValue("price") ?? 0).toLocaleString(
                        "ru-RU",
                      )}{" "}
                      ₽
                    </Typography.Text>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card size="small" title="Файлы">
                    <Typography.Text strong>
                      {slotValues.length + galleryFiles.length}
                    </Typography.Text>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card size="small" title="Формат">
                    <Typography.Text strong>
                      {showAuction ? "Аукцион" : "Прямая продажа"}
                    </Typography.Text>
                  </Card>
                </Col>
              </Row>

              <Form.Item
                name="description"
                label={
                  <FieldLabel
                    label="Описание"
                    tooltip="Опишите состояние, условия сделки, отгрузку, оплату, нюансы документов и всё, что важно покупателю."
                  />
                }
              >
                <Input.TextArea
                  rows={6}
                  placeholder={
                    category === "equipment"
                      ? "Опишите состояние техники, комплектацию, дефекты, сервисную историю и условия осмотра"
                      : "Опишите лот, условия отгрузки, документы и важные детали"
                  }
                />
              </Form.Item>
            </Space>
          )}
        </Form>

        <Space wrap style={{ marginTop: 20 }}>
          <Button
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            Назад
          </Button>
          {step < 3 ? (
            <Button
              type="primary"
              onClick={async () => {
                try {
                  await validateCurrentStep();
                  setStep((current) => Math.min(3, current + 1));
                } catch (error) {
                  message.error(
                    error instanceof Error ? error.message : "Проверьте поля",
                  );
                }
              }}
            >
              Далее
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => void publishLot()}
            >
              Опубликовать
            </Button>
          )}
          <Button onClick={() => navigate("/marketplace")}>Отмена</Button>
        </Space>
      </Card>
    </Space>
  );
}

function MediaSlotCard({
  slot,
  value,
  onPick,
  onRemove,
}: {
  slot: FileSlotConfig;
  value: NormalizedUploadFile | null;
  onPick: () => void;
  onRemove: () => void;
}) {
  return (
    <Card
      title={slotLabel(slot)}
      extra={slot.required ? <Tag color="red">обязательно</Tag> : <Tag>опционально</Tag>}
      className="marketplace-upload-card"
    >
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Typography.Text type="secondary">{slot.helper}</Typography.Text>
        {value ? (
          <Space direction="vertical" size={6} style={{ width: "100%" }}>
            <Tag color="green">{value.name}</Tag>
            <Typography.Text type="secondary">
              {formatBytes(value.size)}
            </Typography.Text>
            <Button danger icon={<DeleteOutlined />} onClick={onRemove} block>
              Убрать файл
            </Button>
          </Space>
        ) : (
          <Button icon={<UploadOutlined />} onClick={onPick}>
            Прикрепить файл
          </Button>
        )}
      </Space>
    </Card>
  );
}
