'use client'

import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')


    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()

        // Check passwords match
        if (password !== confirmPassword) {
            setMessage('Passwords do not match')
            return
        }

        setLoading(true)
        setMessage('')

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        })

        if (error) {
            setMessage(error.message)
            setLoading(false)
        } else {
            setMessage('Success! Check your email to confirm your account.')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full">
                <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
                    Create Account
                </h1>
                <p className="text-gray-600 mb-8 text-center">
                    Start managing your projects today
                </p>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="At least 6 characters"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Re-enter your password"
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.includes('Success')
                            ? 'bg-green-50 text-green-600'
                            : 'bg-red-50 text-red-600'
                            }`}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-indigo-600 hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}