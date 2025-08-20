'use client'

import { useEffect, useState } from 'react'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { ProjectService } from '@/lib/services/projects'
import { Project } from '@/types/project'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
    // State management
    const [projects, setProjects] = useState<Project[]>([])
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | undefined>()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentFilter, setCurrentFilter] = useState('all')

    // Create an instance of our project service
    const projectService = new ProjectService()
    const supabase = createClient()
    const router = useRouter()
    const [userEmail, setUserEmail] = useState<string>('')

    // Load projects when page loads
    useEffect(() => {
        loadProjects()
    }, [])

    // Filter projects when search or filter changes
    useEffect(() => {
        filterProjects()
    }, [projects, searchTerm, currentFilter])

    // Check authentication and get user info
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
            } else {
                setUserEmail(user.email || '')
            }
        }
        checkUser()
    }, [])

    // FUNCTION: Load all projects from database
    const loadProjects = async () => {
        try {
            const data = await projectService.getProjects()
            setProjects(data)
        } catch (error) {
            console.error('Error loading projects:', error)
        } finally {
            setLoading(false)
        }
    }

    // FUNCTION: Filter projects based on search and scale filter
    const filterProjects = () => {
        let filtered = [...projects]

        // Apply scale filter
        if (currentFilter !== 'all') {
            filtered = filtered.filter(p => p.scale === currentFilter)
        }

        // Apply search
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.owner?.toLowerCase().includes(term) ||
                p.details?.toLowerCase().includes(term)
            )
        }

        setFilteredProjects(filtered)
    }

    // FUNCTION: Create a new project
    const handleCreateProject = async (data: Partial<Project>) => {
        try {
            const newProject = await projectService.createProject(data)
            setProjects([newProject, ...projects])
            setShowForm(false)
        } catch (error) {
            console.error('Error creating project:', error)
            alert('Failed to create project. Please try again.')
        }
    }

    // FUNCTION: Update an existing project
    const handleUpdateProject = async (data: Partial<Project>) => {
        if (!editingProject) return

        try {
            const updated = await projectService.updateProject(editingProject.id, data)
            setProjects(projects.map(p => p.id === updated.id ? updated : p))
            setEditingProject(undefined)
        } catch (error) {
            console.error('Error updating project:', error)
            alert('Failed to update project. Please try again.')
        }
    }

    // FUNCTION: Delete a project
    const handleDeleteProject = async (id: string) => {
        try {
            await projectService.deleteProject(id)
            setProjects(projects.filter(p => p.id !== id))
        } catch (error) {
            console.error('Error deleting project:', error)
            alert('Failed to delete project. Please try again.')
        }
    }

    // FUNCTION: Export projects as JSON
    const handleExport = () => {
        const dataStr = JSON.stringify(projects, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `projects_${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    // FUNCTION: Handle logout
    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    // Calculate statistics
    const stats = {
        total: projects.length,
        inProgress: projects.filter(p => p.status === 'In progress').length,
        shortTerm: projects.filter(p => p.scale === 'Short-term').length,
        longTerm: projects.filter(p => p.scale === 'Long-term').length
    }

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Loading projects...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="bg-white p-8 rounded-2xl w-full max-w-7xl mx-auto">
                {/* User info bar - NOW INSIDE THE WHITE CONTAINER */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <div className="text-sm text-gray-600">
                        Logged in as: <span className="font-medium">{userEmail}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Header - matching your SO's design! */}
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
                    Project Scale & Prioritization Dashboard
                </h1>
                <p className="text-center text-gray-500 mb-8">
                    Strategically visualize and manage all internal projects.
                </p>

                {/* Stats Section - exactly like the original! */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blue-100 p-6 rounded-xl flex flex-col items-center justify-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">{stats.total}</div>
                        <div className="text-sm font-medium text-blue-800 text-center">Total Projects</div>
                    </div>
                    <div className="bg-green-100 p-6 rounded-xl flex flex-col items-center justify-center">
                        <div className="text-4xl font-bold text-green-600 mb-2">{stats.inProgress}</div>
                        <div className="text-sm font-medium text-green-800 text-center">In Progress</div>
                    </div>
                    <div className="bg-orange-100 p-6 rounded-xl flex flex-col items-center justify-center">
                        <div className="text-4xl font-bold text-orange-600 mb-2">{stats.shortTerm}</div>
                        <div className="text-sm font-medium text-orange-800 text-center">Short-Term</div>
                    </div>
                    <div className="bg-purple-100 p-6 rounded-xl flex flex-col items-center justify-center">
                        <div className="text-4xl font-bold text-purple-600 mb-2">{stats.longTerm}</div>
                        <div className="text-sm font-medium text-purple-800 text-center">Long-Term</div>
                    </div>
                </div>

                {/* Filter & Add Project Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentFilter('all')}
                            className={`px-4 py-2 font-medium rounded-lg transition-colors ${currentFilter === 'all'
                                ? 'bg-gray-300 text-gray-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setCurrentFilter('Short-term')}
                            className={`px-4 py-2 font-medium rounded-lg transition-colors ${currentFilter === 'Short-term'
                                ? 'bg-orange-300 text-orange-800'
                                : 'bg-orange-200 text-orange-800 hover:bg-orange-300'
                                }`}
                        >
                            Short-Term
                        </button>
                        <button
                            onClick={() => setCurrentFilter('Medium-term')}
                            className={`px-4 py-2 font-medium rounded-lg transition-colors ${currentFilter === 'Medium-term'
                                ? 'bg-blue-300 text-blue-800'
                                : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                                }`}
                        >
                            Medium-Term
                        </button>
                        <button
                            onClick={() => setCurrentFilter('Long-term')}
                            className={`px-4 py-2 font-medium rounded-lg transition-colors ${currentFilter === 'Long-term'
                                ? 'bg-purple-300 text-purple-800'
                                : 'bg-purple-200 text-purple-800 hover:bg-purple-300'
                                }`}
                        >
                            Long-Term
                        </button>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            📥 Export
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:bg-indigo-700 transition-colors"
                        >
                            Add New Project
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onEdit={(p) => {
                                setEditingProject(p)
                                setShowForm(true)
                            }}
                            onDelete={handleDeleteProject}
                        />
                    ))}
                </div>

                {/* Empty state */}
                {filteredProjects.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">
                            {searchTerm || currentFilter !== 'all'
                                ? 'No projects found matching your criteria'
                                : 'No projects yet. Click "Add New Project" to get started!'}
                        </p>
                    </div>
                )}

                {/* Show form modal when needed */}
                {showForm && (
                    <ProjectForm
                        project={editingProject}
                        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
                        onCancel={() => {
                            setShowForm(false)
                            setEditingProject(undefined)
                        }}
                    />
                )}
            </div>
        </div>
    )
}