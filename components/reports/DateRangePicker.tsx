'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { TimePeriod, DateRange, getDateRangeForPeriod, getPeriodLabel } from '@/lib/utils/dateFilters'
import { Calendar } from 'lucide-react'

interface DateRangePickerProps {
    onDateRangeChange: (range: DateRange) => void
    onPeriodChange: (period: TimePeriod) => void
}

export function DateRangePicker({ onDateRangeChange, onPeriodChange }: DateRangePickerProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('this_month')
    const [customRange, setCustomRange] = useState<DateRange>(() => getDateRangeForPeriod('this_month'))
    const [showCustomPicker, setShowCustomPicker] = useState(false)

    const periods: TimePeriod[] = [
        'this_week',
        'last_week',
        'this_month',
        'last_month',
        'this_quarter',
        'last_quarter',
        'this_year'
    ]

    const handlePeriodClick = (period: TimePeriod) => {
        setSelectedPeriod(period)
        setShowCustomPicker(false)

        const range = getDateRangeForPeriod(period)
        setCustomRange(range)
        onDateRangeChange(range)
        onPeriodChange(period)
    }

    const handleCustomClick = () => {
        setSelectedPeriod('custom')
        setShowCustomPicker(true)
        onPeriodChange('custom')
    }

    const handleCustomDateChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates
        if (start && end) {
            const range = { from: start, to: end }
            setCustomRange(range)
            onDateRangeChange(range)
        }
    }

    return (
        <div className="space-y-4">
            {/* Period Buttons */}
            <div className="flex flex-wrap gap-2">
                {periods.map(period => (
                    <button
                        key={period}
                        onClick={() => handlePeriodClick(period)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedPeriod === period
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {getPeriodLabel(period)}
                    </button>
                ))}

                {/* Custom Range Button */}
                <button
                    onClick={handleCustomClick}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${selectedPeriod === 'custom'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <Calendar className="w-4 h-4" />
                    Custom Range
                </button>
            </div>

            {/* Custom Date Picker */}
            {showCustomPicker && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Custom Date Range
                    </label>
                    <DatePicker
                        selectsRange
                        startDate={customRange.from}
                        endDate={customRange.to}
                        onChange={handleCustomDateChange}
                        inline
                        className="w-full"
                    />
                    <div className="mt-3 text-sm text-gray-600">
                        Selected: {getPeriodLabel('custom', customRange)}
                    </div>
                </div>
            )}

            {/* Current Selection Display */}
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="text-sm text-indigo-600 font-medium">
                    Viewing: {getPeriodLabel(selectedPeriod, selectedPeriod === 'custom' ? customRange : undefined)}
                </div>
            </div>
        </div>
    )
}