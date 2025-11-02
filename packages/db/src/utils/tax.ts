/**
 * Tax utilities for database operations
 */

export interface TaxRate {
  country: string;
  rate: number;
  type: "vat" | "gst" | "sales_tax";
}

export function calculateTax(amount: number, rate: number): number {
  return amount * (rate / 100);
}

export function calculateAmountWithTax(amount: number, rate: number): number {
  return amount + calculateTax(amount, rate);
}
