'use client'

import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, DollarSign, Clock, CheckCircle, XCircle, Lightbulb, BarChart3 } from 'lucide-react'

interface NPVChartProps {
    expectedRevenue: number
    actualCosts: number
    discountRate: number
    durationMonths: number
}

export function NPVChart({ expectedRevenue, actualCosts, discountRate, durationMonths }: NPVChartProps) {
    // Calculate NPV data points for each month
    const calculateNPVData = () => {
        const data = []
        const monthlyRevenue = expectedRevenue / durationMonths
        const rate = discountRate / 100 / 12 // Monthly discount rate

        let cumulativeNPV = -actualCosts // Start with negative cost

        // Month 0: Initial investment
        data.push({
            month: 0,
            cumulativeNPV: -actualCosts,
            presentValue: 0,
            revenue: 0,
            label: 'Start'
        })

        // Calculate for each month
        for (let month = 1; month <= durationMonths; month++) {
            // Present value of this month's revenue
            const monthPV = monthlyRevenue / Math.pow(1 + rate, month)
            cumulativeNPV += monthPV

            data.push({
                month,
                cumulativeNPV: Math.round(cumulativeNPV * 100) / 100,
                presentValue: Math.round(monthPV * 100) / 100,
                revenue: Math.round(monthlyRevenue * 100) / 100,
                label: `M${month}`
            })
        }

        return data
    }

    const data = calculateNPVData()
    const finalNPV = data[data.length - 1].cumulativeNPV

    // Find breakeven point (where NPV crosses zero)
    const breakevenMonth = data.findIndex(d => d.cumulativeNPV > 0)

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg shadow-xl">
                    <p className="text-white font-semibold mb-2">Month {data.month}</p>
                    <div className="space-y-1 text-sm">
                        <p className="text-emerald-400">
                            Cumulative NPV: ${data.cumulativeNPV.toLocaleString()}
                        </p>
                        <p className="text-blue-400">
                            Monthly Revenue: ${data.revenue.toLocaleString()}
                        </p>
                        <p className="text-purple-400">
                            Present Value: ${data.presentValue.toLocaleString()}
                        </p>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm opacity-90">Final NPV</div>
                        <DollarSign className="w-5 h-5 opacity-80" />
                    </div>
                    <div className="text-3xl font-bold">${finalNPV.toLocaleString()}</div>
                    <div className="flex items-center gap-1 text-xs opacity-75 mt-1">
                        {finalNPV > 0 ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{finalNPV > 0 ? 'Project is profitable' : 'Project loses value'}</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm opacity-90">Breakeven Point</div>
                        <TrendingUp className="w-5 h-5 opacity-80" />
                    </div>
                    <div className="text-3xl font-bold">
                        {breakevenMonth > 0 ? `Month ${breakevenMonth}` : 'N/A'}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                        {breakevenMonth > 0
                            ? 'When project becomes profitable'
                            : 'Project never breaks even'
                        }
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm opacity-90">Total Duration</div>
                        <Clock className="w-5 h-5 opacity-80" />
                    </div>
                    <div className="text-3xl font-bold">{durationMonths}m</div>
                    <div className="text-xs opacity-75 mt-1">
                        {Math.round(durationMonths / 12 * 10) / 10} years
                    </div>
                </div>
            </div>

            {/* NPV Growth Chart */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-gray-800">NPV Growth Over Time</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorNPV" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="label"
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="cumulativeNPV"
                            stroke="#10b981"
                            strokeWidth={3}
                            fill="url(#colorNPV)"
                        />
                        {/* Zero line */}
                        <Line
                            type="monotone"
                            dataKey={() => 0}
                            stroke="#ef4444"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>

                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                        <span className="text-gray-600">Cumulative NPV</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-red-500"></div>
                        <span className="text-gray-600">Breakeven Line</span>
                    </div>
                </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Present Value Breakdown</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="label"
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="presentValue"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            name="Monthly PV"
                            dot={{ fill: '#8b5cf6', r: 4 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Monthly Revenue"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>

                <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                        <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">
                            <strong>What this shows:</strong> The purple line shows the <em>present value</em> of each month's revenue.
                            Notice how it decreases over time? That's the time value of money at work - money received later is worth less today!
                        </p>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-semibold text-gray-800">Key Metrics</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Expected Revenue</div>
                        <div className="text-xl font-bold text-gray-800">${expectedRevenue.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Actual Costs</div>
                        <div className="text-xl font-bold text-gray-800">${actualCosts.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Discount Rate</div>
                        <div className="text-xl font-bold text-gray-800">{discountRate}%</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">ROI</div>
                        <div className={`text-xl font-bold ${finalNPV > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.round((finalNPV / actualCosts) * 100)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}