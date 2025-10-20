'use client'

import { useState } from 'react'
import { Project } from '@/types/project'
import { NPVModal } from '@/components/modals/NPVModal'
import { Edit2, Trash2, BarChart3 } from 'lucide-react'
import { useCurrency } from '@/lib/context/CurrencyContext'
import { formatCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'

interface ProjectCardProps {
    project: Project
    onEdit: (project: Project) => void
    onDelete: (id: string) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
    const { currency } = useCurrency()
    const [isDeleting, setIsDeleting] = useState(false)
    const [showNPVModal, setShowNPVModal] = useState(false)

    const handleDelete = async () => {
        toast.error(`Delete "${project.name}"?`, {
            description: 'This action cannot be undone',
            duration: 6000,
            action: {
                label: 'Delete',
                onClick: async () => {
                    setIsDeleting(true)
                    await onDelete(project.id)
                    toast.success('Project deleted', {
                        description: 'Project removed successfully',
                        duration: 3000
                    })
                }
            },
            cancel: {
                label: 'Cancel',
                onClick: () => toast.dismiss()
            }
        })
    }

    const scaleColors = {
        'Short-term': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
        'Medium-term': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
        'Long-term': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
    }

    const statusColors = {
        'Planning': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
        'In progress': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
        'Complete': 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
        'Paused': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
        'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
    }

    const priorityColors = {
        'High': 'bg-red-500',
        'Medium': 'bg-yellow-500',
        'Low': 'bg-green-500'
    }

    // Check if project has complete NPV data
    const hasNPVData = project.expected_revenue && project.actual_costs && project.duration

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 group">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${priorityColors[project.priority]}`} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">{project.name}</h3>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(project)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Edit"
                        >
                            <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Description */}
                {project.details && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{project.details}</p>
                )}

                {/* Status and Scale Badges */}
                <div className="flex gap-2 mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${scaleColors[project.scale]}`}>
                        {project.scale}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[project.status]}`}>
                        {project.status}
                    </span>
                </div>

                {/* Project Info */}
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {project.owner && (
                        <div>
                            <span className="font-medium">Owner:</span> {project.owner}
                        </div>
                    )}
                    {project.duration && (
                        <div>
                            <span className="font-medium">Duration:</span> {project.duration} months
                        </div>
                    )}
                    {project.start_date && (
                        <div>
                            <span className="font-medium">Start:</span> {new Date(project.start_date).toLocaleDateString()}
                        </div>
                    )}
                </div>

                {project.notes && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{project.notes}</p>
                    </div>
                )}

                {/* Financial Section */}
                {(project.budget || project.npv !== undefined) && (
                    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Financial</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {project.budget !== undefined && project.budget > 0 && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Budget:</span>
                                    <div className="font-semibold text-gray-800 dark:text-white">
                                        {formatCurrency(project.budget, currency)}
                                    </div>
                                </div>
                            )}
                            {project.actual_costs !== undefined && project.actual_costs > 0 && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Actual:</span>
                                    <div className="font-semibold text-gray-800 dark:text-white">
                                        {formatCurrency(project.actual_costs, currency)}
                                    </div>
                                </div>
                            )}
                            {project.npv !== undefined && project.npv !== null && (
                                <div className="col-span-2 mt-1">
                                    <span className="text-gray-600 dark:text-gray-400">NPV:</span>
                                    <div className={`font-bold text-sm ${project.npv >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(project.npv, currency)}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* NPV Analysis Button */}
                        {hasNPVData && (
                            <button
                                onClick={() => setShowNPVModal(true)}
                                className="mt-3 w-full py-2 px-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                <BarChart3 className="w-4 h-4" />
                                View NPV Analysis
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* NPV Modal */}
            {showNPVModal && (
                <NPVModal
                    project={project}
                    onClose={() => setShowNPVModal(false)}
                />
            )}
        </>
    )
}