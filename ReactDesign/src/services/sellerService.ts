import {
  EquipmentLot,
  GrainLot,
  NotificationItem,
  SellerApplication,
  UserProfile,
  VerificationStatus,
} from '../types/domain';
import { getStorage, setStorage, uid } from './localStorageService';
import { STORAGE_KEYS } from '../utils/storageKeys';

export interface SellerDocumentInput {
  innKpp: string;
  ogrn: string;
  mercuryCertificate: string;
  declarationOfConformity: string;
  storageContract: string;
}

export interface SellerActivityItem {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  status: 'info' | 'success' | 'warning';
}

const REQUIRED_DOCUMENT_LABELS: Record<keyof SellerDocumentInput, string> = {
  innKpp: 'ИНН/КПП',
  ogrn: 'ОГРН/ОГРНИП',
  mercuryCertificate: 'Сертификат ФГИС "Меркурий"',
  declarationOfConformity: 'Декларация о соответствии',
  storageContract: 'Договор хранения',
};

export const sellerService = {
  submitApplication(payload: Omit<SellerApplication, 'id' | 'status' | 'submittedAt'>): SellerApplication {
    const apps = getStorage<SellerApplication[]>(STORAGE_KEYS.sellerApplications, []);
    const app: SellerApplication = {
      ...payload,
      id: uid('app'),
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    setStorage(STORAGE_KEYS.sellerApplications, [app, ...apps]);
    return app;
  },

  getApplications(userId?: string): SellerApplication[] {
    const apps = getStorage<SellerApplication[]>(STORAGE_KEYS.sellerApplications, []);
    if (!userId) return apps;
    return apps.filter((x) => x.userId === userId);
  },

  approveApplication(applicationId: string): void {
    const apps = getStorage<SellerApplication[]>(STORAGE_KEYS.sellerApplications, []);
    const users = getStorage<UserProfile[]>(STORAGE_KEYS.users, []);
    const target = apps.find((x) => x.id === applicationId);
    if (!target) return;

    const nextApps = apps.map((x) =>
      x.id === applicationId ? { ...x, status: 'approved' as const } : x,
    );
    const nextUsers = users.map((u) =>
      u.id === target.userId
        ? { ...u, inn: target.inn, ogrn: target.ogrn, isVerifiedSeller: true, role: 'seller' as const }
        : u,
    );

    setStorage(STORAGE_KEYS.sellerApplications, nextApps);
    setStorage(STORAGE_KEYS.users, nextUsers);
  },

  getLatestApplication(applications: SellerApplication[], userId: string): SellerApplication | null {
    const own = applications
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return own[0] ?? null;
  },

  getVerificationStatus(
    user: UserProfile | null,
    latestApplication: SellerApplication | null,
  ): VerificationStatus {
    if (user?.isVerifiedSeller) return 'approved';
    return latestApplication?.status ?? 'pending';
  },

  evaluateRequiredDocuments(documents: SellerDocumentInput): {
    isComplete: boolean;
    missingFields: (keyof SellerDocumentInput)[];
    missingLabels: string[];
  } {
    const missingFields = (Object.keys(REQUIRED_DOCUMENT_LABELS) as Array<keyof SellerDocumentInput>)
      .filter((field) => !String(documents[field] ?? '').trim());

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      missingLabels: missingFields.map((field) => REQUIRED_DOCUMENT_LABELS[field]),
    };
  },

  buildSellerActivityFeed(params: {
    userId: string;
    applications: SellerApplication[];
    grainLots: GrainLot[];
    equipmentLots: EquipmentLot[];
    notifications: NotificationItem[];
  }): SellerActivityItem[] {
    const applicationEvents: SellerActivityItem[] = params.applications
      .filter((item) => item.userId === params.userId)
      .map((item) => {
        if (item.status === 'approved') {
          return {
            id: `application_${item.id}`,
            createdAt: item.submittedAt,
            title: 'Верификация продавца одобрена',
            description: `${item.companyName} получила доступ к кабинету продавца.`,
            status: 'success',
          };
        }

        if (item.status === 'rejected') {
          return {
            id: `application_${item.id}`,
            createdAt: item.submittedAt,
            title: 'Заявка отклонена',
            description: 'Проверьте корректность реквизитов и отправьте новую заявку.',
            status: 'warning',
          };
        }

        return {
          id: `application_${item.id}`,
          createdAt: item.submittedAt,
          title: 'Заявка отправлена',
          description: `${item.companyName} ожидает проверку модератора.`,
          status: 'info',
        };
      });

    const grainEvents: SellerActivityItem[] = params.grainLots
      .filter((item) => item.sellerId === params.userId)
      .map((item) => ({
        id: `grain_${item.id}`,
        createdAt: item.createdAt,
        title: 'Опубликован лот зерна',
        description: `${item.title} • ${item.volumeTons} т • ${item.pricePerTon.toLocaleString('ru-RU')} руб./т`,
        status: 'success',
      }));

    const equipmentEvents: SellerActivityItem[] = params.equipmentLots
      .filter((item) => item.sellerId === params.userId)
      .map((item) => ({
        id: `equipment_${item.id}`,
        createdAt: item.createdAt,
        title: 'Опубликован лот техники',
        description: `${item.title} • ${item.year} г. • ${item.price.toLocaleString('ru-RU')} руб.`,
        status: 'success',
      }));

    const notificationEvents: SellerActivityItem[] = params.notifications
      .filter((item) => item.userId === params.userId)
      .map((item) => ({
        id: `notification_${item.id}`,
        createdAt: item.createdAt,
        title: item.viewed ? 'Уведомление просмотрено' : 'Новое уведомление',
        description: item.message,
        status: item.viewed ? 'info' : 'warning',
      }));

    return [...applicationEvents, ...grainEvents, ...equipmentEvents, ...notificationEvents].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },
};



