// This service handles all project-related operations
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types/project'

export class ProjectService {
    // Create a Supabase client instance
    private supabase = createClient()

    // FUNCTION 1: Get all projects for the current user
    async getProjects() {
        const { data, error } = await this.supabase
            .from('projects')           // From the projects table
            .select('*')                 // Select all columns
            .order('created_at', { ascending: false })  // Newest first

        if (error) throw error
        return data as Project[]
    }

    // FUNCTION 2: Get a single project by ID
    async getProject(id: string) {
        const { data, error } = await this.supabase
            .from('projects')
            .select('*')
            .eq('id', id)                // Where id equals the provided id
            .single()                    // Expect one result...

        if (error) throw error
        return data as Project
    }

    // FUNCTION 3: Create a new project
    async createProject(project: Partial<Project>) {
        // First, get the current user
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Calculate the scale based on duration
        const scale = this.calculateScale(project.duration)

        // Insert the project into the database
        const { data, error } = await this.supabase
            .from('projects')
            .insert({
                ...project,               // Spread all project properties
                scale,                    // Add calculated scale
                user_id: user.id          // Add current user's ID
            })
            .select()                   // Return the created project
            .single()                   // Expect one result

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
                ...updates,               // Spread the updates
                ...(scale && { scale })   // Add scale if it exists
            })
            .eq('id', id)               // Where id equals the provided id
            .select()                   // Return the updated project
            .single()                   // Expect one result

        if (error) throw error
        return data as Project
    }

    // FUNCTION 5: Delete a project
    async deleteProject(id: string) {
        const { error } = await this.supabase
            .from('projects')
            .delete()                   // Delete the row
            .eq('id', id)               // Where id equals the provided id

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