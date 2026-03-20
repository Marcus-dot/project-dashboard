'use client'

import { useState } from 'react'
import { X, Mail, Shield, Eye, ChevronDown, Copy, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DASHLY_ROLES, type DashlyRole, type Invitation } from '@/types/team'

interface InviteModalProps {
    companyId: string
    onClose: () => void
    onInviteSent: (invitation: Invitation) => void
}

export function InviteModal({ onClose, onInviteSent }: InviteModalProps) {
    const [email, setEmail] = useState('')
    const [dashly_role, setDashlyRole] = useState<DashlyRole>('OBSERVER')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showRoleDropdown, setShowRoleDropdown] = useState(false)

    // After success
    const [sentInvitation, setSentInvitation] = useState<Invitation | null>(null)
    const [copied, setCopied] = useState(false)

    const selectedRole = DASHLY_ROLES.find(r => r.value === dashly_role)!

    const handleSubmit = async () => {
        setError(null)

        if (!email.trim()) {
            setError('Email address is required')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email address')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/invitations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), dashly_role }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error ?? 'Failed to send invitation')
                return
            }

            setSentInvitation(data.invitation)
            onInviteSent(data.invitation)
        } catch {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const copyLink = () => {
        if (!sentInvitation) return
        const baseUrl = window.location.origin
        navigator.clipboard.writeText(`${baseUrl}/invite/${sentInvitation.token}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const roleIcons: Record<DashlyRole, React.ReactNode> = {
        DASHMASTER: <Shield className="w-4 h-4" />,
        DASHKEEPER: <Shield className="w-4 h-4 opacity-70" />,
        OBSERVER: <Eye className="w-4 h-4" />,
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="w-full max-w-md rounded-2xl border shadow-2xl"
                    style={{
                        background: '#111',
                        borderColor: '#2a2a2a',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between p-6 border-b"
                        style={{ borderColor: '#1e1e1e' }}
                    >
                        <div>
                            <h2 className="text-lg font-bold text-white">Invite Team Member</h2>
                            <p className="text-sm mt-0.5" style={{ color: '#A9899A' }}>
                                They'll receive an email with a secure link
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg transition-colors hover:bg-white/5"
                            style={{ color: '#666' }}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5">
                        {!sentInvitation ? (
                            <>
                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" style={{ color: '#A9899A' }}>
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                            style={{ color: '#555' }}
                                        />
                                        <Input
                                            type="email"
                                            placeholder="colleague@company.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                            className="pl-10 border text-white placeholder:text-gray-600"
                                            style={{
                                                background: '#1a1a1a',
                                                borderColor: '#2a2a2a',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Role Selector */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" style={{ color: '#A9899A' }}>
                                        Assign Role
                                    </label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors hover:border-purple-500/50"
                                            style={{
                                                background: '#1a1a1a',
                                                borderColor: '#2a2a2a',
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span style={{ color: selectedRole.color }}>
                                                    {roleIcons[dashly_role]}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">
                                                        {selectedRole.label}
                                                    </p>
                                                    <p className="text-xs" style={{ color: '#666' }}>
                                                        {selectedRole.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronDown
                                                className="w-4 h-4 transition-transform"
                                                style={{
                                                    color: '#666',
                                                    transform: showRoleDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                                                }}
                                            />
                                        </button>

                                        {showRoleDropdown && (
                                            <div
                                                className="absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-xl z-10 overflow-hidden"
                                                style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}
                                            >
                                                {DASHLY_ROLES.map(role => (
                                                    <button
                                                        key={role.value}
                                                        onClick={() => {
                                                            setDashlyRole(role.value)
                                                            setShowRoleDropdown(false)
                                                        }}
                                                        className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-white/5"
                                                    >
                                                        <span style={{ color: role.color }}>
                                                            {roleIcons[role.value]}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-semibold text-white">
                                                                {role.label}
                                                            </p>
                                                            <p className="text-xs" style={{ color: '#666' }}>
                                                                {role.description}
                                                            </p>
                                                        </div>
                                                        {dashly_role === role.value && (
                                                            <Check className="w-4 h-4 ml-auto" style={{ color: role.color }} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div
                                        className="p-3 rounded-lg text-sm"
                                        style={{ background: '#2a1a1a', color: '#ff6b6b', border: '1px solid #3a2020' }}
                                    >
                                        {error}
                                    </div>
                                )}

                                {/* Submit */}
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full font-semibold py-2.5 transition-all"
                                    style={{
                                        background: 'linear-gradient(135deg, #6E3482, #A56ABD)',
                                        border: 'none',
                                        color: '#fff',
                                    }}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Send Invitation
                                        </span>
                                    )}
                                </Button>
                            </>
                        ) : (
                            /* Success State */
                            <div className="space-y-5">
                                <div
                                    className="p-4 rounded-xl text-center"
                                    style={{ background: '#0d1f0d', border: '1px solid #1a3a1a' }}
                                >
                                    <div className="text-3xl mb-2">✓</div>
                                    <p className="font-semibold text-green-400">Invitation sent!</p>
                                    <p className="text-sm mt-1" style={{ color: '#666' }}>
                                        Email delivered to{' '}
                                        <span className="text-white">{sentInvitation.email}</span>
                                    </p>
                                </div>

                                {/* Copyable link */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium" style={{ color: '#A9899A' }}>
                                        Or share this link directly
                                    </p>
                                    <div
                                        className="flex items-center gap-2 p-3 rounded-lg border"
                                        style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}
                                    >
                                        <p
                                            className="text-xs flex-1 truncate font-mono"
                                            style={{ color: '#A56ABD' }}
                                        >
                                            {window.location.origin}/invite/{sentInvitation.token}
                                        </p>
                                        <button
                                            onClick={copyLink}
                                            className="shrink-0 p-1.5 rounded-md transition-colors hover:bg-white/5"
                                            style={{ color: copied ? '#4ade80' : '#A56ABD' }}
                                        >
                                            {copied ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    onClick={onClose}
                                    className="w-full"
                                    style={{
                                        background: '#1a1a1a',
                                        border: '1px solid #2a2a2a',
                                        color: '#fff',
                                    }}
                                >
                                    Done
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}