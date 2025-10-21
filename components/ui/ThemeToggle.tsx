'use client'

import { useTheme } from '@/lib/context/ThemeContext'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
    const { theme, setTheme, actualTheme } = useTheme()

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark')
        else if (theme === 'dark') setTheme('system')
        else setTheme('light')
    }

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={cycleTheme}
            title={`Theme: ${theme === 'system' ? `System (${actualTheme})` : theme}`}
        >
            {theme === 'light' && <Sun className="h-4 w-4" />}
            {theme === 'dark' && <Moon className="h-4 w-4" />}
            {theme === 'system' && <Monitor className="h-4 w-4" />}
        </Button>
    )
}