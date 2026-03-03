'use client'

import { Project } from '@/types/project'
import { NPVChart } from '@/components/charts/NPVChart'
import { BarChart3, AlertCircle, X, Printer, FileText } from 'lucide-react'
import { useCurrency } from '@/lib/context/CurrencyContext'
import { formatCurrency } from '@/lib/utils/currency'

interface NPVModalProps {
    project: Project
    onClose: () => void
}

export function NPVModal({ project, onClose }: NPVModalProps) {
    const { currency } = useCurrency()

    // Don't render if required NPV data is missing
    if (!project.expected_revenue || !project.actual_costs || !project.duration) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="w-6 h-6 text-amber-500" />
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Missing NPV Data</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        This project doesn't have complete financial data for NPV calculation.
                        Please ensure it has Expected Revenue, Actual Costs, and Duration values.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto my-8 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl shadow-lg z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-7 h-7" />
                            <div>
                                <h2 className="text-2xl font-bold mb-1">NPV Analysis</h2>
                                <p className="text-indigo-100">{project.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                            title="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <NPVChart
                        expectedRevenue={project.expected_revenue}
                        actualCosts={project.actual_costs}
                        discountRate={project.discount_rate || 10}
                        durationMonths={project.duration}
                    />

                    {/* Project Details Summary */}
                    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Project Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Owner:</span>
                                <span className="ml-2 font-medium text-gray-800 dark:text-white">{project.owner || 'Not specified'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <span className="ml-2 font-medium text-gray-800 dark:text-white">{project.status}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Priority:</span>
                                <span className="ml-2 font-medium text-gray-800 dark:text-white">{project.priority}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Scale:</span>
                                <span className="ml-2 font-medium text-gray-800 dark:text-white">{project.scale}</span>
                            </div>
                            {project.start_date && (
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Start Date:</span>
                                    <span className="ml-2 font-medium text-gray-800 dark:text-white">
                                        {new Date(project.start_date).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            {project.budget && (
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Budget:</span>
                                    <span className="ml-2 font-medium text-gray-800 dark:text-white">
                                        {formatCurrency(project.budget, currency)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {project.details && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Description:</div>
                                <p className="text-gray-700 dark:text-gray-300">{project.details}</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            <Printer className="w-4 h-4" />
                            Print Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}