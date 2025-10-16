'use client'

import { formatCurrency } from '@/lib/utils/calculations'
import { useCurrency } from '@/lib/context/CurrencyContext'
import { TrendingUp, TrendingDown, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'

interface ReportStatsProps {
    stats: {
        total: number
        inProgress: number
        completed: number
        planning: number
        highPriority: number
        totalBudget: number
        totalActualCosts: number
        totalNPV: number
        budgetVariance: number
        budgetVariancePercentage: string
        completionRate: string
        averageNPV: string
    }
}

export function ReportStats({ stats }: ReportStatsProps) {
    const { currency } = useCurrency()

    const isOverBudget = stats.budgetVariance < 0
    const isPositiveNPV = stats.totalNPV >= 0

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Projects */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="text-sm font-medium text-blue-600 mb-1">Total Projects</div>
                    <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
                    <div className="text-xs text-blue-600 mt-1">
                        {stats.completed} completed • {stats.inProgress} active
                    </div>
                </div>

                {/* Completion Rate */}
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <div className="text-sm font-medium text-green-600 mb-1 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Completion Rate
                    </div>
                    <div className="text-3xl font-bold text-green-700">{stats.completionRate}%</div>
                    <div className="text-xs text-green-600 mt-1">
                        {stats.completed} of {stats.total} projects
                    </div>
                </div>

                {/* High Priority */}
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <div className="text-sm font-medium text-red-600 mb-1 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        High Priority
                    </div>
                    <div className="text-3xl font-bold text-red-700">{stats.highPriority}</div>
                    <div className="text-xs text-red-600 mt-1">
                        {stats.planning} in planning stage
                    </div>
                </div>

                {/* Portfolio NPV */}
                <div className={`p-4 rounded-xl border ${isPositiveNPV ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <div className={`text-sm font-medium mb-1 flex items-center gap-2 ${isPositiveNPV ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <DollarSign className="w-4 h-4" />
                        Portfolio NPV
                    </div>
                    <div className={`text-2xl font-bold ${isPositiveNPV ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCurrency(stats.totalNPV, currency)}
                    </div>
                    <div className={`text-xs mt-1 ${isPositiveNPV ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Avg: {formatCurrency(parseFloat(stats.averageNPV), currency)}
                    </div>
                </div>
            </div>

            {/* Financial Overview */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Overview</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Budget */}
                    <div>
                        <div className="text-sm text-gray-500 mb-1">Total Budget</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {formatCurrency(stats.totalBudget, currency)}
                        </div>
                    </div>

                    {/* Actual Costs */}
                    <div>
                        <div className="text-sm text-gray-500 mb-1">Actual Costs</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {formatCurrency(stats.totalActualCosts, currency)}
                        </div>
                    </div>

                    {/* Budget Variance */}
                    <div>
                        <div className="text-sm text-gray-500 mb-1">Budget Variance</div>
                        <div className={`text-2xl font-bold flex items-center gap-2 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                            {isOverBudget ? (
                                <TrendingDown className="w-6 h-6" />
                            ) : (
                                <TrendingUp className="w-6 h-6" />
                            )}
                            {formatCurrency(Math.abs(stats.budgetVariance), currency)}
                        </div>
                        <div className={`text-xs mt-1 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                            {isOverBudget ? 'Over' : 'Under'} budget by {Math.abs(parseFloat(stats.budgetVariancePercentage))}%
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Budget Utilization</span>
                        <span>{stats.totalBudget > 0 ? ((stats.totalActualCosts / stats.totalBudget) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{
                                width: `${Math.min(stats.totalBudget > 0 ? (stats.totalActualCosts / stats.totalBudget) * 100 : 0, 100)}%`
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}