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
    const [mounted, setMounted] = useState(false)

    // Load saved currency preference on mount
    useEffect(() => {
        setMounted(true)
        const savedCurrency = getDefaultCurrency()
        setCurrencyState(savedCurrency)
    }, [])

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency)
        saveCurrencyPreference(newCurrency)
    }

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return <>{children}</>
    }

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