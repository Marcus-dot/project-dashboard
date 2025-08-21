// This service handles all project-related operations
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/project'

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

    // FUNCTION 3: Create a new project for the company
    async createProject(project: Partial<Project>) {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const companyId = await this.getUserCompanyId()
        if (!companyId) throw new Error('User not in a company')

        // Calculate the scale based on duration
        const scale = this.calculateScale(project.duration)

        // Insert the project into the database
        const { data, error } = await this.supabase
            .from('projects')
            .insert({
                ...project,
                scale,
                user_id: user.id,        // Keep for compatibility
                company_id: companyId,    // Link to company
                created_by: user.id       // Track who created it
            })
            .select()
            .single()

        if (error) throw error
        return data as Project
    }

    // FUNCTION 4: Update an existing project
    async updateProject(id: string, updates: Partial<Project>) {
        // Recalculate scale if duration changed
        const scale = updates.duration ? this.calculateScale(updates.duration) : undefined

        const { data, error } = await this.supabase
            .from('projects')
            .update({
                ...updates,
                ...(scale && { scale })
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

    // HELPER FUNCTION: Calculate project scale based on duration
    private calculateScale(duration?: number): 'Short-term' | 'Medium-term' | 'Long-term' {
        if (!duration) return 'Short-term'
        if (duration <= 3) return 'Short-term'      // 0-3 months
        if (duration <= 12) return 'Medium-term'    // 4-12 months
        return 'Long-term'                          // 13+ months
    }
}