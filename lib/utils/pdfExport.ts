import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Project } from '@/types/project'
import { formatDateForDisplay } from './dateFilters'
import { Currency, formatCurrency } from './currency'

interface ReportData {
    companyName: string
    dateRange: {
        from: Date
        to: Date
    }
    period: string
    stats: {
        total: number
        inProgress: number
        completed: number
        planning: number
        highPriority: number
        totalBudget: number
        totalActualCosts: number
        totalNPV: number
        budgetVariance: number
        budgetVariancePercentage: string
        completionRate: string
        averageNPV: string
    }
    projects: Project[]
    currency: Currency
}

export function generatePDFReport(data: ReportData) {
    // Initialize PDF - A4 size
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20

    // ============= HEADER =============
    // Company Name
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(data.companyName, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    // Report Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.text('Project Portfolio Report', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 8

    // Date Range
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(
        `${formatDateForDisplay(data.dateRange.from)} - ${formatDateForDisplay(data.dateRange.to)}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
    )
    yPosition += 8

    // Period Label
    doc.setFontSize(9)
    doc.text(`Period: ${data.period}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    // Horizontal line
    doc.setDrawColor(200, 200, 200)
    doc.line(15, yPosition, pageWidth - 15, yPosition)
    yPosition += 10

    // ============= EXECUTIVE SUMMARY =============
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Executive Summary', 15, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // Summary stats in two columns
    const leftCol = 15
    const rightCol = pageWidth / 2 + 10

    // Left column
    doc.text(`Total Projects: ${data.stats.total}`, leftCol, yPosition)
    yPosition += 6
    doc.text(`In Progress: ${data.stats.inProgress}`, leftCol, yPosition)
    yPosition += 6
    doc.text(`Completed: ${data.stats.completed}`, leftCol, yPosition)
    yPosition += 6
    doc.text(`Completion Rate: ${data.stats.completionRate}%`, leftCol, yPosition)

    // Reset y for right column
    yPosition -= 18

    // Right column
    doc.text(`High Priority: ${data.stats.highPriority}`, rightCol, yPosition)
    yPosition += 6
    doc.text(`Planning: ${data.stats.planning}`, rightCol, yPosition)
    yPosition += 6
    doc.text(`Total Budget: ${formatCurrency(data.stats.totalBudget, data.currency)}`, rightCol, yPosition)
    yPosition += 6
    doc.text(`Actual Costs: ${formatCurrency(data.stats.totalActualCosts, data.currency)}`, rightCol, yPosition)

    yPosition += 10

    // ============= FINANCIAL OVERVIEW =============
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Financial Overview', 15, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const isOverBudget = data.stats.budgetVariance < 0
    const varianceText = `Budget Variance: ${formatCurrency(Math.abs(data.stats.budgetVariance), data.currency)} (${isOverBudget ? 'Over' : 'Under'} by ${Math.abs(parseFloat(data.stats.budgetVariancePercentage))}%)`

    if (isOverBudget) {
        doc.setTextColor(220, 38, 38) // Red
    } else {
        doc.setTextColor(22, 163, 74) // Green
    }
    doc.text(varianceText, leftCol, yPosition)
    yPosition += 6

    doc.setTextColor(0, 0, 0)
    const npvText = `Portfolio NPV: ${formatCurrency(data.stats.totalNPV, data.currency)}`
    if (data.stats.totalNPV >= 0) {
        doc.setTextColor(22, 163, 74) // Green
    } else {
        doc.setTextColor(220, 38, 38) // Red
    }
    doc.text(npvText, leftCol, yPosition)
    doc.setTextColor(0, 0, 0)
    yPosition += 6

    doc.text(`Average NPV: ${formatCurrency(parseFloat(data.stats.averageNPV), data.currency)}`, leftCol, yPosition)
    yPosition += 12

    // ============= PROJECT DETAILS TABLE =============
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Project Details', 15, yPosition)
    yPosition += 5

    // Prepare table data
    const tableData = data.projects.map(project => [
        project.name,
        project.status,
        project.priority,
        project.scale,
        formatCurrency(project.budget || 0, data.currency),
        formatCurrency(project.actual_costs || 0, data.currency),
        formatCurrency(project.npv || 0, data.currency)
    ])

    // Generate table
    autoTable(doc, {
        startY: yPosition,
        head: [['Project', 'Status', 'Priority', 'Scale', 'Budget', 'Actual', 'NPV']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [79, 70, 229], // Indigo
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: {
            fontSize: 8,
            cellPadding: 2
        },
        columnStyles: {
            0: { cellWidth: 35 }, // Project name
            1: { cellWidth: 20 }, // Status
            2: { cellWidth: 20 }, // Priority
            3: { cellWidth: 25 }, // Scale
            4: { cellWidth: 25 }, // Budget
            5: { cellWidth: 25 }, // Actual
            6: { cellWidth: 25 }  // NPV
        },
        margin: { left: 15, right: 15 },
        didParseCell: (data) => {
            // Color code NPV column
            if (data.column.index === 6 && data.section === 'body') {
                const value = parseFloat(data.cell.raw as string)
                if (!isNaN(value)) {
                    if (value >= 0) {
                        data.cell.styles.textColor = [22, 163, 74] // Green
                    } else {
                        data.cell.styles.textColor = [220, 38, 38] // Red
                    }
                }
            }
        }
    })

    // ============= FOOTER =============
    const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50

    // Add footer on last page
    const totalPages = (doc as any).getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
            `Generated on ${formatDateForDisplay(new Date())} | Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        )
        doc.text('DASHLY - Project Management Platform', pageWidth / 2, pageHeight - 6, { align: 'center' })
    }

    // ============= SAVE PDF =============
    const fileName = `${data.companyName.replace(/[^a-z0-9]/gi, '_')}_Report_${data.period}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
}