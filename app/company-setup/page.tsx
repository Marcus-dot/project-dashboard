'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CompanyService } from '@/lib/services/company'

export default function CompanySetupPage() {
    const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
    const [companyName, setCompanyName] = useState('')
    const [accessCode, setAccessCode] = useState('')
    const [generatedCode, setGeneratedCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const router = useRouter()
    const supabase = createClient()
    const companyService = new CompanyService()

    // Check if user already has a company
    useEffect(() => {
        checkExistingCompany()
    }, [])

    const checkExistingCompany = async () => {
        const hasCompany = await companyService.isUserInCompany()
        if (hasCompany) {
            // User already in a company, redirect to dashboard
            router.push('/dashboard')
        }
    }

    // Generate a random access code for new companies
    const generateAccessCode = () => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase()
        setGeneratedCode(code)
        return code
    }

    // Handle creating a new company
    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Use generated code or custom code
            const finalCode = generatedCode || generateAccessCode()

            // Create the company
            const company = await companyService.createCompany(companyName, finalCode)

            // Join the company
            await companyService.joinCompany(company.id)

            // Redirect to dashboard
            router.push('/dashboard')
        } catch (error: any) {
            setError(error.message || 'Failed to create company')
            setLoading(false)
        }
    }

    // Handle joining an existing company
    const handleJoinCompany = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Validate the access code
            const { valid, company } = await companyService.validateAccessCode(accessCode)

            if (!valid || !company) {
                setError('Invalid access code. Please check and try again.')
                setLoading(false)
                return
            }

            // Join the company
            await companyService.joinCompany(company.id)

            // Redirect to dashboard
            router.push('/dashboard')
        } catch (error: any) {
            setError(error.message || 'Failed to join company')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full">
                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
                    Welcome! 🎉
                </h1>
                <p className="text-gray-600 mb-8 text-center">
                    Let's get you set up with a company
                </p>

                {/* Mode Selection */}
                {mode === 'choose' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                setMode('create')
                                generateAccessCode()
                            }}
                            className="w-full p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg border-2 border-indigo-200 transition-colors"
                        >
                            <div className="text-left">
                                <h3 className="font-semibold text-indigo-900">Create New Company</h3>
                                <p className="text-sm text-indigo-700 mt-1">
                                    I'm setting up a new company workspace
                                </p>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('join')}
                            className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-purple-200 transition-colors"
                        >
                            <div className="text-left">
                                <h3 className="font-semibold text-purple-900">Join Existing Company</h3>
                                <p className="text-sm text-purple-700 mt-1">
                                    I have an access code from my company
                                </p>
                            </div>
                        </button>
                    </div>
                )}

                {/* Create Company Form */}
                {mode === 'create' && (
                    <form onSubmit={handleCreateCompany} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company Name
                            </label>
                            <input
                                type="text"
                                required
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="ABC Marketing Ltd"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Access Code
                            </label>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-2">
                                    Share this code with your team members:
                                </p>
                                <div className="bg-white p-2 rounded border-2 border-indigo-200">
                                    <code className="text-lg font-mono font-bold text-indigo-600">
                                        {generatedCode}
                                    </code>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    ⚠️ Save this code! Your team needs it to join.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setMode('choose')}
                                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                            >
                                {loading ? 'Creating...' : 'Create Company'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Join Company Form */}
                {mode === 'join' && (
                    <form onSubmit={handleJoinCompany} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company Access Code
                            </label>
                            <input
                                type="text"
                                required
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono uppercase"
                                placeholder="Enter code"
                                maxLength={10}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Get this code from your company admin
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setMode('choose')}
                                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
                            >
                                {loading ? 'Joining...' : 'Join Company'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Help text */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Need help? Contact your company administrator
                    </p>
                </div>
            </div>
        </div>
    )
}