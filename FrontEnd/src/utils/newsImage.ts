import type { NewsArticle } from '../types/domain';

const newsFallbackImages = [
  '/images/thematic/image_01.jpg',
  '/images/thematic/image_05.jpg',
  '/images/thematic/image_09.jpg',
  '/images/thematic/image_13.jpg',
  '/images/stock/green-field.jpg',
  '/images/stock/sunflower-tractor.jpg',
];

export function fallbackNewsImage(article: NewsArticle, index = 0) {
  if (article.section === 'Пресс-релизы') return '/images/stock/green-field.jpg';
  if (article.section === 'Аналитика') return '/images/thematic/image_13.jpg';
  const seed = article.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), index);
  return newsFallbackImages[Math.abs(seed) % newsFallbackImages.length];
}

export function resolveNewsImage(article: NewsArticle, index = 0) {
  const imageUrl = article.imageUrl?.trim();
  if (!imageUrl || imageUrl.startsWith('/api/media/assets/')) {
    return fallbackNewsImage(article, index);
  }

  return imageUrl;
}
