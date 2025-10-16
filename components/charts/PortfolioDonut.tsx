'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Project } from '@/types/project'

interface PortfolioDonutProps {
    projects: Project[]
    type: 'status' | 'priority'
}

export function PortfolioDonut({ projects, type }: PortfolioDonutProps) {
    // Calculate distribution data
    const getDistributionData = () => {
        if (type === 'status') {
            const statusCounts = projects.reduce((acc, project) => {
                acc[project.status] = (acc[project.status] || 0) + 1
                return acc
            }, {} as Record<string, number>)

            return Object.entries(statusCounts).map(([name, value]) => ({
                name,
                value,
                percentage: Math.round((value / projects.length) * 100)
            }))
        } else {
            const priorityCounts = projects.reduce((acc, project) => {
                acc[project.priority] = (acc[project.priority] || 0) + 1
                return acc
            }, {} as Record<string, number>)

            return Object.entries(priorityCounts).map(([name, value]) => ({
                name,
                value,
                percentage: Math.round((value / projects.length) * 100)
            }))
        }
    }

    const data = getDistributionData()

    // Color schemes
    const statusColors: Record<string, string> = {
        'Planning': '#6B7280',
        'In progress': '#10B981',
        'Complete': '#3B82F6',
        'Paused': '#F59E0B',
        'Cancelled': '#EF4444'
    }

    const priorityColors: Record<string, string> = {
        'High': '#EF4444',
        'Medium': '#F59E0B',
        'Low': '#10B981'
    }

    const colors = type === 'status' ? statusColors : priorityColors

    // Custom label
    const renderCustomLabel = (entry: any) => {
        return `${entry.percentage}%`
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0]
            return (
                <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl">
                    <p className="text-white font-semibold mb-1">{data.name}</p>
                    <p className="text-gray-300 text-sm">
                        {data.value} project{data.value !== 1 ? 's' : ''} ({data.payload.percentage}%)
                    </p>
                </div>
            )
        }
        return null
    }

    if (projects.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                No projects to display
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={renderCustomLabel}
                        labelLine={false}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={colors[entry.name] || '#6B7280'}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3">
                {data.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: colors[entry.name] || '#6B7280' }}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-700 truncate">
                                {entry.name}
                            </div>
                            <div className="text-xs text-gray-500">
                                {entry.value} ({entry.percentage}%)
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}