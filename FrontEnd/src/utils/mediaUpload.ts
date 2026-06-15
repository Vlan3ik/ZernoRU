export type NormalizedUploadKind = 'image' | 'video' | 'file';

export interface NormalizedUploadFile {
  id: string;
  name: string;
  type: NormalizedUploadKind;
  url: string;
  size: number;
  mimeType?: string;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}

export async function compressImageFile(file: File, maxSide = 1600, quality = 0.82): Promise<string> {
  const source = await readFileAsDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const node = new Image();
    node.onload = () => resolve(node);
    node.onerror = () => reject(new Error('Не удалось загрузить изображение'));
    node.src = source;
  });

  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * ratio));
  canvas.height = Math.max(1, Math.round(image.height * ratio));
  const context = canvas.getContext('2d');
  if (!context) {
    return source;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function normalizeUploadFile(file: File): Promise<NormalizedUploadFile> {
  const type: NormalizedUploadKind = file.type.startsWith('video/')
    ? 'video'
    : file.type.startsWith('image/')
      ? 'image'
      : 'file';

  const url = type === 'image' ? await compressImageFile(file) : await readFileAsDataUrl(file);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    type,
    url,
    size: file.size,
    mimeType: file.type || undefined,
  };
}
