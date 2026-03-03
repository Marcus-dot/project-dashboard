// Currency utility functions for multi-currency support

export type Currency = 'ZMW' | 'USD' | 'EUR' | 'GBP'

export interface CurrencyConfig {
    code: Currency
    symbol: string
    name: string
    locale: string
    flag: string
}

// Supported currencies with their configurations
export const CURRENCIES: Record<Currency, CurrencyConfig> = {
    ZMW: {
        code: 'ZMW',
        symbol: 'K',
        name: 'Zambian Kwacha',
        locale: 'en-ZM',
        flag: '🇿🇲'
    },
    USD: {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        locale: 'en-US',
        flag: '🇺🇸'
    },
    EUR: {
        code: 'EUR',
        symbol: '€',
        name: 'Euro',
        locale: 'de-DE',
        flag: '🇪🇺'
    },
    GBP: {
        code: 'GBP',
        symbol: '£',
        name: 'British Pound',
        locale: 'en-GB',
        flag: '🇬🇧'
    }
}

// Format currency amount with proper locale and symbol
export function formatCurrency(
    amount?: number,
    currency: Currency = 'ZMW',
    options?: {
        showSymbol?: boolean
        decimals?: number
        compact?: boolean
    }
): string {
    if (amount === undefined || amount === null) {
        return `${CURRENCIES[currency].symbol} 0`
    }

    const config = CURRENCIES[currency]
    const decimals = options?.decimals ?? 2

    // For compact format (e.g., K 1.2M)
    if (options?.compact && Math.abs(amount) >= 1000) {
        const formatter = new Intl.NumberFormat(config.locale, {
            notation: 'compact',
            compactDisplay: 'short',
            maximumFractionDigits: 1
        })
        return `${config.symbol} ${formatter.format(amount)}`
    }

    // Standard formatting
    const formatter = new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })

    const formattedNumber = formatter.format(Math.abs(amount))
    const sign = amount < 0 ? '-' : ''

    if (options?.showSymbol === false) {
        return `${sign}${formattedNumber}`
    }

    return `${sign}${config.symbol} ${formattedNumber}`
}

// Get the default currency based on user's location or preference
export function getDefaultCurrency(): Currency {
    // Check localStorage first
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dashly_currency')
        if (saved && saved in CURRENCIES) {
            return saved as Currency
        }
    }

    // Default to ZMW for Zambian market focus
    return 'ZMW'
}

// Save currency preference
export function saveCurrencyPreference(currency: Currency): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('dashly_currency', currency)
    }
}

// Convert between currencies (simplified - in production, use real exchange rates API)
export function convertCurrency(
    amount: number,
    from: Currency,
    to: Currency
): number {
    // Approximate exchange rates (as of 2025 - update with real API in production)
    const rates: Record<Currency, number> = {
        ZMW: 1,        // Base currency
        USD: 0.048,    // 1 ZMW ≈ 0.048 USD
        EUR: 0.044,    // 1 ZMW ≈ 0.044 EUR
        GBP: 0.038,    // 1 ZMW ≈ 0.038 GBP
    }

    // Convert from source to ZMW, then to target
    const inZMW = amount / rates[from]
    return inZMW * rates[to]
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`
}

// Format large numbers with suffixes (K, M, B)
export function formatCompactNumber(value: number, currency?: Currency): string {
    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : ''
    const symbol = currency ? CURRENCIES[currency].symbol : ''

    if (absValue >= 1e9) {
        return `${sign}${symbol} ${(absValue / 1e9).toFixed(1)}B`
    }
    if (absValue >= 1e6) {
        return `${sign}${symbol} ${(absValue / 1e6).toFixed(1)}M`
    }
    if (absValue >= 1e3) {
        return `${sign}${symbol} ${(absValue / 1e3).toFixed(1)}K`
    }
    return `${sign}${symbol} ${absValue.toFixed(0)}`
}