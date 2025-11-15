export const CURRENCIES = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "RON", symbol: "lei", name: "Romanian Leu" },
  { code: "BGN", symbol: "лв", name: "Bulgarian Lev" },
  { code: "HRK", symbol: "kn", name: "Croatian Kuna" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "Mex$", name: "Mexican Peso" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
]

export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find((c) => c.code === code)
  return currency?.symbol || code
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode)

  // Format the number with 2 decimal places and thousands separator
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  // For currencies where symbol comes after (like kr, lei, etc.), put it after
  const symbolAfter = ["kr", "lei", "лв", "kn", "Kč", "Ft", "zł"]
  if (symbolAfter.includes(symbol)) {
    return `${formatted} ${symbol}`
  }

  // Default: symbol before amount
  return `${symbol}${formatted}`
}

// Exchange rates relative to EUR (base currency)
// In a production app, these should be fetched from an API like exchangerate-api.com
// For now, using approximate rates (updated periodically)
const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1.0,
  USD: 1.08,
  GBP: 0.86,
  CHF: 0.95,
  JPY: 161.5,
  AUD: 1.66,
  CAD: 1.47,
  CNY: 7.85,
  SEK: 11.35,
  NOK: 11.65,
  DKK: 7.46,
  PLN: 4.32,
  CZK: 24.5,
  HUF: 390.0,
  RON: 4.97,
  BGN: 1.96,
  HRK: 7.53,
  RUB: 98.5,
  TRY: 34.5,
  BRL: 5.42,
  MXN: 18.45,
  ZAR: 20.15,
  INR: 90.2,
  KRW: 1435.0,
  SGD: 1.45,
  HKD: 8.45,
  NZD: 1.78,
  THB: 37.8,
  MYR: 4.95,
  IDR: 17250.0,
  PHP: 60.5,
}

/**
 * Convert an amount from one currency to another
 * @param amount - The amount to convert
 * @param fromCurrency - The source currency code
 * @param toCurrency - The target currency code
 * @returns The converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const fromRate = EXCHANGE_RATES[fromCurrency] || 1
  const toRate = EXCHANGE_RATES[toCurrency] || 1

  // Convert to EUR first (base currency), then to target currency
  const amountInEUR = amount / fromRate
  const convertedAmount = amountInEUR * toRate

  return convertedAmount
}

/**
 * Get the current exchange rate between two currencies
 * @param fromCurrency - The source currency code
 * @param toCurrency - The target currency code
 * @returns The exchange rate
 */
export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) {
    return 1
  }

  const fromRate = EXCHANGE_RATES[fromCurrency] || 1
  const toRate = EXCHANGE_RATES[toCurrency] || 1

  return toRate / fromRate
}
