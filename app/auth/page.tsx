'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, UserPlus, Mail, Lock, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type AuthTab = 'login' | 'signup'

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (signupPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      setIsSuccess(false)
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo:
          process.env.NODE_ENV === 'production'
            ? 'https://project-dashboard-ne4g.vercel.app/company-setup'
            : `${window.location.origin}/company-setup`,
      },
    })

    if (error) {
      setMessage(error.message)
      setIsSuccess(false)
      setLoading(false)
    } else {
      setMessage(
        "Success! Check your email to confirm your account."
      )
      setIsSuccess(true)
    }
  }

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab)
    setError('')
    setMessage('')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #FBFEF9, #F5F0F6)' }}
    >
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle" style={{ width: '100px', height: '100px', top: '15%', left: '10%', animationDuration: '20s' }} />
        <div className="particle" style={{ width: '80px', height: '80px', top: '70%', right: '15%', animationDuration: '15s', animationDelay: '2s' }} />
        <div className="particle" style={{ width: '120px', height: '120px', bottom: '20%', left: '20%', animationDuration: '18s', animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Image
            src="/dashly-logo.png"
            alt="Dashly"
            width={220}
            height={75}
            className="mx-auto mb-6"
            style={{ filter: 'drop-shadow(0 4px 15px rgba(165, 106, 189, 0.25))' }}
            priority
          />
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex border-b border-[#E8E0EC]">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-5 text-center text-lg font-semibold transition-all duration-300 relative ${activeTab === 'login'
                  ? 'text-[#6E3482]'
                  : 'text-[#A9899A] hover:text-[#6E3482]'
                }`}
            >
              <LogIn className="w-6 h-6 inline-block mr-2 mb-1" />
              Sign In
              {activeTab === 'login' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: 'linear-gradient(90deg, #A56ABD, #6E3482)' }}
                />
              )}
            </button>
            <button
              onClick={() => switchTab('signup')}
              className={`flex-1 py-5 text-center text-lg font-semibold transition-all duration-300 relative ${activeTab === 'signup'
                  ? 'text-[#6E3482]'
                  : 'text-[#A9899A] hover:text-[#6E3482]'
                }`}
            >
              <UserPlus className="w-6 h-6 inline-block mr-2 mb-1" />
              Sign Up
              {activeTab === 'signup' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: 'linear-gradient(90deg, #6E3482, #A56ABD)' }}
                />
              )}
            </button>
          </div>

          {/* Form Content */}
          <div className="p-10">
            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-6 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-[#6E3482] mb-3">
                    Welcome Back
                  </h2>
                  <p className="text-base text-[#A9899A]">
                    Sign in to manage your projects
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9899A]" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-base border-2 border-[#E8E0EC] rounded-xl focus:border-[#A56ABD] focus:outline-none transition-all bg-white/50"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9899A]" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-base border-2 border-[#E8E0EC] rounded-xl focus:border-[#A56ABD] focus:outline-none transition-all bg-white/50"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-base rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #A56ABD, #6E3482)' }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </form>
            )}

            {/* Signup Form */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-6 animate-fadeIn">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-[#6E3482] mb-3">
                    Create Account
                  </h2>
                  <p className="text-base text-[#A9899A]">
                    Start managing projects in seconds
                  </p>
                </div>

                {message && (
                  <div
                    className={`p-4 border rounded-xl text-sm ${isSuccess
                        ? 'bg-green-50 border-green-200 text-green-600'
                        : 'bg-red-50 border-red-200 text-red-600'
                      }`}
                  >
                    {message}
                  </div>
                )}

                <div className="space-y-5">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9899A]" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-base border-2 border-[#E8E0EC] rounded-xl focus:border-[#6E3482] focus:outline-none transition-all bg-white/50"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9899A]" />
                    <input
                      type="password"
                      placeholder="Password (6+ characters)"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-base border-2 border-[#E8E0EC] rounded-xl focus:border-[#6E3482] focus:outline-none transition-all bg-white/50"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9899A]" />
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-base border-2 border-[#E8E0EC] rounded-xl focus:border-[#6E3482] focus:outline-none transition-all bg-white/50"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-base rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #6E3482, #A56ABD)' }}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-[#A9899A]">
          <p>Dashly.co © 2026. All rights reserved.</p>
        </div>
      </div>

      <style jsx>{`
        /* Floating particles */
        .particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(165, 106, 189, 0.2), rgba(110, 52, 130, 0.05));
          pointer-events: none;
          animation: float 20s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
            opacity: 0.5;
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
            opacity: 0.4;
          }
        }

        /* Fade in animation for forms */
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}