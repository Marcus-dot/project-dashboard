'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Project } from '@/types/project'

interface BudgetChartProps {
    projects: Project[]
}

export function BudgetChart({ projects }: BudgetChartProps) {
    // Prepare data for the chart
    const chartData = projects
        .filter(p => p.budget || p.actual_costs) // Only projects with financial data
        .slice(0, 10) // Limit to 10 projects for readability
        .map(project => ({
            name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
            budget: project.budget || 0,
            actual: project.actual_costs || 0,
            variance: (project.budget || 0) - (project.actual_costs || 0)
        }))

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            const budgetValue = payload.find((p: any) => p.dataKey === 'budget')?.value || 0
            const actualValue = payload.find((p: any) => p.dataKey === 'actual')?.value || 0
            const variance = budgetValue - actualValue
            const variancePercent = budgetValue > 0 ? Math.round((variance / budgetValue) * 100) : 0

            return (
                <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg shadow-xl">
                    <p className="text-white font-semibold mb-2">{data.name}</p>
                    <div className="space-y-1 text-sm">
                        <p className="text-blue-400">
                            Budget: ${budgetValue.toLocaleString()}
                        </p>
                        <p className="text-purple-400">
                            Actual: ${actualValue.toLocaleString()}
                        </p>
                        <p className={`font-semibold ${variance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {variance >= 0 ? 'Under' : 'Over'} Budget: ${Math.abs(variance).toLocaleString()} ({Math.abs(variancePercent)}%)
                        </p>
                    </div>
                </div>
            )
        }
        return null
    }

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                No budget data available
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: '14px' }}
                        iconType="circle"
                    />
                    <Bar
                        dataKey="budget"
                        fill="#3B82F6"
                        name="Budget"
                        radius={[8, 8, 0, 0]}
                    />
                    <Bar
                        dataKey="actual"
                        fill="#8B5CF6"
                        name="Actual Costs"
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                    <div className="text-xs text-gray-500 mb-1">Total Budget</div>
                    <div className="text-lg font-bold text-blue-600">
                        ${chartData.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}
                    </div>
                </div>
                <div>
                    <div className="text-xs text-gray-500 mb-1">Total Actual</div>
                    <div className="text-lg font-bold text-purple-600">
                        ${chartData.reduce((sum, p) => sum + p.actual, 0).toLocaleString()}
                    </div>
                </div>
                <div>
                    <div className="text-xs text-gray-500 mb-1">Variance</div>
                    <div className={`text-lg font-bold ${chartData.reduce((sum, p) => sum + p.variance, 0) >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                        ${Math.abs(chartData.reduce((sum, p) => sum + p.variance, 0)).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    )
}