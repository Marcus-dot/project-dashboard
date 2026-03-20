'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
    Shield,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { DASHLY_ROLES, type DashlyRole, type Invitation } from '@/types/team'

// ─────────────────────────────────────────
// States the page can be in
// ─────────────────────────────────────────
type PageState =
    | 'loading'        // validating token
    | 'valid'          // token is good, show accept button
    | 'accepting'      // user clicked accept, waiting
    | 'success'        // accepted successfully
    | 'invalid'        // token not found
    | 'expired'        // token expired
    | 'already_used'   // already accepted
    | 'wrong_email'    // logged in with wrong email
    | 'already_member' // already in a company
    | 'error'          // generic error

export default function InviteAcceptPage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string
    const supabase = createClient()

    const [state, setState] = useState<PageState>('loading')
    const [invitation, setInvitation] = useState<Invitation | null>(null)
    const [companyName, setCompanyName] = useState<string>('')
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    // ── Validate token on mount ──
    useEffect(() => {
        validateToken()
    }, [token])

    const validateToken = async () => {
        try {
            // Check auth state
            const { data: { user } } = await supabase.auth.getUser()
            setIsLoggedIn(!!user)
            setCurrentUserEmail(user?.email ?? null)

            // Validate the token via API
            const res = await fetch(`/api/invitations/${token}`)
            const data = await res.json()

            if (res.status === 404) { setState('invalid'); return }
            if (res.status === 410) {
                if (data.error?.includes('already been accepted')) {
                    setState('already_used')
                } else {
                    setState('expired')
                }
                return
            }
            if (!res.ok || !data.valid) {
                setState('invalid')
                return
            }

            setInvitation(data.invitation)
            setCompanyName(data.company_name ?? '')
            setState('valid')
        } catch {
            setState('error')
        }
    }

    const handleAccept = async () => {
        if (!isLoggedIn) {
            // Save token to sessionStorage then redirect to auth
            sessionStorage.setItem('pending_invite_token', token)
            router.push(`/auth?redirect=/invite/${token}`)
            return
        }

        setState('accepting')

        try {
            const res = await fetch(`/api/invitations/${token}/accept`, {
                method: 'POST',
            })
            const data = await res.json()

            if (!res.ok) {
                if (data.error?.includes('email address')) {
                    setState('wrong_email')
                    setErrorMessage(data.error)
                } else if (data.error?.includes('already belong')) {
                    setState('already_member')
                } else {
                    setState('error')
                    setErrorMessage(data.error ?? 'Something went wrong')
                }
                return
            }

            setState('success')
        } catch {
            setState('error')
            setErrorMessage('Something went wrong. Please try again.')
        }
    }

    // ─────────────────────────────────────────
    // Role display helper
    // ─────────────────────────────────────────
    const roleMeta = invitation
        ? DASHLY_ROLES.find(r => r.value === invitation.dashly_role)
        : null

    // ─────────────────────────────────────────
    // Shared shell
    // ─────────────────────────────────────────
    const Shell = ({ children }: { children: React.ReactNode }) => (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ background: '#0a0a0a' }}
        >
            {/* Subtle gradient glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 60% 40% at 50% 0%, #6E348218 0%, transparent 70%)',
                }}
            />
            <div
                className="relative w-full max-w-md rounded-2xl border p-8 shadow-2xl"
                style={{ background: '#111', borderColor: '#1e1e1e' }}
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1
                        className="text-2xl font-black tracking-tight"
                        style={{ color: '#A56ABD' }}
                    >
                        Dashly
                    </h1>
                </div>
                {children}
            </div>
        </div>
    )

    // ─────────────────────────────────────────
    // LOADING
    // ─────────────────────────────────────────
    if (state === 'loading') {
        return (
            <Shell>
                <div className="flex flex-col items-center gap-4 py-8">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#A56ABD' }} />
                    <p className="text-sm" style={{ color: '#666' }}>
                        Validating your invitation...
                    </p>
                </div>
            </Shell>
        )
    }

    // ─────────────────────────────────────────
    // VALID — main acceptance screen
    // ─────────────────────────────────────────
    if (state === 'valid' || state === 'accepting') {
        return (
            <Shell>
                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-sm" style={{ color: '#A9899A' }}>
                            You've been invited to join
                        </p>
                        <h2 className="text-xl font-bold text-white">{companyName}</h2>
                    </div>

                    {/* Role card */}
                    {roleMeta && (
                        <div
                            className="p-4 rounded-xl border text-center"
                            style={{
                                background: roleMeta.color + '0d',
                                borderColor: roleMeta.color + '33',
                            }}
                        >
                            <div className="flex items-center justify-center gap-2 mb-1">
                                {invitation?.dashly_role === 'OBSERVER' ? (
                                    <Eye className="w-4 h-4" style={{ color: roleMeta.color }} />
                                ) : (
                                    <Shield className="w-4 h-4" style={{ color: roleMeta.color }} />
                                )}
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: '#A9899A' }}
                                >
                                    Your role will be
                                </span>
                            </div>
                            <p
                                className="text-2xl font-bold"
                                style={{ color: roleMeta.color }}
                            >
                                {roleMeta.label}
                            </p>
                            <p className="text-xs mt-1" style={{ color: '#555' }}>
                                {roleMeta.description}
                            </p>
                        </div>
                    )}

                    {/* Expiry notice */}
                    {invitation && (
                        <div className="flex items-center gap-2 text-xs" style={{ color: '#555' }}>
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                                Expires {new Date(invitation.expires_at).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </span>
                        </div>
                    )}

                    {/* Not logged in notice */}
                    {!isLoggedIn && (
                        <div
                            className="p-3 rounded-lg text-sm"
                            style={{
                                background: '#1a1a1a',
                                border: '1px solid #2a2a2a',
                                color: '#A9899A',
                            }}
                        >
                            You'll need to log in or create an account to accept this invitation.
                        </div>
                    )}

                    {/* Logged in as */}
                    {isLoggedIn && currentUserEmail && (
                        <div
                            className="p-3 rounded-lg text-sm"
                            style={{
                                background: '#1a1a1a',
                                border: '1px solid #2a2a2a',
                                color: '#666',
                            }}
                        >
                            Accepting as{' '}
                            <span className="text-white font-medium">{currentUserEmail}</span>
                        </div>
                    )}

                    {/* Accept button */}
                    <Button
                        onClick={handleAccept}
                        disabled={state === 'accepting'}
                        className="w-full font-semibold py-3 text-base"
                        style={{
                            background: 'linear-gradient(135deg, #6E3482, #A56ABD)',
                            border: 'none',
                            color: '#fff',
                        }}
                    >
                        {state === 'accepting' ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Accepting...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Accept Invitation
                                <ArrowRight className="w-4 h-4" />
                            </span>
                        )}
                    </Button>
                </div>
            </Shell>
        )
    }

    // ─────────────────────────────────────────
    // SUCCESS
    // ─────────────────────────────────────────
    if (state === 'success') {
        return (
            <Shell>
                <div className="text-center space-y-6">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                        style={{ background: '#0d1f0d', border: '1px solid #1a3a1a' }}
                    >
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-white">You're in!</h2>
                        <p className="text-sm" style={{ color: '#A9899A' }}>
                            You've joined <span className="text-white font-medium">{companyName}</span> as a{' '}
                            <span style={{ color: roleMeta?.color }}>
                                {roleMeta?.label}
                            </span>
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push('/dashboard')}
                        className="w-full font-semibold"
                        style={{
                            background: 'linear-gradient(135deg, #6E3482, #A56ABD)',
                            border: 'none',
                            color: '#fff',
                        }}
                    >
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </Shell>
        )
    }

    // ─────────────────────────────────────────
    // ERROR STATES
    // ─────────────────────────────────────────
    const errorConfig: Record<string, { icon: React.ReactNode; title: string; message: string }> = {
        invalid: {
            icon: <XCircle className="w-8 h-8" style={{ color: '#ef4444' }} />,
            title: 'Invalid invitation',
            message: 'This invitation link is invalid or does not exist.',
        },
        expired: {
            icon: <Clock className="w-8 h-8" style={{ color: '#f59e0b' }} />,
            title: 'Invitation expired',
            message: 'This invitation has expired. Ask your team admin to send a new one.',
        },
        already_used: {
            icon: <CheckCircle2 className="w-8 h-8 text-green-400" />,
            title: 'Already accepted',
            message: 'This invitation has already been accepted.',
        },
        wrong_email: {
            icon: <XCircle className="w-8 h-8" style={{ color: '#ef4444' }} />,
            title: 'Wrong account',
            message: errorMessage,
        },
        already_member: {
            icon: <XCircle className="w-8 h-8" style={{ color: '#ef4444' }} />,
            title: 'Already in a workspace',
            message: 'You already belong to a company workspace on Dashly.',
        },
        error: {
            icon: <XCircle className="w-8 h-8" style={{ color: '#ef4444' }} />,
            title: 'Something went wrong',
            message: errorMessage || 'An unexpected error occurred. Please try again.',
        },
    }

    const config = errorConfig[state] ?? errorConfig.error

    return (
        <Shell>
            <div className="text-center space-y-6">
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                >
                    {config.icon}
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white">{config.title}</h2>
                    <p className="text-sm" style={{ color: '#A9899A' }}>
                        {config.message}
                    </p>
                </div>
                <Link href="/dashboard">
                    <Button
                        className="w-full font-semibold"
                        style={{
                            background: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            color: '#fff',
                        }}
                    >
                        Back to Dashboard
                    </Button>
                </Link>
            </div>
        </Shell>
    )
}