'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Save, History, Trash2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectSelector } from '@/components/ui/ProjectSelector';
import { calculateRiskScore } from '@/lib/utils/calculations';
import { saveRiskAssessment, getUserRiskAssessments, deleteRiskAssessment, linkRiskToProject } from '@/lib/services/risk-client';
import { getRiskLevelFromScore, getRiskRecommendations, RISK_FACTORS, RISK_WEIGHTS } from '@/types/risk';
import type { RiskAssessment } from '@/types/risk';

// ✅ EXTRACTED: Component that uses useSearchParams
function RiskCalculatorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Risk factors state (0-100 scale)
    const [budgetVariance, setBudgetVariance] = useState<number>(30);
    const [scheduleDelay, setScheduleDelay] = useState<number>(25);
    const [resourceAvailability, setResourceAvailability] = useState<number>(20);
    const [complexity, setComplexity] = useState<number>(40);
    const [stakeholderAlignment, setStakeholderAlignment] = useState<number>(15);
    const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

    // Results state
    const [riskScore, setRiskScore] = useState<number>(0);
    const [riskLevel, setRiskLevel] = useState<string>('Low Risk');
    const [riskColor, setRiskColor] = useState<string>('#10b981');
    const [recommendations, setRecommendations] = useState<string[]>([]);

    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [savedAssessments, setSavedAssessments] = useState<RiskAssessment[]>([]);
    const [assessmentName, setAssessmentName] = useState<string>('');

    // Check for project ID in URL on mount
    useEffect(() => {
        const projectId = searchParams.get('project');
        if (projectId) {
            setSelectedProjectId(projectId);
        }
    }, [searchParams]);

    // Load saved assessments
    useEffect(() => {
        async function loadAssessments() {
            const assessments = await getUserRiskAssessments();
            setSavedAssessments(assessments);
        }
        loadAssessments();
    }, []);

    // Calculate risk score whenever factors change
    useEffect(() => {
        const factors = {
            budgetVariance,
            scheduleDelay,
            resourceAvailability,
            complexity,
            stakeholderAlignment
        };

        const score = calculateRiskScore(factors);
        const { level, color } = getRiskLevelFromScore(score);
        const recs = getRiskRecommendations(score, {
            budget_variance: budgetVariance,
            schedule_delay: scheduleDelay,
            resource_availability: resourceAvailability,
            complexity: complexity,
            stakeholder_alignment: stakeholderAlignment
        });

        setRiskScore(score);
        setRiskLevel(level);
        setRiskColor(color);
        setRecommendations(recs);
    }, [budgetVariance, scheduleDelay, resourceAvailability, complexity, stakeholderAlignment]);

    // Save assessment
    const handleSaveAssessment = async () => {
        setIsSaving(true);

        const loadingToast = toast.loading('Saving risk assessment...');

        const saved = await saveRiskAssessment({
            budget_variance: budgetVariance,
            schedule_delay: scheduleDelay,
            resource_availability: resourceAvailability,
            complexity: complexity,
            stakeholder_alignment: stakeholderAlignment,
            assessment_name: assessmentName || `Risk Assessment - ${new Date().toLocaleDateString()}`,
            project_id: selectedProjectId
        });

        if (saved) {
            if (selectedProjectId) {
                const linked = await linkRiskToProject(saved.id, selectedProjectId);
                if (linked) {
                    toast.success('Risk assessment linked to project!', {
                        id: loadingToast,
                        description: 'Assessment saved and project health score updated',
                        duration: 4000
                    });
                } else {
                    toast.warning('Assessment saved but linking failed', {
                        id: loadingToast,
                        description: 'You can manually link it later',
                        duration: 4000
                    });
                }
            } else {
                toast.success('Assessment saved successfully!', {
                    id: loadingToast,
                    description: 'You can view it in the History sidebar',
                    duration: 4000
                });
            }

            const assessments = await getUserRiskAssessments();
            setSavedAssessments(assessments);
            setAssessmentName('');
        } else {
            toast.error('Failed to save assessment', {
                id: loadingToast,
                description: 'Please check your connection and try again',
                duration: 5000
            });
        }

        setIsSaving(false);
    };

    // Load assessment
    const handleLoadAssessment = (assessment: RiskAssessment) => {
        setBudgetVariance(assessment.budget_variance ?? 30);
        setScheduleDelay(assessment.schedule_delay ?? 25);
        setResourceAvailability(assessment.resource_availability ?? 20);
        setComplexity(assessment.complexity ?? 40);
        setStakeholderAlignment(assessment.stakeholder_alignment ?? 15);
        setSelectedProjectId(assessment.project_id || undefined);
        setShowHistory(false);

        toast.success('Assessment loaded', {
            description: `Loaded "${assessment.assessment_name || 'Unnamed Assessment'}"`,
            duration: 3000
        });
    };

    // Delete assessment
    const handleDeleteAssessment = async (id: string, name?: string) => {
        toast.error(`Delete "${name || 'this assessment'}"?`, {
            description: 'This action cannot be undone',
            duration: 6000,
            action: {
                label: 'Delete',
                onClick: async () => {
                    const deleted = await deleteRiskAssessment(id);
                    if (deleted) {
                        const assessments = await getUserRiskAssessments();
                        setSavedAssessments(assessments);

                        toast.success('Assessment deleted', {
                            description: 'Removed from your history',
                            duration: 3000
                        });
                    } else {
                        toast.error('Failed to delete', {
                            description: 'Please try again',
                            duration: 4000
                        });
                    }
                }
            },
            cancel: {
                label: 'Cancel',
                onClick: () => toast.dismiss()
            }
        });
    };

    // Reset to defaults
    const handleReset = () => {
        setBudgetVariance(30);
        setScheduleDelay(25);
        setResourceAvailability(20);
        setComplexity(40);
        setStakeholderAlignment(15);
        setAssessmentName('');
        setSelectedProjectId(undefined);

        toast.info('Reset to defaults', {
            description: 'All values have been restored',
            duration: 2000
        });
    };

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
                        <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Risk Score Calculator
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Assess project risk through weighted factor analysis
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
                {/* Left Column: Risk Factors */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Risk Factors</CardTitle>
                            <CardDescription>Rate each factor from 0 (no risk) to 100 (critical risk)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Budget Variance */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label htmlFor="budget-variance" className="text-sm font-medium">
                                        {RISK_FACTORS.budgetVariance.label}
                                    </Label>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                        {budgetVariance}
                                    </span>
                                </div>
                                <Input
                                    id="budget-variance"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={budgetVariance}
                                    onChange={(e) => setBudgetVariance(Number(e.target.value))}
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {RISK_FACTORS.budgetVariance.description} • Weight: {RISK_WEIGHTS.budgetVariance * 100}%
                                </p>
                            </div>

                            {/* Schedule Delay */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label htmlFor="schedule-delay" className="text-sm font-medium">
                                        {RISK_FACTORS.scheduleDelay.label}
                                    </Label>
                                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                        {scheduleDelay}
                                    </span>
                                </div>
                                <Input
                                    id="schedule-delay"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={scheduleDelay}
                                    onChange={(e) => setScheduleDelay(Number(e.target.value))}
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {RISK_FACTORS.scheduleDelay.description} • Weight: {RISK_WEIGHTS.scheduleDelay * 100}%
                                </p>
                            </div>

                            {/* Resource Availability */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label htmlFor="resource-availability" className="text-sm font-medium">
                                        {RISK_FACTORS.resourceAvailability.label}
                                    </Label>
                                    <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                                        {resourceAvailability}
                                    </span>
                                </div>
                                <Input
                                    id="resource-availability"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={resourceAvailability}
                                    onChange={(e) => setResourceAvailability(Number(e.target.value))}
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {RISK_FACTORS.resourceAvailability.description} • Weight: {RISK_WEIGHTS.resourceAvailability * 100}%
                                </p>
                            </div>

                            {/* Complexity */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label htmlFor="complexity" className="text-sm font-medium">
                                        {RISK_FACTORS.complexity.label}
                                    </Label>
                                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                        {complexity}
                                    </span>
                                </div>
                                <Input
                                    id="complexity"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={complexity}
                                    onChange={(e) => setComplexity(Number(e.target.value))}
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {RISK_FACTORS.complexity.description} • Weight: {RISK_WEIGHTS.complexity * 100}%
                                </p>
                            </div>

                            {/* Stakeholder Alignment */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label htmlFor="stakeholder-alignment" className="text-sm font-medium">
                                        {RISK_FACTORS.stakeholderAlignment.label}
                                    </Label>
                                    <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                                        {stakeholderAlignment}
                                    </span>
                                </div>
                                <Input
                                    id="stakeholder-alignment"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={stakeholderAlignment}
                                    onChange={(e) => setStakeholderAlignment(Number(e.target.value))}
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {RISK_FACTORS.stakeholderAlignment.description} • Weight: {RISK_WEIGHTS.stakeholderAlignment * 100}%
                                </p>
                            </div>

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
                            <ProjectSelector
                                selectedProjectId={selectedProjectId}
                                onProjectSelect={setSelectedProjectId}
                                label="Link to Project (Optional)"
                            />

                            <div>
                                <Label htmlFor="assessment-name">Assessment Name (Optional)</Label>
                                <Input
                                    id="assessment-name"
                                    placeholder="e.g., Q4 Marketing Campaign"
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
                                <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                    <LinkIcon className="h-3 w-3" />
                                    Will update project health score
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Results & Visualization */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Risk Score Gauge */}
                    <Card style={{ borderColor: riskColor, borderWidth: '2px' }}>
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center">
                                {/* Gauge Visualization */}
                                <div className="relative w-64 h-64 mb-6">
                                    <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                                        {/* Background circle */}
                                        <circle
                                            cx="100"
                                            cy="100"
                                            r="80"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="20"
                                            className="dark:stroke-gray-700"
                                        />
                                        {/* Risk score arc */}
                                        <circle
                                            cx="100"
                                            cy="100"
                                            r="80"
                                            fill="none"
                                            stroke={riskColor}
                                            strokeWidth="20"
                                            strokeDasharray={`${(riskScore / 100) * 502.65} 502.65`}
                                            strokeLinecap="round"
                                            className="transition-all duration-500"
                                        />
                                    </svg>
                                    {/* Center text */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-5xl font-bold" style={{ color: riskColor }}>
                                            {Math.round(riskScore)}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Risk Score
                                        </div>
                                    </div>
                                </div>

                                {/* Risk Level Badge */}
                                <div
                                    className="px-6 py-3 rounded-lg font-semibold text-lg mb-4"
                                    style={{ backgroundColor: `${riskColor}20`, color: riskColor }}
                                >
                                    {riskLevel}
                                </div>

                                {/* Risk Level Description */}
                                <p className="text-center text-gray-600 dark:text-gray-400 max-w-md">
                                    {riskScore >= 70 && 'High risk project requires immediate attention and mitigation strategies.'}
                                    {riskScore >= 40 && riskScore < 70 && 'Medium risk project should be monitored closely with regular reviews.'}
                                    {riskScore < 40 && 'Low risk project with manageable challenges. Maintain current approach.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommendations Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Risk Mitigation Recommendations</CardTitle>
                            <CardDescription>Actionable strategies to reduce project risk</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recommendations.map((rec, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {rec.includes('CRITICAL') && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                            {rec.includes('WARNING') && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                                            {rec.includes('GOOD') && <span className="text-green-500">•</span>}
                                            {!rec.includes('CRITICAL') && !rec.includes('WARNING') && !rec.includes('GOOD') && (
                                                <span className="text-blue-500">•</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {rec}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Factor Breakdown Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Factor Breakdown</CardTitle>
                            <CardDescription>Individual contribution to overall risk score</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { name: 'Budget Variance', value: budgetVariance, weight: RISK_WEIGHTS.budgetVariance, color: '#3b82f6' },
                                    { name: 'Schedule Delay', value: scheduleDelay, weight: RISK_WEIGHTS.scheduleDelay, color: '#8b5cf6' },
                                    { name: 'Resource Availability', value: resourceAvailability, weight: RISK_WEIGHTS.resourceAvailability, color: '#ec4899' },
                                    { name: 'Complexity', value: complexity, weight: RISK_WEIGHTS.complexity, color: '#f59e0b' },
                                    { name: 'Stakeholder Alignment', value: stakeholderAlignment, weight: RISK_WEIGHTS.stakeholderAlignment, color: '#06b6d4' }
                                ].map((factor) => (
                                    <div key={factor.name}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {factor.name}
                                            </span>
                                            <span className="text-sm font-semibold" style={{ color: factor.color }}>
                                                {factor.value} × {factor.weight * 100}% = {(factor.value * factor.weight).toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${factor.value}%`,
                                                    backgroundColor: factor.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
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
                                    {savedAssessments.map((assessment) => (
                                        <Card key={assessment.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1" onClick={() => handleLoadAssessment(assessment)}>
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {assessment.assessment_name || 'Unnamed Assessment'}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {new Date(assessment.created_at).toLocaleDateString()} at{' '}
                                                            {new Date(assessment.created_at).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteAssessment(assessment.id, assessment.assessment_name || undefined);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm" onClick={() => handleLoadAssessment(assessment)}>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">Risk Score:</p>
                                                        <p className="font-semibold" style={{ color: getRiskLevelFromScore(assessment.risk_score).color }}>
                                                            {Math.round(assessment.risk_score)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">Risk Level:</p>
                                                        <p className="font-semibold" style={{ color: getRiskLevelFromScore(assessment.risk_score).color }}>
                                                            {assessment.risk_level}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ✅ MAIN EXPORT: Wrapped in Suspense
export default function RiskCalculatorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600 dark:text-gray-400">Loading Risk Calculator...</p>
                </div>
            </div>
        }>
            <RiskCalculatorContent />
        </Suspense>
    );
}