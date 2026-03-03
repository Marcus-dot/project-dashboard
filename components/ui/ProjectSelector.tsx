'use client'

import { useEffect, useState } from 'react'
import { Project } from '@/types/project'
import { ProjectService } from '@/lib/services/projects'
import { Label } from '@/components/ui/label'

interface ProjectSelectorProps {
    selectedProjectId?: string
    onProjectSelect: (projectId: string | undefined) => void
    label?: string
    required?: boolean
}

export function ProjectSelector({
    selectedProjectId,
    onProjectSelect,
    label = "Link to Project (Optional)",
    required = false
}: ProjectSelectorProps) {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {
        try {
            const projectService = new ProjectService()
            const data = await projectService.getProjects()
            setProjects(data)
        } catch (error) {
            console.error('Error loading projects:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <Label htmlFor="project-selector">{label}</Label>
            <select
                id="project-selector"
                value={selectedProjectId || ''}
                onChange={(e) => onProjectSelect(e.target.value || undefined)}
                disabled={loading}
                required={required}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
            >
                <option value="">
                    {loading ? 'Loading projects...' : 'None - Save as standalone calculation'}
                </option>
                {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                        {project.name} ({project.status})
                    </option>
                ))}
            </select>
            {projects.length === 0 && !loading && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    No projects available. Create a project first to link calculations.
                </p>
            )}
        </div>
    )
}