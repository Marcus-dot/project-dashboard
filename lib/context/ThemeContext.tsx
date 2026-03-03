'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
    actualTheme: 'light' | 'dark' // What's actually being displayed
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system')
    const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')

    // Initialize theme from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('theme') as Theme | null
        if (stored) {
            setThemeState(stored)
        }
    }, [])

    // Update actualTheme based on theme and system preference
    useEffect(() => {
        const root = window.document.documentElement

        const updateTheme = () => {
            let newActualTheme: 'light' | 'dark' = 'light'

            if (theme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                newActualTheme = systemTheme
            } else {
                newActualTheme = theme
            }

            // Update DOM
            root.classList.remove('light', 'dark')
            root.classList.add(newActualTheme)
            setActualTheme(newActualTheme)
        }

        updateTheme()

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => {
            if (theme === 'system') {
                updateTheme()
            }
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [theme])

    const setTheme = (newTheme: Theme) => {
        localStorage.setItem('theme', newTheme)
        setThemeState(newTheme)
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}