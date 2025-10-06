'use client'

import { useState } from 'react'
import { Project, Priority, Status } from '@/types/project'


// Define what props this component accepts
interface ProjectFormProps {
    project?: Project                              // Optional - if editing
    onSubmit: (data: Partial<Project>) => Promise<void>  // Function to call on submit
    onCancel: () => void                          // Function to call on cancel
}

export function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [showAdvanced, setShowAdvanced] = useState(false)

    const [formData, setFormData] = useState({
        name: project?.name || '',
        owner: project?.owner || '',
        details: project?.details || '',
        duration: project?.duration || '',
        start_date: project?.start_date || '',
        priority: project?.priority || 'Medium',
        status: project?.status || 'Planning',
        notes: project?.notes || '',
        budget: project?.budget || '',
        expected_revenue: project?.expected_revenue || '',
        discount_rate: project?.discount_rate || '10',
        actual_costs: project?.actual_costs || '',
    })

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()  // Prevent page refresh
        setIsSubmitting(true)

        try {
            await onSubmit({
                name: formData.name,
                owner: formData.owner || undefined,
                details: formData.details || undefined,
                notes: formData.notes || undefined,
                start_date: formData.start_date || undefined,
                priority: formData.priority as Priority,
                status: formData.status as Status,
                duration: formData.duration ? parseInt(formData.duration.toString()) : undefined,
                budget: formData.budget ? parseFloat(formData.budget.toString()) : undefined,
                expected_revenue: formData.expected_revenue ? parseFloat(formData.expected_revenue.toString()) : undefined,
                discount_rate: formData.discount_rate ? parseFloat(formData.discount_rate.toString()) : undefined,
                actual_costs: formData.actual_costs ? parseFloat(formData.actual_costs.toString()) : undefined,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        // Modal backdrop (dark overlay)
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            {/* Modal content */}
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Modal header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">
                        {project ? 'Edit Project' : 'Add New Project'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Project Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter project name"
                        />
                    </div>

                    {/* Owner */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Owner
                        </label>
                        <input
                            type="text"
                            value={formData.owner}
                            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Who owns this project?"
                        />
                    </div>

                    {/* Details */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Details
                        </label>
                        <textarea
                            rows={3}
                            value={formData.details}
                            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Describe the project..."
                        />
                    </div>

                    {/* Duration and Start Date - Side by side */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (months)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g., 6"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Priority and Status - Side by side */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="Planning">Planning</option>
                                <option value="In progress">In Progress</option>
                                <option value="Complete">Complete</option>
                                <option value="Paused">Paused</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            rows={2}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Any additional notes..."
                        />
                    </div>

                    {/* Advanced Section Toggle */}
                    <div className="pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            <span>{showAdvanced ? '▼' : '▶'}</span>
                            Financial & Risk Assessment
                        </button>
                    </div>

                    {/* Advanced Fields */}
                    {showAdvanced && (
                        <div className="space-y-4 pt-2 pl-4 border-l-2 border-indigo-200">
                            {/* Budget and Expected Revenue */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Budget ($)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Expected Revenue ($)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.expected_revenue}
                                        onChange={(e) => setFormData({ ...formData, expected_revenue: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Actual Costs and Discount Rate */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Actual Costs ($)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.actual_costs}
                                        onChange={(e) => setFormData({ ...formData, actual_costs: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Discount Rate (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={formData.discount_rate}
                                        onChange={(e) => setFormData({ ...formData, discount_rate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="10"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800">
                                <strong>NPV Calculation:</strong> NPV will be automatically calculated based on expected revenue, actual costs, discount rate, and project duration.
                            </div>
                        </div>
                    )}

                    {/* Form buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? 'Saving...' : project ? 'Save Changes' : 'Add Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}