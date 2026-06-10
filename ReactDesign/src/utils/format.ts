export function formatRubles(value: number, suffix = '₽') {
  return `${value.toLocaleString('ru-RU')} ${suffix}`;
}

export function formatRublesPerTon(value: number) {
  return `${value.toLocaleString('ru-RU')} ₽/т`;
}
