/**
 * Currency utilities for database operations
 */

export const currencies = [
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK", "NZD"
] as const;

export type Currency = typeof currencies[number];

export function isSupportedCurrency(currency: string): currency is Currency {
  return currencies.includes(currency as Currency);
}
