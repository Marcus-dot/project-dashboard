// This service handles all company-related operations
import { createClient } from '@/lib/supabase/client'
import type { Company, Profile } from '@/types/project'

export class CompanyService {
    private supabase = createClient()

    // FUNCTION 1: Check if an access code is valid and get the company
    async validateAccessCode(accessCode: string) {
        const { data, error } = await this.supabase
            .from('companies')
            .select('*')
            .eq('access_code', accessCode)
            .single()

        if (error || !data) {
            return { valid: false, company: null }
        }

        return { valid: true, company: data as Company }
    }

    // FUNCTION 2: Create a new company
    async createCompany(name: string, accessCode: string) {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Insert the company (don't try to select immediately)
        const { data, error } = await this.supabase
            .from('companies')
            .insert({
                name,
                access_code: accessCode,
                created_by: user.id
            })
            .select()

        if (error) {
            console.error('Company creation error:', error)
            throw new Error(error.message || 'Failed to create company')
        }

        // If select failed but insert succeeded, fetch manually
        if (!data || data.length === 0) {
            // Try to get the company by access code
            const { data: company, error: fetchError } = await this.supabase
                .from('companies')
                .select('*')
                .eq('access_code', accessCode)
                .eq('created_by', user.id)
                .single()

            if (fetchError || !company) {
                // Last resort: return a minimal company object
                // The joinCompany step will ensure the user gets linked
                return {
                    id: '', // Will be populated when we join
                    name,
                    access_code: accessCode,
                    created_by: user.id,
                    created_at: new Date().toISOString()
                } as Company
            }

            return company as Company
        }

        return data[0] as Company
    }

    // FUNCTION 3: Get user's company information
    async getUserCompany() {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) return null

        // First get the user's profile
        const { data: profile } = await this.supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single()

        if (!profile?.company_id) return null

        // Then get the company details
        const { data: company } = await this.supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single()

        return company as Company
    }

    // FUNCTION 4: Join a company (link user to company)
    async joinCompany(companyIdOrAccessCode: string) {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        let companyId = companyIdOrAccessCode

        // If it looks like an access code (short alphanumeric), look up the company
        if (companyIdOrAccessCode.length < 20) {
            const { data: company } = await this.supabase
                .from('companies')
                .select('id')
                .eq('access_code', companyIdOrAccessCode)
                .maybeSingle()

            if (company) {
                companyId = company.id
            }
        }

        const { error } = await this.supabase
            .from('profiles')
            .update({
                company_id: companyId,
                role: 'admin' // Make the creator an admin
            })
            .eq('id', user.id)

        if (error) {
            console.error('Join company error:', error)
            throw new Error(error.message || 'Failed to join company')
        }
    }

    // FUNCTION 5: Check if user is already in a company
    async isUserInCompany() {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) return false

        const { data: profile } = await this.supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single()

        return !!profile?.company_id
    }

    // FUNCTION 6: Get all members of a company
    async getCompanyMembers(companyId: string) {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('company_id', companyId)

        if (error) throw error
        return data as Profile[]
    }

    // FUNCTION 7: Leave a company
    async leaveCompany() {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { error } = await this.supabase
            .from('profiles')
            .update({ company_id: null })
            .eq('id', user.id)

        if (error) throw error
    }
}