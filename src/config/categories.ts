export const CATEGORIES = [
  'ID Cards',
  'Electronics',
  'Wallets & Bags',
  'Books & Stationery',
  'Clothing',
  'Keys',
  'Accessories',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];
