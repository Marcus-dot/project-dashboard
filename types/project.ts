// Define the structure of our data - like a blueprint!

// These are the only values allowed for priority
export type Priority = 'High' | 'Medium' | 'Low'

// These are the only values allowed for status
export type Status = 'Planning' | 'In progress' | 'Complete' | 'Paused' | 'Cancelled'

// These are the only values allowed for scale
export type Scale = 'Short-term' | 'Medium-term' | 'Long-term'

// This defines what a Project object looks like
export interface Project {
    id: string                    // Unique identifier
    created_at: string            // When it was created
    updated_at: string            // When it was last modified
    name: string                  // Project name (required)
    owner?: string                // Who owns it (? means optional)
    details?: string              // Project details
    duration?: number             // How many months
    start_date?: string           // Start date
    priority: Priority            // High/Medium/Low
    status: Status                // Planning/In progress/etc
    scale: Scale                  // Short/Medium/Long-term
    notes?: string                // Additional notes
    user_id: string              // Which user owns this project
}