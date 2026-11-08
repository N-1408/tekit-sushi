export const fmt = (n: number) => Number(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
export const sum = (n: number) => `${fmt(n)} so'm`
export const uzs = (n: number) => `${fmt(n)} UZS`
