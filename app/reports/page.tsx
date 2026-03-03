'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectService } from '@/lib/services/projects'
import { CompanyService } from '@/lib/services/company'
import { createClient } from '@/lib/supabase/client'
import { Project, Company } from '@/types/project'
import { DateRange, TimePeriod, filterProjectsByDateRange, calculatePeriodStats, getDateRangeForPeriod } from '@/lib/utils/dateFilters'
import { DateRangePicker } from '@/components/reports/DateRangePicker'
import { ReportStats } from '@/components/reports/ReportStats'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import Link from 'next/link'
import { generatePDFReport } from '@/lib/utils/pdfExport'
import { useCurrency } from '@/lib/context/CurrencyContext'

export default function ReportsPage() {
    const { currency } = useCurrency()

    const [allProjects, setAllProjects] = useState<Project[]>([])
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [company, setCompany] = useState<Company | null>(null)
    const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>('this_month')
    const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeForPeriod('this_month'))

    const projectService = new ProjectService()
    const companyService = new CompanyService()
    const supabase = createClient()
    const router = useRouter()

    // Initialize - check auth and load data
    useEffect(() => {
        initializeReports()
    }, [])

    // Filter projects when date range changes
    useEffect(() => {
        if (allProjects.length > 0) {
            const filtered = filterProjectsByDateRange(allProjects, dateRange)
            setFilteredProjects(filtered)
        }
    }, [dateRange, allProjects])

    const initializeReports = async () => {
        try {
            // Check authentication
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            // Check company
            const userCompany = await companyService.getUserCompany()
            if (!userCompany) {
                router.push('/company-setup')
                return
            }
            setCompany(userCompany)

            // Load all projects
            const projects = await projectService.getProjects()
            setAllProjects(projects)

            // Apply initial filter
            const filtered = filterProjectsByDateRange(projects, dateRange)
            setFilteredProjects(filtered)
        } catch (error) {
            console.error('Error initializing reports:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDateRangeChange = (range: DateRange) => {
        setDateRange(range)
    }

    const handlePeriodChange = (period: TimePeriod) => {
        setCurrentPeriod(period)
    }

    const handleExportPDF = () => {
        const stats = calculatePeriodStats(filteredProjects)
        const periodLabel = currentPeriod === 'custom'
            ? 'Custom Range'
            : currentPeriod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

        generatePDFReport({
            companyName: company?.name || 'Company',
            dateRange,
            period: periodLabel,
            stats,
            projects: filteredProjects,
            currency
        })
    }

    const handleExportJSON = () => {
        const stats = calculatePeriodStats(filteredProjects)
        const exportData = {
            company: company?.name,
            period: currentPeriod,
            dateRange: {
                from: dateRange.from.toISOString(),
                to: dateRange.to.toISOString()
            },
            statistics: stats,
            projects: filteredProjects,
            exportedAt: new Date().toISOString()
        }

        const dataStr = JSON.stringify(exportData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${company?.name || 'report'}_${currentPeriod}_${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    // Calculate stats for filtered projects
    const stats = calculatePeriodStats(filteredProjects)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Loading reports...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Dashboard
                            </Link>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                Export PDF
                            </button>

                            <button
                                onClick={handleExportJSON}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export JSON
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-8 h-8 text-indigo-600" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
                                <p className="text-gray-600">{company?.name}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Date Range Picker */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Time Period</h2>
                    <DateRangePicker
                        onDateRangeChange={handleDateRangeChange}
                        onPeriodChange={handlePeriodChange}
                    />
                </div>

                {/* Statistics */}
                <div className="mb-6">
                    <ReportStats stats={stats} />
                </div>

                {/* Filtered Projects */}
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Projects in Selected Period ({filteredProjects.length})
                    </h2>

                    {filteredProjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProjects.map(project => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onEdit={() => router.push('/dashboard')}
                                    onDelete={() => { }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-400">
                                No projects found in the selected time period.
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Try selecting a different date range or create new projects.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}