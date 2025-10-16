'use client'

import { useState } from 'react'
import { DollarSign, ChevronDown } from 'lucide-react'
import { useCurrency } from '@/lib/context/CurrencyContext'
import { CURRENCIES, Currency } from '@/lib/utils/currency'

export function CurrencySelector() {
    const { currency, setCurrency } = useCurrency()
    const [isOpen, setIsOpen] = useState(false)

    const currentConfig = CURRENCIES[currency]

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
            >
                <DollarSign className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-sm text-gray-700">
                    {currentConfig.symbol} {currentConfig.code}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                        <div className="p-2 bg-gray-50 border-b border-gray-200">
                            <p className="text-xs font-medium text-gray-500 px-2">Select Currency</p>
                        </div>

                        <div className="py-1">
                            {Object.entries(CURRENCIES).map(([code, config]) => (
                                <button
                                    key={code}
                                    onClick={() => {
                                        setCurrency(code as Currency)
                                        setIsOpen(false)
                                    }}
                                    className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors ${currency === code ? 'bg-indigo-50' : ''
                                        }`}
                                >
                                    <span className="text-xl">{config.flag}</span>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium text-sm text-gray-800">
                                            {config.code}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {config.name}
                                        </div>
                                    </div>
                                    {currency === code && (
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-3 bg-gray-50 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                💡 Your preference is saved automatically
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}