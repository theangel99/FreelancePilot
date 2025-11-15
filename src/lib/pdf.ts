import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { formatCurrency } from "./currency"

type InvoiceData = {
  invoice: {
    invoiceNumber: string
    status: string
    issueDate: string
    dueDate: string
    paidAt: string | null
    total: number
    subtotal: number
    tax: number
    taxRate: number
    discount: number
    currency: string
    notes: string | null
    terms: string | null
    client: {
      name: string
      email: string
      company: string | null
      address: string | null
      city: string | null
      state: string | null
      zipCode: string | null
      country: string | null
    }
    items: Array<{
      description: string
      quantity: number
      unitPrice: number
      amount: number
    }>
  }
  companySettings: {
    companyName: string
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    zipCode: string | null
    country: string | null
    website: string | null
    taxId: string | null
  } | null
}

export function generateInvoicePDF(data: InvoiceData) {
  const { invoice, companySettings } = data
  const doc = new jsPDF()

  // Set font
  doc.setFont("helvetica")

  // Header - Company Info
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("INVOICE", 20, 20)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(invoice.invoiceNumber, 20, 28)

  // Company Details (Right side)
  if (companySettings) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(companySettings.companyName, 200, 20, { align: "right" })

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    let yPos = 26
    if (companySettings.address) {
      doc.text(companySettings.address, 200, yPos, { align: "right" })
      yPos += 5
    }
    if (companySettings.city || companySettings.state || companySettings.zipCode) {
      const cityLine = [
        companySettings.city,
        companySettings.state,
        companySettings.zipCode,
      ]
        .filter(Boolean)
        .join(", ")
      doc.text(cityLine, 200, yPos, { align: "right" })
      yPos += 5
    }
    if (companySettings.country) {
      doc.text(companySettings.country, 200, yPos, { align: "right" })
      yPos += 5
    }
    if (companySettings.email) {
      doc.text(companySettings.email, 200, yPos, { align: "right" })
      yPos += 5
    }
    if (companySettings.phone) {
      doc.text(companySettings.phone, 200, yPos, { align: "right" })
      yPos += 5
    }
    if (companySettings.website) {
      doc.text(companySettings.website, 200, yPos, { align: "right" })
      yPos += 5
    }
    if (companySettings.taxId) {
      doc.setFontSize(8)
      doc.text(`Tax ID: ${companySettings.taxId}`, 200, yPos, { align: "right" })
    }
  }

  // Line separator
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 45, 190, 45)

  // Bill To & Dates Section
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("BILL TO", 20, 55)

  doc.setFont("helvetica", "normal")
  let billToY = 61
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(invoice.client.name, 20, billToY)
  billToY += 5

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  if (invoice.client.company) {
    doc.text(invoice.client.company, 20, billToY)
    billToY += 5
  }
  if (invoice.client.address) {
    doc.text(invoice.client.address, 20, billToY)
    billToY += 5
  }
  if (invoice.client.city || invoice.client.state || invoice.client.zipCode) {
    const cityLine = [invoice.client.city, invoice.client.state, invoice.client.zipCode]
      .filter(Boolean)
      .join(", ")
    doc.text(cityLine, 20, billToY)
    billToY += 5
  }
  if (invoice.client.country) {
    doc.text(invoice.client.country, 20, billToY)
    billToY += 5
  }
  if (invoice.client.email) {
    doc.text(invoice.client.email, 20, billToY)
    billToY += 5
  }

  // Dates (Right side)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("ISSUE DATE:", 120, 55)
  doc.setFont("helvetica", "normal")
  doc.text(format(new Date(invoice.issueDate), "MMMM d, yyyy"), 200, 55, { align: "right" })

  doc.setFont("helvetica", "bold")
  doc.text("DUE DATE:", 120, 61)
  doc.setFont("helvetica", "normal")
  doc.text(format(new Date(invoice.dueDate), "MMMM d, yyyy"), 200, 61, { align: "right" })

  if (invoice.paidAt) {
    doc.setFont("helvetica", "bold")
    doc.text("PAID DATE:", 120, 67)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 128, 0)
    doc.text(format(new Date(invoice.paidAt), "MMMM d, yyyy"), 200, 67, { align: "right" })
    doc.setTextColor(0, 0, 0)
  }

  // Status Badge
  const statusY = invoice.paidAt ? 73 : 67
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  if (invoice.status === "PAID") {
    doc.setFillColor(220, 252, 231)
    doc.setTextColor(22, 101, 52)
  } else if (invoice.status === "SENT") {
    doc.setFillColor(219, 234, 254)
    doc.setTextColor(30, 64, 175)
  } else if (invoice.status === "OVERDUE") {
    doc.setFillColor(254, 226, 226)
    doc.setTextColor(153, 27, 27)
  } else {
    doc.setFillColor(243, 244, 246)
    doc.setTextColor(75, 85, 99)
  }
  doc.roundedRect(120, statusY - 4, 20, 6, 2, 2, "F")
  doc.text(invoice.status, 130, statusY, { align: "center" })
  doc.setTextColor(0, 0, 0)

  // Line Items Table
  const tableStartY = Math.max(billToY + 10, statusY + 15)

  const tableData = invoice.items.map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice, invoice.currency),
    formatCurrency(item.amount, invoice.currency),
  ])

  autoTable(doc, {
    startY: tableStartY,
    head: [["DESCRIPTION", "QTY", "RATE", "AMOUNT"]],
    body: tableData,
    theme: "plain",
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineWidth: 0.5,
      lineColor: [150, 150, 150],
    },
    styles: {
      fontSize: 9,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: "right", cellWidth: 25 },
      2: { halign: "right", cellWidth: 30 },
      3: { halign: "right", cellWidth: 35 },
    },
  })

  // Get the Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 50

  // Totals
  const totalsX = 130
  let totalsY = finalY + 10

  doc.setFontSize(9)
  doc.text("Subtotal:", totalsX, totalsY)
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), 200, totalsY, { align: "right" })
  totalsY += 6

  if (invoice.discount > 0) {
    doc.setTextColor(220, 38, 38)
    doc.text("Discount:", totalsX, totalsY)
    doc.text(`-${formatCurrency(invoice.discount, invoice.currency)}`, 200, totalsY, { align: "right" })
    doc.setTextColor(0, 0, 0)
    totalsY += 6
  }

  if (invoice.taxRate > 0) {
    doc.text(`Tax (${invoice.taxRate}%):`, totalsX, totalsY)
    doc.text(formatCurrency(invoice.tax, invoice.currency), 200, totalsY, { align: "right" })
    totalsY += 6
  }

  // Line before total
  doc.setDrawColor(200, 200, 200)
  doc.line(totalsX, totalsY, 200, totalsY)
  totalsY += 6

  // Total
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Total:", totalsX, totalsY)
  doc.text(formatCurrency(invoice.total, invoice.currency), 200, totalsY, { align: "right" })

  // PAID stamp if applicable
  if (invoice.status === "PAID" && invoice.paidAt) {
    totalsY += 10
    doc.setFillColor(220, 252, 231)
    doc.setTextColor(22, 101, 52)
    doc.setFontSize(11)
    doc.roundedRect(totalsX, totalsY - 6, 70, 10, 2, 2, "F")
    doc.text("PAID", totalsX + 35, totalsY, { align: "center" })
    doc.setTextColor(0, 0, 0)
  }

  // Notes and Terms
  totalsY += 20
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)

  if (invoice.notes || invoice.terms) {
    doc.setDrawColor(200, 200, 200)
    doc.line(20, totalsY - 5, 190, totalsY - 5)

    const notesX = 20
    const termsX = 110

    if (invoice.notes) {
      doc.setFont("helvetica", "bold")
      doc.text("NOTES", notesX, totalsY)
      doc.setFont("helvetica", "normal")
      const noteLines = doc.splitTextToSize(invoice.notes, 80)
      doc.text(noteLines, notesX, totalsY + 5)
    }

    if (invoice.terms) {
      doc.setFont("helvetica", "bold")
      doc.text("PAYMENT TERMS", termsX, totalsY)
      doc.setFont("helvetica", "normal")
      const termLines = doc.splitTextToSize(invoice.terms, 80)
      doc.text(termLines, termsX, totalsY + 5)
    }
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text("Thank you for your business!", 105, 280, { align: "center" })

  return doc
}

export function downloadInvoicePDF(data: InvoiceData) {
  const doc = generateInvoicePDF(data)
  doc.save(`${data.invoice.invoiceNumber}.pdf`)
}
