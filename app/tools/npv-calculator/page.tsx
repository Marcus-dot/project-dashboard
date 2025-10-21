'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Calculator, TrendingUp, TrendingDown, Save, History, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectSelector } from '@/components/ui/ProjectSelector';
import { calculateCumulativeNPV, getDefaultDiscountRate } from '@/lib/utils/calculations';
import { saveNPVCalculation, getUserNPVCalculations, deleteNPVCalculation, linkNPVToProject } from '@/lib/services/npv-client';
import type { NPVCalculation } from '@/types/npv';
import { createClient } from '@/lib/supabase/client';

export default function NPVCalculatorPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Form state
    const [initialInvestment, setInitialInvestment] = useState<number>(100000);
    const [discountRate, setDiscountRate] = useState<number>(10);
    const [projectDuration, setProjectDuration] = useState<number>(5);
    const [cashFlows, setCashFlows] = useState<number[]>([30000, 35000, 40000, 40000, 35000]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

    // Calculation results
    const [npvResult, setNpvResult] = useState<number | null>(null);
    const [isViable, setIsViable] = useState<boolean>(false);
    const [chartData, setChartData] = useState<Array<{ year: number; value: number }>>([]);

    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [savedCalculations, setSavedCalculations] = useState<NPVCalculation[]>([]);
    const [calculationName, setCalculationName] = useState<string>('');

    // User context
    const [currency, setCurrency] = useState<string>('ZMW');
    const [userCountry, setUserCountry] = useState<string>('');

    // Check for project ID in URL on mount
    useEffect(() => {
        const projectId = searchParams.get('project');
        if (projectId) {
            setSelectedProjectId(projectId);
        }
    }, [searchParams]);

    // Load user's company data for currency and country
    useEffect(() => {
        async function loadUserContext() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select(`
          company_id,
          companies:company_id (
            currency,
            country
          )
        `)
                .eq('id', user.id)
                .single();

            if (profile?.companies) {
                const companyArray = profile.companies as { currency?: string; country?: string }[] | { currency?: string; country?: string } | null;
                const companyData = Array.isArray(companyArray) ? companyArray[0] : companyArray;

                if (companyData?.currency) {
                    setCurrency(companyData.currency);
                }
                if (companyData?.country) {
                    setUserCountry(companyData.country);
                    // Set country-specific default discount rate
                    const defaultRate = getDefaultDiscountRate(companyData.country);
                    setDiscountRate(defaultRate);
                }
            }
        }

        loadUserContext();
    }, [supabase]);

    // Load saved calculations
    useEffect(() => {
        async function loadCalculations() {
            const calculations = await getUserNPVCalculations();
            setSavedCalculations(calculations);
        }
        loadCalculations();
    }, []);

    // Calculate NPV whenever inputs change
    useEffect(() => {
        if (cashFlows.length > 0) {
            const cumulativeData = calculateCumulativeNPV(initialInvestment, discountRate, cashFlows);
            const finalNPV = cumulativeData[cumulativeData.length - 1].value;

            setNpvResult(finalNPV);
            setIsViable(finalNPV > 0);
            setChartData(cumulativeData);
        }
    }, [initialInvestment, discountRate, cashFlows]);

    // Handle duration change
    const handleDurationChange = (newDuration: number) => {
        setProjectDuration(newDuration);

        // Adjust cash flows array
        const newCashFlows = [...cashFlows];
        if (newDuration > cashFlows.length) {
            // Add new years with default value (average of existing)
            const avgFlow = cashFlows.reduce((sum, val) => sum + val, 0) / cashFlows.length;
            while (newCashFlows.length < newDuration) {
                newCashFlows.push(Math.round(avgFlow));
            }
        } else {
            // Remove years
            newCashFlows.splice(newDuration);
        }
        setCashFlows(newCashFlows);
    };

    // Handle cash flow change
    const handleCashFlowChange = (index: number, value: number) => {
        const newCashFlows = [...cashFlows];
        newCashFlows[index] = value;
        setCashFlows(newCashFlows);
    };

    // Save calculation to database
    const handleSaveCalculation = async () => {
        setIsSaving(true);

        const loadingToast = toast.loading('Saving NPV calculation...');

        const saved = await saveNPVCalculation({
            initial_investment: initialInvestment,
            discount_rate: discountRate,
            cash_flows: cashFlows,
            calculation_name: calculationName || `NPV Calculation - ${new Date().toLocaleDateString()}`,
            project_id: selectedProjectId
        });

        if (saved) {
            // Link to project if selected
            if (selectedProjectId) {
                const linked = await linkNPVToProject(saved.id, selectedProjectId);
                if (linked) {
                    toast.success('NPV linked to project!', {
                        id: loadingToast,
                        description: 'Calculation saved and project health score updated',
                        duration: 4000
                    });
                } else {
                    toast.warning('Calculation saved but linking failed', {
                        id: loadingToast,
                        description: 'You can manually link it later',
                        duration: 4000
                    });
                }
            } else {
                toast.success('Calculation saved successfully!', {
                    id: loadingToast,
                    description: 'You can view it in the History sidebar',
                    duration: 4000
                });
            }

            // Reload calculations list
            const calculations = await getUserNPVCalculations();
            setSavedCalculations(calculations);
            setCalculationName('');
        } else {
            toast.error('Failed to save calculation', {
                id: loadingToast,
                description: 'Please check your connection and try again',
                duration: 5000
            });
        }

        setIsSaving(false);
    };

    // Load a saved calculation
    const handleLoadCalculation = (calc: NPVCalculation) => {
        setInitialInvestment(calc.initial_investment);
        setDiscountRate(calc.discount_rate);
        setCashFlows(calc.cash_flows);
        setProjectDuration(calc.cash_flows.length);
        setSelectedProjectId(calc.project_id || undefined);
        setShowHistory(false);

        toast.success('Calculation loaded', {
            description: `Loaded "${calc.calculation_name || 'Unnamed Calculation'}"`,
            duration: 3000
        });
    };

    // Delete a saved calculation
    const handleDeleteCalculation = async (id: string, name?: string) => {
        toast.error(`Delete "${name || 'this calculation'}"?`, {
            description: 'This action cannot be undone',
            duration: 6000,
            action: {
                label: 'Delete',
                onClick: async () => {
                    const deleted = await deleteNPVCalculation(id);
                    if (deleted) {
                        const calculations = await getUserNPVCalculations();
                        setSavedCalculations(calculations);

                        toast.success('Calculation deleted', {
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
        setInitialInvestment(100000);
        setDiscountRate(getDefaultDiscountRate(userCountry) || 10);
        setProjectDuration(5);
        setCashFlows([30000, 35000, 40000, 40000, 35000]);
        setCalculationName('');
        setSelectedProjectId(undefined);

        toast.info('Reset to defaults', {
            description: 'All values have been restored',
            duration: 2000
        });
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
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
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Calculator className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                NPV Calculator
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Net Present Value analysis for financial viability
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2"
                    >
                        <History className="h-4 w-4" />
                        History ({savedCalculations.length})
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Input Parameters */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Investment Parameters</CardTitle>
                            <CardDescription>Configure your project's financial details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Initial Investment */}
                            <div>
                                <Label htmlFor="initial-investment">Initial Investment ({currency})</Label>
                                <Input
                                    id="initial-investment"
                                    type="number"
                                    value={initialInvestment}
                                    onChange={(e) => setInitialInvestment(Number(e.target.value))}
                                    className="mt-1"
                                />
                            </div>

                            {/* Discount Rate */}
                            <div>
                                <Label htmlFor="discount-rate">Discount Rate (%)</Label>
                                <Input
                                    id="discount-rate"
                                    type="number"
                                    step="0.1"
                                    value={discountRate}
                                    onChange={(e) => setDiscountRate(Number(e.target.value))}
                                    className="mt-1"
                                />
                                {userCountry && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Default for {userCountry}: {getDefaultDiscountRate(userCountry)}%
                                    </p>
                                )}
                            </div>

                            {/* Project Duration */}
                            <div>
                                <Label htmlFor="project-duration">Project Duration (Years)</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDurationChange(Math.max(1, projectDuration - 1))}
                                        disabled={projectDuration <= 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        id="project-duration"
                                        type="number"
                                        value={projectDuration}
                                        onChange={(e) => handleDurationChange(Math.max(1, Number(e.target.value)))}
                                        className="text-center"
                                        min="1"
                                        max="30"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDurationChange(Math.min(30, projectDuration + 1))}
                                        disabled={projectDuration >= 30}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Cash Flows */}
                            <div>
                                <Label>Expected Cash Flows by Year</Label>
                                <div className="space-y-2 mt-2 max-h-64 overflow-y-auto pr-2">
                                    {cashFlows.map((flow, index) => (
                                        <div key={index}>
                                            <Label htmlFor={`year-${index + 1}`} className="text-xs text-gray-600 dark:text-gray-400">
                                                Year {index + 1}:
                                            </Label>
                                            <Input
                                                id={`year-${index + 1}`}
                                                type="number"
                                                value={flow}
                                                onChange={(e) => handleCashFlowChange(index, Number(e.target.value))}
                                                className="mt-1"
                                            />
                                        </div>
                                    ))}
                                </div>
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

                    {/* Save Calculation Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Save This Calculation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Project Selector */}
                            <ProjectSelector
                                selectedProjectId={selectedProjectId}
                                onProjectSelect={setSelectedProjectId}
                                label="Link to Project (Optional)"
                            />

                            <div>
                                <Label htmlFor="calc-name">Calculation Name (Optional)</Label>
                                <Input
                                    id="calc-name"
                                    placeholder="e.g., Solar Farm Project"
                                    value={calculationName}
                                    onChange={(e) => setCalculationName(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <Button
                                onClick={handleSaveCalculation}
                                disabled={isSaving}
                                className="w-full"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? 'Saving...' : selectedProjectId ? 'Save & Link to Project' : 'Save Calculation'}
                            </Button>
                            {selectedProjectId && (
                                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <LinkIcon className="h-3 w-3" />
                                    Will update project health score
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Results & Visualization */}
                <div className="lg:col-span-2 space-y-6">
                    {/* NPV Result Card */}
                    <Card className={isViable ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
                        <CardContent className="p-6">
                            <div className={`p-6 rounded-lg ${isViable ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        {isViable ? (
                                            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                                        )}
                                        <h3 className={`text-lg font-medium ${isViable ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                                            Net Present Value
                                        </h3>
                                    </div>
                                </div>

                                <div className={`text-4xl font-bold mb-4 ${isViable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {npvResult !== null ? formatCurrency(npvResult) : '-'}
                                </div>

                                <div className={`flex items-start gap-2 p-3 rounded ${isViable ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                                    <div className="mt-0.5">
                                        {isViable ? (
                                            <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                                        ) : (
                                            <span className="text-red-600 dark:text-red-400 text-xl">✗</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className={`font-semibold ${isViable ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                                            {isViable ? 'Project is Viable' : 'Project is Not Viable'}
                                        </p>
                                        <p className={`text-sm mt-1 ${isViable ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                            {isViable
                                                ? 'The project generates positive value. Expected returns exceed the cost of capital.'
                                                : 'The project destroys value. Expected returns do not cover the cost of capital. Consider revising parameters or exploring alternatives.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Chart Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Cumulative Present Value Over Time</CardTitle>
                            <CardDescription>Track how NPV accumulates across project years</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="year"
                                        label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                                        stroke="#6b7280"
                                    />
                                    <YAxis
                                        label={{ value: `Value (${currency})`, angle: -90, position: 'insideLeft' }}
                                        stroke="#6b7280"
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [formatCurrency(value), 'Cumulative NPV']}
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke={isViable ? '#10b981' : '#ef4444'}
                                        strokeWidth={3}
                                        dot={{ fill: isViable ? '#10b981' : '#ef4444', r: 5 }}
                                        name="Cumulative NPV"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Educational Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">How NPV Works</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-green-600 dark:text-green-400">•</span>
                                <p>
                                    <strong className="text-gray-900 dark:text-white">NPV</strong> calculates the present value of future cash flows minus initial investment
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-blue-600 dark:text-blue-400">•</span>
                                <p>
                                    <strong className="text-gray-900 dark:text-white">Positive NPV</strong> means the project is expected to generate value
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-red-600 dark:text-red-400">•</span>
                                <p>
                                    <strong className="text-gray-900 dark:text-white">Negative NPV</strong> means the project will likely destroy value
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-purple-600 dark:text-purple-400">•</span>
                                <p>
                                    The <strong className="text-gray-900 dark:text-white">discount rate</strong> reflects the cost of capital or required return
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
                                    Saved Calculations
                                </h2>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowHistory(false)}
                                >
                                    ✕
                                </Button>
                            </div>

                            {savedCalculations.length === 0 ? (
                                <div className="text-center py-12">
                                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No saved calculations yet
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {savedCalculations.map((calc) => (
                                        <Card key={calc.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1" onClick={() => handleLoadCalculation(calc)}>
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {calc.calculation_name || 'Unnamed Calculation'}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {new Date(calc.created_at).toLocaleDateString()} at{' '}
                                                            {new Date(calc.created_at).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteCalculation(calc.id, calc.calculation_name || undefined);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm" onClick={() => handleLoadCalculation(calc)}>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">NPV Result:</p>
                                                        <p className={`font-semibold ${calc.is_viable ? 'text-green-600' : 'text-red-600'}`}>
                                                            {formatCurrency(calc.npv_result)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">Status:</p>
                                                        <p className={`font-semibold ${calc.is_viable ? 'text-green-600' : 'text-red-600'}`}>
                                                            {calc.is_viable ? 'Viable' : 'Not Viable'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">Duration:</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {calc.project_duration} years
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">Rate:</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {calc.discount_rate}%
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