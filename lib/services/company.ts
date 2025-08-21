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

        const { data, error } = await this.supabase
            .from('companies')
            .insert({
                name,
                access_code: accessCode,
                created_by: user.id
            })
            .select()
            .single()

        if (error) throw error
        return data as Company
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
    async joinCompany(companyId: string) {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { error } = await this.supabase
            .from('profiles')
            .update({ company_id: companyId })
            .eq('id', user.id)

        if (error) throw error
        return true
    }

    // FUNCTION 5: Get all users in the company
    async getCompanyMembers() {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) return []

        // Get user's company_id from profile
        const { data: profile } = await this.supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single()

        if (!profile?.company_id) return []

        // Get all profiles in the same company
        const { data: members } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('company_id', profile.company_id)

        return members as Profile[]
    }

    // FUNCTION 6: Check if user is in a company
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
}