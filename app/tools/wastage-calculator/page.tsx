'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, TrendingDown, Save, History, Trash2, AlertTriangle, CheckCircle, Package, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectSelector } from '@/components/ui/ProjectSelector'
import { saveWastageAssessment, getUserWastageAssessments, deleteWastageAssessment, linkWastageToProject } from '@/lib/services/wastage-client'
import {
    calculateWastageMetrics,
    getWastageStatus,
    RESOURCE_TYPES,
    type ResourceType,
    type WastageAssessment
} from '@/types/wastage'
import { useCurrency } from '@/lib/context/CurrencyContext'
import { formatCurrency } from '@/lib/utils/currency'

export default function WastageCalculatorPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { currency } = useCurrency()

    // Form state
    const [resourceType, setResourceType] = useState<ResourceType>('budget')
    const [allocated, setAllocated] = useState<number>(100000)
    const [used, setUsed] = useState<number>(75000)
    const [unit, setUnit] = useState<string>('USD')
    const [costPerUnit, setCostPerUnit] = useState<number | undefined>(undefined)
    const [assessmentName, setAssessmentName] = useState<string>('')
    const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined)

    // Results state
    const [wastageAmount, setWastageAmount] = useState<number>(0)
    const [wastagePercentage, setWastagePercentage] = useState<number>(0)
    const [efficiencyScore, setEfficiencyScore] = useState<number>(0)
    const [wastageCost, setWastageCost] = useState<number>(0)
    const [statusColor, setStatusColor] = useState<string>('#10b981')
    const [statusLabel, setStatusLabel] = useState<string>('Excellent')
    const [recommendations, setRecommendations] = useState<string[]>([])

    // UI state
    const [isSaving, setIsSaving] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [savedAssessments, setSavedAssessments] = useState<WastageAssessment[]>([])

    // Check for project ID in URL on mount
    useEffect(() => {
        const projectId = searchParams.get('project')
        if (projectId) {
            setSelectedProjectId(projectId)
        }
    }, [searchParams])

    // Load saved assessments
    useEffect(() => {
        async function loadAssessments() {
            const assessments = await getUserWastageAssessments()
            setSavedAssessments(assessments)
        }
        loadAssessments()
    }, [])

    // Update unit when resource type changes
    useEffect(() => {
        const defaultUnit = RESOURCE_TYPES[resourceType].defaultUnit
        if (resourceType === 'budget') {
            setUnit(currency)
        } else {
            setUnit(defaultUnit)
        }
    }, [resourceType, currency])

    // Calculate wastage whenever inputs change
    useEffect(() => {
        const metrics = calculateWastageMetrics(allocated, used, costPerUnit)
        const status = getWastageStatus(metrics.wastage_percentage)

        setWastageAmount(metrics.wastage_amount)
        setWastagePercentage(metrics.wastage_percentage)
        setEfficiencyScore(metrics.efficiency_score)
        setWastageCost(metrics.wastage_cost)
        setStatusColor(status.color)
        setStatusLabel(status.label)
        setRecommendations(metrics.recommendations)
    }, [allocated, used, costPerUnit])

    // Save assessment
    const handleSaveAssessment = async () => {
        setIsSaving(true)

        const loadingToast = toast.loading('Saving wastage assessment...')

        const saved = await saveWastageAssessment({
            resource_type: resourceType,
            allocated,
            used,
            unit,
            cost_per_unit: costPerUnit,
            assessment_name: assessmentName || `${RESOURCE_TYPES[resourceType].label} Assessment - ${new Date().toLocaleDateString()}`,
            project_id: selectedProjectId
        })

        if (saved) {
            // Link to project if selected
            if (selectedProjectId) {
                const linked = await linkWastageToProject(saved.id, selectedProjectId)
                if (linked) {
                    toast.success('Wastage assessment linked to project!', {
                        id: loadingToast,
                        description: 'Assessment saved and project health score updated',
                        duration: 4000
                    })
                } else {
                    toast.warning('Assessment saved but linking failed', {
                        id: loadingToast,
                        description: 'You can manually link it later',
                        duration: 4000
                    })
                }
            } else {
                toast.success('Assessment saved successfully!', {
                    id: loadingToast,
                    description: 'You can view it in the History sidebar',
                    duration: 4000
                })
            }

            const assessments = await getUserWastageAssessments()
            setSavedAssessments(assessments)
            setAssessmentName('')
        } else {
            toast.error('Failed to save assessment', {
                id: loadingToast,
                description: 'Please check your connection and try again',
                duration: 5000
            })
        }

        setIsSaving(false)
    }

    // Load assessment
    const handleLoadAssessment = (assessment: WastageAssessment) => {
        setResourceType(assessment.resource_type)
        setAllocated(assessment.allocated)
        setUsed(assessment.used)
        setUnit(assessment.unit || 'units')
        setCostPerUnit(assessment.cost_per_unit || undefined)
        setSelectedProjectId(assessment.project_id || undefined)
        setShowHistory(false)

        toast.success('Assessment loaded', {
            description: `Loaded "${assessment.assessment_name || 'Unnamed Assessment'}"`,
            duration: 3000
        })
    }

    // Delete assessment
    const handleDeleteAssessment = async (id: string, name?: string) => {
        toast.error(`Delete "${name || 'this assessment'}"?`, {
            description: 'This action cannot be undone',
            duration: 6000,
            action: {
                label: 'Delete',
                onClick: async () => {
                    const deleted = await deleteWastageAssessment(id)
                    if (deleted) {
                        const assessments = await getUserWastageAssessments()
                        setSavedAssessments(assessments)

                        toast.success('Assessment deleted', {
                            description: 'Removed from your history',
                            duration: 3000
                        })
                    } else {
                        toast.error('Failed to delete', {
                            description: 'Please try again',
                            duration: 4000
                        })
                    }
                }
            },
            cancel: {
                label: 'Cancel',
                onClick: () => toast.dismiss()
            }
        })
    }

    // Reset to defaults
    const handleReset = () => {
        setResourceType('budget')
        setAllocated(100000)
        setUsed(75000)
        setUnit(currency)
        setCostPerUnit(undefined)
        setAssessmentName('')
        setSelectedProjectId(undefined)

        toast.info('Reset to defaults', {
            description: 'All values have been restored',
            duration: 2000
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard')}
                    className="mb-4 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>

                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <TrendingDown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Wastage Calculator
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Resource efficiency and wastage analysis tool
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2"
                    >
                        <History className="h-4 w-4" />
                        History ({savedAssessments.length})
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Input Parameters */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resource Details</CardTitle>
                            <CardDescription>Configure your resource allocation</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Resource Type */}
                            <div>
                                <Label htmlFor="resource-type">Resource Type</Label>
                                <select
                                    id="resource-type"
                                    value={resourceType}
                                    onChange={(e) => setResourceType(e.target.value as ResourceType)}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    {Object.entries(RESOURCE_TYPES).map(([key, value]) => (
                                        <option key={key} value={key}>
                                            {value.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Allocated */}
                            <div>
                                <Label htmlFor="allocated">Allocated Amount</Label>
                                <Input
                                    id="allocated"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={allocated}
                                    onChange={(e) => setAllocated(Number(e.target.value))}
                                    className="mt-1"
                                />
                            </div>

                            {/* Used */}
                            <div>
                                <Label htmlFor="used">Used Amount</Label>
                                <Input
                                    id="used"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={used}
                                    onChange={(e) => setUsed(Number(e.target.value))}
                                    className="mt-1"
                                />
                            </div>

                            {/* Unit */}
                            <div>
                                <Label htmlFor="unit">Unit of Measurement</Label>
                                <Input
                                    id="unit"
                                    type="text"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="mt-1"
                                    placeholder="e.g., USD, hours, kg"
                                />
                            </div>

                            {/* Cost Per Unit (Optional) */}
                            {resourceType !== 'budget' && (
                                <div>
                                    <Label htmlFor="cost-per-unit">Cost Per Unit ({currency}) - Optional</Label>
                                    <Input
                                        id="cost-per-unit"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={costPerUnit || ''}
                                        onChange={(e) => setCostPerUnit(e.target.value ? Number(e.target.value) : undefined)}
                                        className="mt-1"
                                        placeholder="Enter cost to calculate financial impact"
                                    />
                                </div>
                            )}

                            {/* Reset Button */}
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="w-full"
                            >
                                Reset to Defaults
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Save Assessment Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Save This Assessment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Project Selector */}
                            <ProjectSelector
                                selectedProjectId={selectedProjectId}
                                onProjectSelect={setSelectedProjectId}
                                label="Link to Project (Optional)"
                            />

                            <div>
                                <Label htmlFor="assessment-name">Assessment Name (Optional)</Label>
                                <Input
                                    id="assessment-name"
                                    placeholder="e.g., Q4 Marketing Budget"
                                    value={assessmentName}
                                    onChange={(e) => setAssessmentName(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <Button
                                onClick={handleSaveAssessment}
                                disabled={isSaving}
                                className="w-full"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? 'Saving...' : selectedProjectId ? 'Save & Link to Project' : 'Save Assessment'}
                            </Button>
                            {selectedProjectId && (
                                <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                    <LinkIcon className="h-3 w-3" />
                                    Will update project health score
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Results & Visualization */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Wastage Results Card */}
                    <Card style={{ borderColor: statusColor, borderWidth: '2px' }}>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Wastage Percentage */}
                                <div className="text-center">
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                        Wastage Percentage
                                    </div>
                                    <div className="text-5xl font-bold mb-2" style={{ color: statusColor }}>
                                        {wastagePercentage.toFixed(1)}%
                                    </div>
                                    <div
                                        className="inline-block px-4 py-2 rounded-lg font-semibold"
                                        style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                                    >
                                        {statusLabel}
                                    </div>
                                </div>

                                {/* Efficiency Score */}
                                <div className="text-center">
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                        Efficiency Score
                                    </div>
                                    <div className="text-5xl font-bold mb-2 text-blue-600 dark:text-blue-400">
                                        {efficiencyScore.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Resource Utilization
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-6">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    <span>Allocated vs Used</span>
                                    <span>{used.toLocaleString()} / {allocated.toLocaleString()} {unit}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                    <div
                                        className="h-4 rounded-full transition-all"
                                        style={{
                                            width: `${Math.min(efficiencyScore, 100)}%`,
                                            backgroundColor: statusColor
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Breakdown Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Wastage Breakdown</CardTitle>
                            <CardDescription>Detailed resource analysis</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Wastage Amount */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">Wasted Resources</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Allocated but not used
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                                            {wastageAmount.toLocaleString()} {unit}
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Impact (if cost provided) */}
                                {wastageCost > 0 && (
                                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            <div>
                                                <div className="font-medium text-red-900 dark:text-red-100">Financial Impact</div>
                                                <div className="text-sm text-red-700 dark:text-red-300">
                                                    Cost of wasted resources
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-red-600 dark:text-red-400">
                                                {formatCurrency(wastageCost, currency)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Efficiency Score */}
                                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <div className="font-medium text-blue-900 dark:text-blue-100">Resources Used</div>
                                            <div className="text-sm text-blue-700 dark:text-blue-300">
                                                Actual utilization
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                            {used.toLocaleString()} {unit}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommendations Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recommendations</CardTitle>
                            <CardDescription>Actionable insights to improve efficiency</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recommendations.map((rec, index) => {
                                    // Determine icon based on recommendation type
                                    let icon = null
                                    let iconColor = 'text-gray-500'

                                    if (rec.includes('CRITICAL')) {
                                        icon = <AlertTriangle className="h-4 w-4" />
                                        iconColor = 'text-red-500'
                                    } else if (rec.includes('WARNING')) {
                                        icon = <AlertTriangle className="h-4 w-4" />
                                        iconColor = 'text-orange-500'
                                    } else if (rec.includes('MODERATE')) {
                                        icon = <TrendingDown className="h-4 w-4" />
                                        iconColor = 'text-yellow-500'
                                    } else if (rec.includes('GOOD')) {
                                        icon = <CheckCircle className="h-4 w-4" />
                                        iconColor = 'text-blue-500'
                                    } else if (rec.includes('EXCELLENT')) {
                                        icon = <CheckCircle className="h-4 w-4" />
                                        iconColor = 'text-green-500'
                                    } else {
                                        icon = <span className="w-4 h-4 flex items-center justify-center text-purple-500">•</span>
                                    }

                                    return (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
                                                {icon}
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {rec}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Educational Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Understanding Wastage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-purple-600 dark:text-purple-400">•</span>
                                <p>
                                    <strong className="text-gray-900 dark:text-white">Wastage:</strong> Resources allocated but not used
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-green-600 dark:text-green-400">•</span>
                                <p>
                                    <strong className="text-gray-900 dark:text-white">Efficiency:</strong> Percentage of allocated resources actually utilized
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-orange-600 dark:text-orange-400">•</span>
                                <p>
                                    <strong className="text-gray-900 dark:text-white">Target:</strong> Keep wastage below 20% for healthy operations
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
                                <p>
                                    <strong className="text-gray-900 dark:text-white">Best Practice:</strong> Regular monitoring helps identify trends early
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* History Sidebar */}
            {showHistory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 h-full overflow-y-auto shadow-2xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Saved Assessments
                                </h2>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowHistory(false)}
                                >
                                    ✕
                                </Button>
                            </div>

                            {savedAssessments.length === 0 ? (
                                <div className="text-center py-12">
                                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No saved assessments yet
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {savedAssessments.map((assessment) => {
                                        const status = getWastageStatus(assessment.wastage_percentage)
                                        return (
                                            <Card key={assessment.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1" onClick={() => handleLoadAssessment(assessment)}>
                                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                                {assessment.assessment_name || 'Unnamed Assessment'}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                {RESOURCE_TYPES[assessment.resource_type].label} • {' '}
                                                                {new Date(assessment.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteAssessment(assessment.id, assessment.assessment_name || undefined)
                                                            }}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-sm" onClick={() => handleLoadAssessment(assessment)}>
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Wastage:</p>
                                                            <p className="font-semibold" style={{ color: status.color }}>
                                                                {assessment.wastage_percentage.toFixed(1)}%
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Status:</p>
                                                            <p className="font-semibold" style={{ color: status.color }}>
                                                                {status.label}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Efficiency:</p>
                                                            <p className="font-semibold text-blue-600 dark:text-blue-400">
                                                                {assessment.efficiency_score.toFixed(1)}%
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Type:</p>
                                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                                {RESOURCE_TYPES[assessment.resource_type].label}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}