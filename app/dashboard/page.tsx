'use client'

import { useEffect, useState } from 'react'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { ProjectService } from '@/lib/services/projects'
import { CompanyService } from '@/lib/services/company'
import { Project, Company } from '@/types/project'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils/currency'
import { PortfolioDonut } from '@/components/charts/PortfolioDonut'
import { BudgetChart } from '@/components/charts/BudgetChart'
import { CurrencySelector } from '@/components/ui/CurrencySelector'
import { useCurrency } from '@/lib/context/CurrencyContext'
import { Copy } from 'lucide-react'
import Link from 'next/link'
import { FileText } from 'lucide-react'

export default function DashboardPage() {
    // Currency hook - MUST be at component level
    const { currency } = useCurrency()

    // State management
    const [projects, setProjects] = useState<Project[]>([])
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | undefined>()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentFilter, setCurrentFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [company, setCompany] = useState<Company | null>(null)

    // Create instances of our services
    const projectService = new ProjectService()
    const companyService = new CompanyService()
    const supabase = createClient()
    const router = useRouter()
    const [userEmail, setUserEmail] = useState<string>('')

    // Load projects and company info when page loads
    useEffect(() => {
        initializeDashboard()
    }, [])

    useEffect(() => {
        filterProjects()
    }, [projects, searchTerm, currentFilter, priorityFilter])

    // Initialize dashboard - check auth, company, and load projects
    const initializeDashboard = async () => {
        try {
            // Check if user is authenticated
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            setUserEmail(user.email || '')

            // Check if user has a company
            const userCompany = await companyService.getUserCompany()
            if (!userCompany) {
                // No company - redirect to company setup
                router.push('/company-setup')
                return
            }

            setCompany(userCompany)

            // Load projects for the company
            await loadProjects()
        } catch (error) {
            console.error('Error initializing dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    // FUNCTION: Load all projects from database
    const loadProjects = async () => {
        try {
            const data = await projectService.getProjects()
            setProjects(data)
        } catch (error) {
            console.error('Error loading projects:', error)
        }
    }

    const filterProjects = () => {
        let filtered = [...projects]

        if (currentFilter !== 'all') {
            filtered = filtered.filter(p => p.scale === currentFilter)
        }

        if (priorityFilter !== 'all') {
            filtered = filtered.filter(p => p.priority === priorityFilter)
        }

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
            setShowForm(false)
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
        const exportData = {
            company: company?.name,
            exportDate: new Date().toISOString(),
            projects: projects
        }
        const dataStr = JSON.stringify(exportData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${company?.name || 'projects'}_${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    // FUNCTION: Handle logout
    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    // FUNCTION: Copy access code to clipboard
    const copyAccessCode = () => {
        if (company?.access_code) {
            navigator.clipboard.writeText(company.access_code)
            alert('Access code copied to clipboard!')
        }
    }

    const stats = {
        total: projects.length,
        inProgress: projects.filter(p => p.status === 'In progress').length,
        shortTerm: projects.filter(p => p.scale === 'Short-term').length,
        longTerm: projects.filter(p => p.scale === 'Long-term').length,
        totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
        totalNPV: projects.reduce((sum, p) => sum + (p.npv || 0), 0),
        highPriority: projects.filter(p => p.priority === 'High').length,
    }

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Loading dashboard...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="bg-white p-8 rounded-2xl w-full max-w-7xl mx-auto">
                {/* Company and User info bar */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <div>
                        <div className="text-lg font-semibold text-gray-800">
                            {company?.name}
                        </div>
                        <div className="text-sm text-gray-600">
                            Logged in as: <span className="font-medium">{userEmail}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Currency Selector - NEW! */}
                        <CurrencySelector />

                        {/* Access Code Display */}
                        <div className="bg-gray-50 px-3 py-2 rounded-lg flex items-center gap-2">
                            <span className="text-xs text-gray-500">Access Code: </span>
                            <span className="font-mono font-bold text-indigo-600">{company?.access_code}</span>
                            <button
                                onClick={copyAccessCode}
                                className="text-indigo-600 hover:text-indigo-700 transition-colors"
                                title="Copy code"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-sm px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Header */}
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
                    Project Scale & Prioritization Dashboard
                </h1>
                <p className="text-center text-gray-500 mb-8">
                    Strategically visualize and manage all internal projects.
                </p>

                {/* Stats Cards - NOW WITH CURRENCY! */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                    <div className="bg-blue-100 p-4 rounded-xl flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">{stats.total}</div>
                        <div className="text-xs font-medium text-blue-800 text-center">Total Projects</div>
                    </div>
                    <div className="bg-green-100 p-4 rounded-xl flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold text-green-600 mb-1">{stats.inProgress}</div>
                        <div className="text-xs font-medium text-green-800 text-center">In Progress</div>
                    </div>
                    <div className="bg-red-100 p-4 rounded-xl flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold text-red-600 mb-1">{stats.highPriority}</div>
                        <div className="text-xs font-medium text-red-800 text-center">High Priority</div>
                    </div>
                    <div className="bg-orange-100 p-4 rounded-xl flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold text-orange-600 mb-1">{stats.shortTerm}</div>
                        <div className="text-xs font-medium text-orange-800 text-center">Short-Term</div>
                    </div>
                    <div className="bg-cyan-100 p-4 rounded-xl flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold text-cyan-600 mb-1">
                            {formatCurrency(stats.totalBudget, currency)}
                        </div>
                        <div className="text-xs font-medium text-cyan-800 text-center">Total Budget</div>
                    </div>
                    <div className={`p-4 rounded-xl flex flex-col items-center justify-center ${stats.totalNPV >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                        <div className={`text-2xl font-bold mb-1 ${stats.totalNPV >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(stats.totalNPV, currency)}
                        </div>
                        <div className={`text-xs font-medium text-center ${stats.totalNPV >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                            Portfolio NPV
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-2">Filter by Scale:</div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button
                            onClick={() => setCurrentFilter('all')}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${currentFilter === 'all'
                                ? 'bg-gray-300 text-gray-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setCurrentFilter('Short-term')}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${currentFilter === 'Short-term'
                                ? 'bg-orange-300 text-orange-800'
                                : 'bg-orange-200 text-orange-800 hover:bg-orange-300'
                                }`}
                        >
                            Short-Term
                        </button>
                        <button
                            onClick={() => setCurrentFilter('Medium-term')}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${currentFilter === 'Medium-term'
                                ? 'bg-blue-300 text-blue-800'
                                : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                                }`}
                        >
                            Medium-Term
                        </button>
                        <button
                            onClick={() => setCurrentFilter('Long-term')}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${currentFilter === 'Long-term'
                                ? 'bg-gray-300 text-gray-800'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                        >
                            Long-Term
                        </button>
                    </div>

                    <div className="text-sm font-medium text-gray-700 mb-2">Filter by Priority:</div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setPriorityFilter('all')}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${priorityFilter === 'all'
                                ? 'bg-gray-300 text-gray-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setPriorityFilter('High')}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${priorityFilter === 'High'
                                ? 'bg-red-300 text-red-800'
                                : 'bg-red-200 text-red-800 hover:bg-red-300'
                                }`}
                        >
                            High Priority
                        </button>
                        <button
                            onClick={() => setPriorityFilter('Medium')}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${priorityFilter === 'Medium'
                                ? 'bg-yellow-300 text-yellow-800'
                                : 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                                }`}
                        >
                            Medium Priority
                        </button>
                        <button
                            onClick={() => setPriorityFilter('Low')}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${priorityFilter === 'Low'
                                ? 'bg-green-300 text-green-800'
                                : 'bg-green-200 text-green-800 hover:bg-green-300'
                                }`}
                        >
                            Low Priority
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

                {/* Action Buttons - UPDATED! */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0">
                    <div></div>

                    <div className="flex space-x-2">
                        {/* NEW: Reports Button */}
                        <Link
                            href="/reports"
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Reports
                        </Link>

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


                {/* Analytics Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Portfolio Analytics</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Project Distribution by Status */}
                        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Project Status Distribution
                            </h3>
                            <PortfolioDonut projects={projects} type="status" />
                        </div>

                        {/* Project Distribution by Priority */}
                        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Priority Distribution
                            </h3>
                            <PortfolioDonut projects={projects} type="priority" />
                        </div>

                        {/* Budget vs Actual Comparison */}
                        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 lg:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Budget vs Actual Costs
                            </h3>
                            <BudgetChart projects={projects} />
                        </div>
                    </div>
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
                        {projects.length === 0 && company && (
                            <div className="mt-6 p-4 bg-indigo-50 rounded-lg max-w-md mx-auto">
                                <p className="text-sm text-indigo-800 mb-2">
                                    👥 Invite your team to collaborate!
                                </p>
                                <p className="text-xs text-indigo-600">
                                    Share this access code: <span className="font-mono font-bold">{company.access_code}</span>
                                </p>
                            </div>
                        )}
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