export type Priority = 'High' | 'Medium' | 'Low'
export type Status = 'Planning' | 'In progress' | 'Complete' | 'Paused' | 'Cancelled'
export type Scale = 'Short-term' | 'Medium-term' | 'Long-term'
export type UserRole = 'admin' | 'manager' | 'member'

export interface Project {
    id: string
    created_at: string
    updated_at: string
    name: string
    owner?: string
    details?: string
    duration?: number
    start_date?: string
    priority: Priority
    status: Status
    scale: Scale
    notes?: string
    user_id: string
    company_id: string
    created_by?: string
    budget?: number
    actual_costs?: number
    discount_rate?: number
    expected_revenue?: number
    npv?: number
    resource_allocation?: Record<string, number>
    resource_utilization?: number
    risk_score?: number
    risk_factors?: Record<string, any>
}

export interface Company {
    id: string
    name: string
    access_code: string
    created_at: string
    created_by: string
}

export interface Profile {
    id: string
    email: string
    full_name?: string
    company_id?: string
    role: UserRole
    created_at: string
    updated_at: string
}