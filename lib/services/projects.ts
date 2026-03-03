import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/project'
import { calculateProjectNPV } from '@/lib/utils/calculations'  // ✅ FIXED: Import legacy function

export class ProjectService {
    // Create a Supabase client instance
    private supabase = createClient()

    // HELPER: Get user's company_id from their profile
    private async getUserCompanyId() {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) return null

        const { data: profile } = await this.supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single()

        return profile?.company_id
    }

    // FUNCTION 1: Get all projects for the user's company
    async getProjects() {
        const companyId = await this.getUserCompanyId()
        if (!companyId) return []

        const { data, error } = await this.supabase
            .from('projects')
            .select('*')
            .eq('company_id', companyId)  // Filter by company
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as Project[]
    }

    // FUNCTION 2: Get a single project by ID
    async getProject(id: string) {
        const { data, error } = await this.supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data as Project
    }

    // FUNCTION 3: Create a new project
    async createProject(project: Partial<Project>) {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const companyId = await this.getUserCompanyId()
        if (!companyId) throw new Error('User not in a company')

        const scale = this.calculateScale(project.duration)

        const npv = this.calculateNPV(
            project.expected_revenue || 0,
            project.actual_costs || 0,
            project.discount_rate || 10,
            project.duration || 0
        )

        const { data, error } = await this.supabase
            .from('projects')
            .insert({
                ...project,
                scale,
                npv,
                user_id: user.id,
                company_id: companyId,
                created_by: user.id
            })
            .select()
            .single()

        if (error) throw error
        return data as Project
    }

    // FUNCTION 4: Update a project
    async updateProject(id: string, updates: Partial<Project>) {
        const existing = await this.getProject(id)

        const scale = updates.duration ? this.calculateScale(updates.duration) : undefined

        const npv = this.calculateNPV(
            updates.expected_revenue ?? existing.expected_revenue ?? 0,
            updates.actual_costs ?? existing.actual_costs ?? 0,
            updates.discount_rate ?? existing.discount_rate ?? 10,
            updates.duration ?? existing.duration ?? 0
        )

        const { data, error } = await this.supabase
            .from('projects')
            .update({
                ...updates,
                ...(scale && { scale }),
                npv
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Project
    }

    // FUNCTION 5: Delete a project
    async deleteProject(id: string) {
        const { error } = await this.supabase
            .from('projects')
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    // HELPER: Calculate project scale based on duration
    private calculateScale(duration?: number): 'Short-term' | 'Medium-term' | 'Long-term' {
        if (!duration) return 'Short-term'
        if (duration <= 3) return 'Short-term'
        if (duration <= 12) return 'Medium-term'
        return 'Long-term'
    }

    // HELPER: Calculate NPV using legacy simplified method
    // NOTE: This uses the simplified NPV calculation for basic projects
    // For advanced NPV with cash flow arrays, use the main calculateNPV function
    private calculateNPV(
        expectedRevenue: number,
        actualCosts: number,
        discountRate: number,
        durationMonths: number
    ): number {
        // ✅ FIXED: Call the legacy function that matches this signature
        return calculateProjectNPV(expectedRevenue, actualCosts, discountRate, durationMonths)
    }
}