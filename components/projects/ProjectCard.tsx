'use client'

import { useState } from 'react'
import { Project } from '@/types/project'
import { formatCurrency } from '@/lib/utils/calculations'

// Define what props this component accepts
interface ProjectCardProps {
    project: Project
    onEdit: (project: Project) => void
    onDelete: (id: string) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    // Handle delete with confirmation
    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this project?')) {
            setIsDeleting(true)
            await onDelete(project.id)
        }
    }

    // Color schemes matching the Demo's design!
    const scaleColors = {
        'Short-term': 'bg-orange-100 text-orange-700',
        'Medium-term': 'bg-blue-100 text-blue-700',
        'Long-term': 'bg-purple-100 text-purple-700'
    }

    const statusColors = {
        'Planning': 'bg-gray-100 text-gray-700',
        'In progress': 'bg-green-100 text-green-700',
        'Complete': 'bg-gray-200 text-gray-700',
        'Paused': 'bg-yellow-100 text-yellow-700',
        'Cancelled': 'bg-red-100 text-red-700'
    }

    const priorityColors = {
        'High': 'bg-red-500',
        'Medium': 'bg-yellow-500',
        'Low': 'bg-green-500'
    }

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 group">
            {/* Header with priority indicator and actions */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${priorityColors[project.priority]}`} />
                    <h3 className="font-semibold text-gray-800">{project.name}</h3>
                </div>

                {/* Edit and Delete buttons - only visible on hover */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(project)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Edit"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-1 hover:bg-red-50 rounded"
                        title="Delete"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* Project details */}
            <p className="text-sm text-gray-600 mb-4">
                {project.details || <em className="text-gray-400">No details provided</em>}
            </p>

            {/* Tags and metadata */}
            <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${scaleColors[project.scale]}`}>
                        {project.scale}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[project.status]}`}>
                        {project.status}
                    </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                    {project.owner && (
                        <div><span className="font-medium">Owner:</span> {project.owner}</div>
                    )}
                    {project.duration && (
                        <div><span className="font-medium">Duration:</span> {project.duration} months</div>
                    )}
                    {project.start_date && (
                        <div><span className="font-medium">Start:</span> {new Date(project.start_date).toLocaleDateString()}</div>
                    )}
                </div>

                {project.notes && (
                    <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">{project.notes}</p>
                    </div>
                )}

                {(project.budget || project.npv !== undefined) && (
                    <div className="pt-3 mt-3 border-t border-gray-200">
                        <div className="text-xs font-medium text-gray-500 mb-2">Financial</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {project.budget !== undefined && project.budget > 0 && (
                                <div>
                                    <span className="text-gray-600">Budget:</span>
                                    <div className="font-semibold text-gray-800">{formatCurrency(project.budget)}</div>
                                </div>
                            )}
                            {project.actual_costs !== undefined && project.actual_costs > 0 && (
                                <div>
                                    <span className="text-gray-600">Actual:</span>
                                    <div className="font-semibold text-gray-800">{formatCurrency(project.actual_costs)}</div>
                                </div>
                            )}
                            {project.npv !== undefined && project.npv !== null && (
                                <div className="col-span-2 mt-1">
                                    <span className="text-gray-600">NPV:</span>
                                    <div className={`font-bold text-sm ${project.npv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(project.npv)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}