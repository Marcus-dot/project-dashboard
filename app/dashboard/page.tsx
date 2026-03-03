'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { PortfolioDonut } from '@/components/charts/PortfolioDonut'
import { BudgetChart } from '@/components/charts/BudgetChart'
import { CurrencySelector } from '@/components/ui/CurrencySelector'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import { ProjectService } from '@/lib/services/projects'
import { CompanyService } from '@/lib/services/company'
import { createClient } from '@/lib/supabase/client'
import { useCurrency } from '@/lib/context/CurrencyContext'
import { formatCurrency } from '@/lib/utils/currency'

import { Project, Company, getHealthStatus, HEALTH_THRESHOLDS } from '@/types/project'

import {
    Copy,
    FileText,
    Calculator,
    AlertTriangle,
    Plus,
    Download,
    Search,
    TrendingUp,
    TrendingDown,
    Activity,
    Layers,
    BarChart3,
    LogOut,
    Building2,
    User,
    Heart,
    Shield,
    CheckCircle2,
    XCircle
} from 'lucide-react'


export default function DashboardPage() {
    // Currency hook
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
    const [showToolsDropdown, setShowToolsDropdown] = useState(false)

    // Services
    const projectService = new ProjectService()
    const companyService = new CompanyService()
    const supabase = createClient()
    const router = useRouter()
    const [userEmail, setUserEmail] = useState<string>('')

    // Load projects and company info
    useEffect(() => {
        initializeDashboard()
    }, [])

    useEffect(() => {
        filterProjects()
    }, [projects, searchTerm, currentFilter, priorityFilter])

    const initializeDashboard = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            setUserEmail(user.email || '')

            const userCompany = await companyService.getUserCompany()
            if (!userCompany) {
                router.push('/company-setup')
                return
            }

            setCompany(userCompany)
            await loadProjects()
        } catch (error) {
            console.error('Error initializing dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

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

    const handleDeleteProject = async (id: string) => {
        try {
            await projectService.deleteProject(id)
            setProjects(projects.filter(p => p.id !== id))
        } catch (error) {
            console.error('Error deleting project:', error)
            alert('Failed to delete project. Please try again.')
        }
    }

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

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const copyAccessCode = () => {
        if (company?.access_code) {
            navigator.clipboard.writeText(company.access_code)
            alert('Access code copied to clipboard!')
        }
    }

    // Calculate portfolio health metrics
    const portfolioHealth = () => {
        const projectsWithHealth = projects.filter(p => p.health_score !== null && p.health_score !== undefined)

        if (projectsWithHealth.length === 0) {
            return {
                avgScore: 0,
                avgStatus: getHealthStatus(0),
                excellent: 0,
                good: 0,
                fair: 0,
                poor: 0,
                critical: 0,
                projectsWithCalculators: 0,
                needsAttention: []
            }
        }

        const avgScore = projectsWithHealth.reduce((sum, p) => sum + (p.health_score || 0), 0) / projectsWithHealth.length
        const avgStatus = getHealthStatus(avgScore)

        // Count by health status
        const healthCounts = {
            excellent: projectsWithHealth.filter(p => (p.health_score || 0) >= HEALTH_THRESHOLDS.excellent.min).length,
            good: projectsWithHealth.filter(p => (p.health_score || 0) >= HEALTH_THRESHOLDS.good.min && (p.health_score || 0) < HEALTH_THRESHOLDS.excellent.min).length,
            fair: projectsWithHealth.filter(p => (p.health_score || 0) >= HEALTH_THRESHOLDS.fair.min && (p.health_score || 0) < HEALTH_THRESHOLDS.good.min).length,
            poor: projectsWithHealth.filter(p => (p.health_score || 0) >= HEALTH_THRESHOLDS.poor.min && (p.health_score || 0) < HEALTH_THRESHOLDS.fair.min).length,
            critical: projectsWithHealth.filter(p => (p.health_score || 0) < HEALTH_THRESHOLDS.poor.min).length
        }

        // Projects needing attention (poor or critical)
        const needsAttention = projects.filter(p =>
            p.health_score !== null &&
            p.health_score !== undefined &&
            p.health_score < HEALTH_THRESHOLDS.fair.min
        )

        return {
            avgScore,
            avgStatus,
            ...healthCounts,
            projectsWithCalculators: projectsWithHealth.length,
            needsAttention
        }
    }

    const health = portfolioHealth()

    const stats = {
        total: projects.length,
        inProgress: projects.filter(p => p.status === 'In progress').length,
        shortTerm: projects.filter(p => p.scale === 'Short-term').length,
        longTerm: projects.filter(p => p.scale === 'Long-term').length,
        totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
        totalNPV: projects.reduce((sum, p) => sum + (p.npv || 0), 0),
        highPriority: projects.filter(p => p.priority === 'High').length,
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-gray-500 dark:text-gray-400">Loading dashboard...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header Bar */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        {/* Company Info */}
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                                <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {company?.name}
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <User className="h-3 w-3" />
                                    {userEmail}
                                </div>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Currency Selector */}
                            <CurrencySelector />

                            {/* Access Code */}
                            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Code:</span>
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                    {company?.access_code}
                                </span>
                                <button
                                    onClick={copyAccessCode}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Logout */}
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Project Portfolio Dashboard
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Monitor, analyze, and manage your project portfolio
                    </p>
                </div>

                {/* Portfolio Health Widget - NEW */}
                {health.projectsWithCalculators > 0 && (
                    <Card className="mb-8 border-2" style={{ borderColor: health.avgStatus.color }}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: health.avgStatus.bgColor }}>
                                        <Heart className="h-6 w-6" style={{ color: health.avgStatus.color }} />
                                    </div>
                                    <div>
                                        <CardTitle>Portfolio Health Score</CardTitle>
                                        <CardDescription>
                                            Based on {health.projectsWithCalculators} of {projects.length} projects with analytics
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-bold" style={{ color: health.avgStatus.color }}>
                                        {Math.round(health.avgScore)}
                                    </div>
                                    <div className="text-sm font-semibold" style={{ color: health.avgStatus.color }}>
                                        {health.avgStatus.label}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 gap-4 mb-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold" style={{ color: HEALTH_THRESHOLDS.excellent.color }}>
                                        {health.excellent}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">Excellent</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold" style={{ color: HEALTH_THRESHOLDS.good.color }}>
                                        {health.good}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">Good</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold" style={{ color: HEALTH_THRESHOLDS.fair.color }}>
                                        {health.fair}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">Fair</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold" style={{ color: HEALTH_THRESHOLDS.poor.color }}>
                                        {health.poor}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">Poor</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold" style={{ color: HEALTH_THRESHOLDS.critical.color }}>
                                        {health.critical}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">Critical</div>
                                </div>
                            </div>

                            {/* Projects Needing Attention */}
                            {health.needsAttention.length > 0 && (
                                <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                        <span className="font-semibold text-orange-900 dark:text-orange-100">
                                            {health.needsAttention.length} Project{health.needsAttention.length > 1 ? 's' : ''} Need Attention
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {health.needsAttention.map(project => {
                                            const projectHealth = getHealthStatus(project.health_score)
                                            return (
                                                <div key={project.id} className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                                    <XCircle className="h-3 w-3" style={{ color: projectHealth.color }} />
                                                    <span className="font-medium">{project.name}</span>
                                                    <span className="text-xs">
                                                        (Score: {Math.round(project.health_score || 0)} - {projectHealth.label})
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* All Good Message */}
                            {health.needsAttention.length === 0 && health.projectsWithCalculators > 0 && (
                                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-900 dark:text-green-100">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <span className="font-semibold">All projects are performing well!</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Total Projects
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                        {stats.total}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        In Progress
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                        {stats.inProgress}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Total Budget
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                        {formatCurrency(stats.totalBudget, currency)}
                                    </p>
                                </div>
                                <div className="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                                    <BarChart3 className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={stats.totalNPV >= 0 ? 'border-emerald-200 dark:border-emerald-800' : 'border-rose-200 dark:border-rose-800'}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Portfolio NPV
                                    </p>
                                    <p className={`text-2xl font-bold mt-2 ${stats.totalNPV >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {formatCurrency(stats.totalNPV, currency)}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${stats.totalNPV >= 0 ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-rose-100 dark:bg-rose-900'}`}>
                                    {stats.totalNPV >= 0 ? (
                                        <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <TrendingDown className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Tools Dropdown */}
                        <div className="relative">
                            <Button
                                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Calculator className="h-4 w-4" />
                                Tools
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </Button>

                            {showToolsDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowToolsDropdown(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                                        <div className="py-2">
                                            <Link
                                                href="/tools/npv-calculator"
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                onClick={() => setShowToolsDropdown(false)}
                                            >
                                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                                    <Calculator className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                        NPV Calculator
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Financial viability analysis
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/tools/risk-calculator"
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                onClick={() => setShowToolsDropdown(false)}
                                            >
                                                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                                    <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                        Risk Calculator
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Risk assessment tool
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link
                                                href="/tools/wastage-calculator"
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                onClick={() => setShowToolsDropdown(false)}
                                            >
                                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                                    <TrendingDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                        Wastage Calculator
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Resource efficiency analysis
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <Link href="/reports">
                            <Button variant="outline" className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">Reports</span>
                            </Button>
                        </Link>

                        <Button
                            variant="outline"
                            onClick={handleExport}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>

                        <Button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Project
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {/* Scale Filter */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Filter by Scale
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <Badge
                                        variant={currentFilter === 'all' ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                        onClick={() => setCurrentFilter('all')}
                                    >
                                        All
                                    </Badge>
                                    <Badge
                                        variant={currentFilter === 'Short-term' ? 'default' : 'outline'}
                                        className="cursor-pointer bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200"
                                        onClick={() => setCurrentFilter('Short-term')}
                                    >
                                        Short-Term
                                    </Badge>
                                    <Badge
                                        variant={currentFilter === 'Medium-term' ? 'default' : 'outline'}
                                        className="cursor-pointer bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                                        onClick={() => setCurrentFilter('Medium-term')}
                                    >
                                        Medium-Term
                                    </Badge>
                                    <Badge
                                        variant={currentFilter === 'Long-term' ? 'default' : 'outline'}
                                        className="cursor-pointer bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                                        onClick={() => setCurrentFilter('Long-term')}
                                    >
                                        Long-Term
                                    </Badge>
                                </div>
                            </div>

                            {/* Priority Filter */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Filter by Priority
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <Badge
                                        variant={priorityFilter === 'all' ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                        onClick={() => setPriorityFilter('all')}
                                    >
                                        All
                                    </Badge>
                                    <Badge
                                        variant={priorityFilter === 'High' ? 'default' : 'outline'}
                                        className="cursor-pointer bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                                        onClick={() => setPriorityFilter('High')}
                                    >
                                        High Priority
                                    </Badge>
                                    <Badge
                                        variant={priorityFilter === 'Medium' ? 'default' : 'outline'}
                                        className="cursor-pointer bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200"
                                        onClick={() => setPriorityFilter('Medium')}
                                    >
                                        Medium Priority
                                    </Badge>
                                    <Badge
                                        variant={priorityFilter === 'Low' ? 'default' : 'outline'}
                                        className="cursor-pointer bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
                                        onClick={() => setPriorityFilter('Low')}
                                    >
                                        Low Priority
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Status Distribution</CardTitle>
                            <CardDescription>Overview of project statuses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PortfolioDonut projects={projects} type="status" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Priority Distribution</CardTitle>
                            <CardDescription>Projects by priority level</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PortfolioDonut projects={projects} type="priority" />
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Budget vs Actual Costs</CardTitle>
                            <CardDescription>Financial performance tracking</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BudgetChart projects={projects} />
                        </CardContent>
                    </Card>
                </div>

                {/* Projects Section */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Projects ({filteredProjects.length})
                    </h3>

                    {filteredProjects.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {searchTerm || currentFilter !== 'all' || priorityFilter !== 'all'
                                        ? 'No projects match your filters'
                                        : 'No projects yet'}
                                </p>
                                {projects.length === 0 && (
                                    <Button onClick={() => setShowForm(true)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Your First Project
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
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
                    )}
                </div>
            </div>

            {/* Project Form Modal */}
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
    )
}