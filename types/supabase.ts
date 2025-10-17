export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            companies: {
                Row: {
                    id: string
                    name: string
                    access_code: string
                    created_at: string
                    created_by: string
                    currency: string
                    country: string
                    timezone: string
                    industry: string | null
                    size: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    access_code?: string
                    created_at?: string
                    created_by: string
                    currency?: string
                    country?: string
                    timezone?: string
                    industry?: string | null
                    size?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    access_code?: string
                    created_at?: string
                    created_by?: string
                    currency?: string
                    country?: string
                    timezone?: string
                    industry?: string | null
                    size?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "companies_created_by_fkey"
                        columns: ["created_by"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            npv_calculations: {
                Row: {
                    id: string
                    user_id: string
                    project_id: string | null
                    company_id: string
                    initial_investment: number
                    discount_rate: number
                    project_duration: number
                    cash_flows: Json
                    npv_result: number
                    is_viable: boolean
                    currency: string
                    calculation_name: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    project_id?: string | null
                    company_id: string
                    initial_investment: number
                    discount_rate: number
                    project_duration: number
                    cash_flows: Json
                    npv_result: number
                    is_viable: boolean
                    currency?: string
                    calculation_name?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    project_id?: string | null
                    company_id?: string
                    initial_investment?: number
                    discount_rate?: number
                    project_duration?: number
                    cash_flows?: Json
                    npv_result?: number
                    is_viable?: boolean
                    currency?: string
                    calculation_name?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "npv_calculations_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "npv_calculations_project_id_fkey"
                        columns: ["project_id"]
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "npv_calculations_company_id_fkey"
                        columns: ["company_id"]
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    company_id: string | null
                    role: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    company_id?: string | null
                    role?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    company_id?: string | null
                    role?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "profiles_company_id_fkey"
                        columns: ["company_id"]
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    }
                ]
            }
            projects: {
                Row: {
                    id: string
                    company_id: string
                    created_by: string
                    user_id: string
                    name: string
                    owner: string | null
                    details: string | null
                    notes: string | null
                    start_date: string | null
                    duration: number | null
                    scale: string | null
                    priority: string | null
                    status: string | null
                    budget: number | null
                    actual_costs: number | null
                    discount_rate: number | null
                    expected_revenue: number | null
                    npv: number | null
                    resource_allocation: Json | null
                    resource_utilization: number | null
                    risk_score: number | null
                    risk_factors: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    company_id: string
                    created_by: string
                    user_id: string
                    name: string
                    owner?: string | null
                    details?: string | null
                    notes?: string | null
                    start_date?: string | null
                    duration?: number | null
                    scale?: string | null
                    priority?: string | null
                    status?: string | null
                    budget?: number | null
                    actual_costs?: number | null
                    discount_rate?: number | null
                    expected_revenue?: number | null
                    npv?: number | null
                    resource_allocation?: Json | null
                    resource_utilization?: number | null
                    risk_score?: number | null
                    risk_factors?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    company_id?: string
                    created_by?: string
                    user_id?: string
                    name?: string
                    owner?: string | null
                    details?: string | null
                    notes?: string | null
                    start_date?: string | null
                    duration?: number | null
                    scale?: string | null
                    priority?: string | null
                    status?: string | null
                    budget?: number | null
                    actual_costs?: number | null
                    discount_rate?: number | null
                    expected_revenue?: number | null
                    npv?: number | null
                    resource_allocation?: Json | null
                    resource_utilization?: number | null
                    risk_score?: number | null
                    risk_factors?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "projects_company_id_fkey"
                        columns: ["company_id"]
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "projects_created_by_fkey"
                        columns: ["created_by"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "projects_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}