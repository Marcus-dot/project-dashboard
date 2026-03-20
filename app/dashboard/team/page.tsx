'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Users,
    Shield,
    Eye,
    Plus,
    Mail,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    Building2,
    Loader2,
    RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { InviteModal } from '@/components/team/InviteModal'
import { createClient } from '@/lib/supabase/client'
import { CompanyService } from '@/lib/services/company'
import {
    type TeamMember,
    type Invitation,
    type DashlyRole,
    DASHLY_ROLES,
    canInviteMembers,
} from '@/types/team'

// ─────────────────────────────────────────
// Role badge
// ─────────────────────────────────────────
function RoleBadge({ role }: { role: DashlyRole }) {
    const meta = DASHLY_ROLES.find(r => r.value === role)!
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: meta.color + '22', color: meta.color, border: `1px solid ${meta.color}44` }}
        >
            {role === 'OBSERVER' ? (
                <Eye className="w-3 h-3" />
            ) : (
                <Shield className="w-3 h-3" />
            )}
            {meta.label}
        </span>
    )
}

// ─────────────────────────────────────────
// Invitation status badge
// ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const config = {
        pending: { color: '#f59e0b', bg: '#f59e0b22', label: 'Pending', icon: <Clock className="w-3 h-3" /> },
        accepted: { color: '#4ade80', bg: '#4ade8022', label: 'Accepted', icon: <CheckCircle2 className="w-3 h-3" /> },
        expired: { color: '#666', bg: '#66666622', label: 'Expired', icon: <XCircle className="w-3 h-3" /> },
    }[status] ?? { color: '#666', bg: '#66666622', label: status, icon: null }

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: config.bg, color: config.color, border: `1px solid ${config.color}44` }}
        >
            {config.icon}
            {config.label}
        </span>
    )
}

// ─────────────────────────────────────────
// Main page
// ─────────────────────────────────────────
export default function TeamPage() {
    const router = useRouter()
    const supabase = createClient()
    const companyService = new CompanyService()

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [showInviteModal, setShowInviteModal] = useState(false)

    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<DashlyRole>('OBSERVER')
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [companyName, setCompanyName] = useState<string>('')

    const [members, setMembers] = useState<TeamMember[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])

    // ── Init ──
    useEffect(() => {
        initialise()
    }, [])

    const initialise = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/auth'); return }

            setCurrentUserId(user.id)

            // Get profile + role
            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id, dashly_role')
                .eq('id', user.id)
                .single()

            if (!profile?.company_id) { router.push('/company-setup'); return }

            setCompanyId(profile.company_id)
            setCurrentUserRole((profile.dashly_role as DashlyRole) ?? 'OBSERVER')

            // Get company name
            const company = await companyService.getUserCompany()
            setCompanyName(company?.name ?? '')

            await loadData(profile.company_id)
        } catch (err) {
            console.error('Team page init error:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadData = async (cid: string) => {
        await Promise.all([
            loadMembers(cid),
            loadInvitations(),
        ])
    }

    const loadMembers = async (cid: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('id, email, full_name, dashly_role, industry, company_id, created_at, updated_at')
            .eq('company_id', cid)
            .order('created_at', { ascending: true })

        setMembers((data ?? []) as TeamMember[])
    }

    const loadInvitations = async () => {
        const res = await fetch('/api/invitations')
        if (!res.ok) return
        const data = await res.json()
        setInvitations(data.invitations ?? [])
    }

    const handleRefresh = async () => {
        if (!companyId) return
        setRefreshing(true)
        await loadData(companyId)
        setRefreshing(false)
    }

    const handleInviteSent = (invitation: Invitation) => {
        setInvitations(prev => [invitation, ...prev])
    }

    // ── Derived ──
    const pendingInvitations = invitations.filter(i => i.status === 'pending')
    const dashmasterCount = members.filter(m => m.dashly_role === 'DASHMASTER').length
    const canInvite = canInviteMembers(currentUserRole)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
                <div className="flex items-center gap-3" style={{ color: '#A9899A' }}>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading team...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen" style={{ background: '#0a0a0a' }}>

            {/* ── Header ── */}
            <div
                className="border-b px-6 py-4"
                style={{ background: '#111', borderColor: '#1e1e1e' }}
            >
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-sm transition-colors hover:text-white"
                            style={{ color: '#666' }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Dashboard
                        </Link>
                        <span style={{ color: '#333' }}>/</span>
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" style={{ color: '#A56ABD' }} />
                            <span className="font-semibold text-white">{companyName}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 rounded-lg transition-colors hover:bg-white/5"
                            style={{ color: '#666' }}
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>

                        {canInvite && (
                            <Button
                                onClick={() => setShowInviteModal(true)}
                                className="flex items-center gap-2 font-semibold"
                                style={{
                                    background: 'linear-gradient(135deg, #6E3482, #A56ABD)',
                                    border: 'none',
                                    color: '#fff',
                                }}
                            >
                                <Plus className="w-4 h-4" />
                                Invite Member
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Main ── */}
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

                {/* Page title */}
                <div>
                    <h1 className="text-2xl font-bold text-white">Team Management</h1>
                    <p className="mt-1 text-sm" style={{ color: '#A9899A' }}>
                        Manage who has access to your workspace and what they can do
                    </p>
                </div>

                {/* ── Stats row ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Members', value: members.length, color: '#A56ABD' },
                        { label: 'Dashmasters', value: dashmasterCount, color: '#6E3482', note: 'max 2' },
                        { label: 'Pending Invites', value: pendingInvitations.length, color: '#f59e0b' },
                        { label: 'Your Role', value: DASHLY_ROLES.find(r => r.value === currentUserRole)?.label ?? currentUserRole, color: '#4ade80' },
                    ].map(stat => (
                        <div
                            key={stat.label}
                            className="rounded-xl p-4 border"
                            style={{ background: '#111', borderColor: '#1e1e1e' }}
                        >
                            <p className="text-xs font-medium mb-1" style={{ color: '#666' }}>
                                {stat.label}
                                {stat.note && <span className="ml-1 opacity-50">({stat.note})</span>}
                            </p>
                            <p className="text-xl font-bold" style={{ color: stat.color }}>
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Members table ── */}
                <Card style={{ background: '#111', borderColor: '#1e1e1e' }}>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" style={{ color: '#A56ABD' }} />
                            <CardTitle className="text-white">Members</CardTitle>
                        </div>
                        <CardDescription style={{ color: '#666' }}>
                            {members.length} {members.length === 1 ? 'person' : 'people'} in this workspace
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {members.length === 0 ? (
                            <div className="py-8 text-center" style={{ color: '#444' }}>
                                No members found
                            </div>
                        ) : (
                            <div className="divide-y" style={{ borderColor: '#1e1e1e' }}>
                                {members.map(member => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                                    >
                                        {/* Avatar + info */}
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                                style={{ background: '#1e1e1e', color: '#A56ABD' }}
                                            >
                                                {(member.full_name ?? member.email)[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-white">
                                                        {member.full_name ?? '—'}
                                                    </p>
                                                    {member.id === currentUserId && (
                                                        <span
                                                            className="text-xs px-1.5 py-0.5 rounded"
                                                            style={{ background: '#6E348222', color: '#A56ABD' }}
                                                        >
                                                            you
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs" style={{ color: '#666' }}>
                                                    {member.email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Role */}
                                        <RoleBadge role={(member.dashly_role as DashlyRole) ?? 'OBSERVER'} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Invitations table ── */}
                <Card style={{ background: '#111', borderColor: '#1e1e1e' }}>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5" style={{ color: '#A56ABD' }} />
                            <CardTitle className="text-white">Invitations</CardTitle>
                        </div>
                        <CardDescription style={{ color: '#666' }}>
                            {pendingInvitations.length} pending
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {invitations.length === 0 ? (
                            <div className="py-8 text-center space-y-3">
                                <Mail className="w-8 h-8 mx-auto" style={{ color: '#333' }} />
                                <p className="text-sm" style={{ color: '#444' }}>
                                    No invitations sent yet
                                </p>
                                {canInvite && (
                                    <Button
                                        onClick={() => setShowInviteModal(true)}
                                        size="sm"
                                        style={{
                                            background: 'linear-gradient(135deg, #6E3482, #A56ABD)',
                                            border: 'none',
                                            color: '#fff',
                                        }}
                                    >
                                        Send your first invitation
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y" style={{ borderColor: '#1e1e1e' }}>
                                {invitations.map(inv => (
                                    <div
                                        key={inv.id}
                                        className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                                style={{ background: '#1e1e1e' }}
                                            >
                                                <Mail className="w-4 h-4" style={{ color: '#555' }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">{inv.email}</p>
                                                <p className="text-xs" style={{ color: '#555' }}>
                                                    Expires {new Date(inv.expires_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <RoleBadge role={inv.dashly_role as DashlyRole} />
                                            <StatusBadge status={inv.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Role guide ── */}
                <Card style={{ background: '#111', borderColor: '#1e1e1e' }}>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5" style={{ color: '#A56ABD' }} />
                            <CardTitle className="text-white">Role Guide</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-3 gap-4">
                            {DASHLY_ROLES.map(role => (
                                <div
                                    key={role.value}
                                    className="p-4 rounded-xl border"
                                    style={{
                                        background: role.color + '0a',
                                        borderColor: role.color + '33',
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="w-4 h-4" style={{ color: role.color }} />
                                        <span className="font-semibold text-sm" style={{ color: role.color }}>
                                            {role.label}
                                        </span>
                                    </div>
                                    <p className="text-xs leading-relaxed" style={{ color: '#666' }}>
                                        {role.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* ── Invite Modal ── */}
            {showInviteModal && companyId && (
                <InviteModal
                    companyId={companyId}
                    onClose={() => setShowInviteModal(false)}
                    onInviteSent={handleInviteSent}
                />
            )}
        </div>
    )
}