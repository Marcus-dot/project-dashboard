'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Currency, getDefaultCurrency, saveCurrencyPreference } from '@/lib/utils/currency'

interface CurrencyContextType {
    currency: Currency
    setCurrency: (currency: Currency) => void
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>('ZMW')

    // Load saved currency preference on mount (client-side only)
    useEffect(() => {
        const savedCurrency = getDefaultCurrency()
        setCurrencyState(savedCurrency)
    }, [])

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency)
        saveCurrencyPreference(newCurrency)
    }

    // Always render with Provider - no conditional rendering!
    return (
        <CurrencyContext.Provider value={{ currency, setCurrency }}>
            {children}
        </CurrencyContext.Provider>
    )
}

export function useCurrency() {
    const context = useContext(CurrencyContext)
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider')
    }
    return context
}