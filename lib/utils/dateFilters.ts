import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfQuarter,
    endOfQuarter,
    startOfYear,
    endOfYear,
    subDays,
    subMonths,
    isWithinInterval,
    format,
    parseISO
} from 'date-fns'
import { Project } from '@/types/project'

export type TimePeriod = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'custom'

export interface DateRange {
    from: Date
    to: Date
}

// Get date range for a specific time period
export function getDateRangeForPeriod(period: TimePeriod): DateRange {
    const now = new Date()

    switch (period) {
        case 'this_week':
            return {
                from: startOfWeek(now, { weekStartsOn: 1 }), // Monday
                to: endOfWeek(now, { weekStartsOn: 1 })
            }

        case 'last_week': {
            const lastWeekDate = subDays(now, 7)
            return {
                from: startOfWeek(lastWeekDate, { weekStartsOn: 1 }),
                to: endOfWeek(lastWeekDate, { weekStartsOn: 1 })
            }
        }

        case 'this_month':
            return {
                from: startOfMonth(now),
                to: endOfMonth(now)
            }

        case 'last_month': {
            const lastMonth = subMonths(now, 1)
            return {
                from: startOfMonth(lastMonth),
                to: endOfMonth(lastMonth)
            }
        }

        case 'this_quarter':
            return {
                from: startOfQuarter(now),
                to: endOfQuarter(now)
            }

        case 'last_quarter': {
            const lastQuarter = subMonths(now, 3)
            return {
                from: startOfQuarter(lastQuarter),
                to: endOfQuarter(lastQuarter)
            }
        }

        case 'this_year':
            return {
                from: startOfYear(now),
                to: endOfYear(now)
            }

        default:
            return {
                from: startOfMonth(now),
                to: endOfMonth(now)
            }
    }
}

// Filter projects by date range
export function filterProjectsByDateRange(
    projects: Project[],
    dateRange: DateRange
): Project[] {
    return projects.filter(project => {
        // Check if project has a start_date
        if (!project.start_date) return false

        try {
            const projectDate = parseISO(project.start_date)

            return isWithinInterval(projectDate, {
                start: dateRange.from,
                end: dateRange.to
            })
        } catch (error) {
            console.error('Error parsing date:', error)
            return false
        }
    })
}

// Calculate statistics for filtered projects
export function calculatePeriodStats(projects: Project[]) {
    const total = projects.length
    const inProgress = projects.filter(p => p.status === 'In progress').length
    const completed = projects.filter(p => p.status === 'Complete').length
    const planning = projects.filter(p => p.status === 'Planning').length
    const highPriority = projects.filter(p => p.priority === 'High').length

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    const totalActualCosts = projects.reduce((sum, p) => sum + (p.actual_costs || 0), 0)
    const totalNPV = projects.reduce((sum, p) => sum + (p.npv || 0), 0)

    // Calculate budget variance
    const budgetVariance = totalBudget - totalActualCosts
    const budgetVariancePercentage = totalBudget > 0
        ? ((budgetVariance / totalBudget) * 100).toFixed(1)
        : '0'

    return {
        total,
        inProgress,
        completed,
        planning,
        highPriority,
        totalBudget,
        totalActualCosts,
        totalNPV,
        budgetVariance,
        budgetVariancePercentage,
        // Additional metrics
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0',
        averageNPV: total > 0 ? (totalNPV / total).toFixed(0) : '0',
    }
}

// Format date for display
export function formatDateForDisplay(date: Date): string {
    return format(date, 'MMM dd, yyyy')
}

// Get period label for display
export function getPeriodLabel(period: TimePeriod, customRange?: DateRange): string {
    if (period === 'custom' && customRange) {
        return `${formatDateForDisplay(customRange.from)} - ${formatDateForDisplay(customRange.to)}`
    }

    const labels: Record<TimePeriod, string> = {
        this_week: 'This Week',
        last_week: 'Last Week',
        this_month: 'This Month',
        last_month: 'Last Month',
        this_quarter: 'This Quarter',
        last_quarter: 'Last Quarter',
        this_year: 'This Year',
        custom: 'Custom Range'
    }

    return labels[period]
}