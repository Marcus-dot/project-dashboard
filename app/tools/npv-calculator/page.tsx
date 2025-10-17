'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calculator, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useCurrency } from '@/lib/context/CurrencyContext'
import { formatCurrency } from '@/lib/utils/currency'

interface CashFlow {
    year: number
    amount: number
}

interface NPVResult {
    npv: number
    isViable: boolean
    presentValues: { year: number; pv: number; cumulative: number }[]
}

export default function NPVCalculatorPage() {
    const router = useRouter()
    const { currency } = useCurrency()

    // Form inputs
    const [initialInvestment, setInitialInvestment] = useState<number>(100000)
    const [discountRate, setDiscountRate] = useState<number>(10)
    const [duration, setDuration] = useState<number>(5)
    const [cashFlows, setCashFlows] = useState<CashFlow[]>([
        { year: 1, amount: 30000 },
        { year: 2, amount: 35000 },
        { year: 3, amount: 40000 },
        { year: 4, amount: 40000 },
        { year: 5, amount: 35000 },
    ])

    const [result, setResult] = useState<NPVResult | null>(null)

    // Calculate NPV whenever inputs change
    useEffect(() => {
        calculateNPV()
    }, [initialInvestment, discountRate, duration, cashFlows])

    const calculateNPV = () => {
        const rate = discountRate / 100
        let cumulativeNPV = -initialInvestment
        const presentValues: { year: number; pv: number; cumulative: number }[] = []

        // Year 0 - Initial Investment
        presentValues.push({
            year: 0,
            pv: -initialInvestment,
            cumulative: -initialInvestment
        })

        // Calculate PV for each year
        cashFlows.forEach((cf) => {
            const pv = cf.amount / Math.pow(1 + rate, cf.year)
            cumulativeNPV += pv

            presentValues.push({
                year: cf.year,
                pv: pv,
                cumulative: cumulativeNPV
            })
        })

        const npv = cumulativeNPV
        const isViable = npv >= 0

        setResult({ npv, isViable, presentValues })
    }

    const handleDurationChange = (newDuration: number) => {
        setDuration(newDuration)

        // Adjust cash flows array to match duration
        const newCashFlows: CashFlow[] = []
        for (let i = 1; i <= newDuration; i++) {
            const existingCF = cashFlows.find(cf => cf.year === i)
            newCashFlows.push({
                year: i,
                amount: existingCF?.amount || 30000
            })
        }
        setCashFlows(newCashFlows)
    }

    const updateCashFlow = (year: number, amount: number) => {
        setCashFlows(cashFlows.map(cf =>
            cf.year === year ? { ...cf, amount } : cf
        ))
    }

    const addYear = () => {
        const newYear = duration + 1
        setDuration(newYear)
        setCashFlows([...cashFlows, { year: newYear, amount: 30000 }])
    }

    const removeYear = () => {
        if (duration > 1) {
            const newDuration = duration - 1
            setDuration(newDuration)
            setCashFlows(cashFlows.filter(cf => cf.year <= newDuration))
        }
    }

    const resetForm = () => {
        setInitialInvestment(100000)
        setDiscountRate(10)
        setDuration(5)
        setCashFlows([
            { year: 1, amount: 30000 },
            { year: 2, amount: 35000 },
            { year: 3, amount: 40000 },
            { year: 4, amount: 40000 },
            { year: 5, amount: 35000 },
        ])
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </Link>

                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                            <Calculator className="w-8 h-8 text-indigo-600" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">NPV Calculator</h1>
                                <p className="text-gray-600">Net Present Value Analysis Tool</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Input Form */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Investment Parameters</h2>

                        {/* Initial Investment */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Initial Investment ({currency})
                            </label>
                            <input
                                type="number"
                                value={initialInvestment}
                                onChange={(e) => setInitialInvestment(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                step="1000"
                            />
                        </div>

                        {/* Discount Rate */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Discount Rate (%)
                            </label>
                            <input
                                type="number"
                                value={discountRate}
                                onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                step="0.5"
                                min="0"
                                max="100"
                            />
                        </div>

                        {/* Duration */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Project Duration (Years)
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={removeYear}
                                    disabled={duration <= 1}
                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                                    min="1"
                                    max="30"
                                />
                                <button
                                    onClick={addYear}
                                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Cash Flows */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Expected Cash Flows by Year
                            </label>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {cashFlows.map((cf) => (
                                    <div key={cf.year} className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-600 w-16">Year {cf.year}:</span>
                                        <input
                                            type="number"
                                            value={cf.amount}
                                            onChange={(e) => updateCashFlow(cf.year, parseFloat(e.target.value) || 0)}
                                            className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                            step="1000"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={resetForm}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Reset to Defaults
                        </button>
                    </div>

                    {/* Right: Results */}
                    <div className="space-y-6">
                        {/* NPV Result Card */}
                        {result && (
                            <div className={`p-6 rounded-xl border-2 ${result.isViable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    {result.isViable ? (
                                        <TrendingUp className="w-8 h-8 text-green-600" />
                                    ) : (
                                        <TrendingDown className="w-8 h-8 text-red-600" />
                                    )}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">Net Present Value</h3>
                                        <p className={`text-3xl font-bold ${result.isViable ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(result.npv, currency)}
                                        </p>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-lg ${result.isViable ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <p className={`text-sm font-semibold ${result.isViable ? 'text-green-800' : 'text-red-800'}`}>
                                        {result.isViable ? '✓ Project is Viable' : '✗ Project is Not Viable'}
                                    </p>
                                    <p className={`text-xs mt-1 ${result.isViable ? 'text-green-700' : 'text-red-700'}`}>
                                        {result.isViable
                                            ? 'The project generates positive value. Expected returns exceed the cost of capital.'
                                            : 'The project destroys value. Expected returns are below the cost of capital. Consider revising parameters.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Cumulative NPV Chart */}
                        {result && (
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Cumulative Present Value Over Time</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={result.presentValues}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="year"
                                            label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                                        />
                                        <YAxis
                                            label={{ value: `Value (${currency})`, angle: -90, position: 'insideLeft' }}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value, currency)}
                                            labelFormatter={(label) => `Year ${label}`}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="cumulative"
                                            stroke="#4f46e5"
                                            strokeWidth={3}
                                            name="Cumulative NPV"
                                            dot={{ fill: '#4f46e5', r: 5 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Explanation */}
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                            <h3 className="text-lg font-semibold text-blue-800 mb-3">How NPV Works</h3>
                            <ul className="space-y-2 text-sm text-blue-700">
                                <li>• <strong>NPV</strong> calculates the present value of future cash flows minus initial investment</li>
                                <li>• <strong>Positive NPV</strong> means the project is expected to generate value</li>
                                <li>• <strong>Negative NPV</strong> means the project will likely destroy value</li>
                                <li>• The <strong>discount rate</strong> reflects the cost of capital or required return</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}