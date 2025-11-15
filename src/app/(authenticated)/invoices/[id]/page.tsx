"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Download, Edit, Send, CheckCircle, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import Link from "next/link"
import { downloadInvoicePDF } from "@/lib/pdf"
import { formatCurrency } from "@/lib/currency"

type InvoiceData = {
  invoice: {
    id: string
    invoiceNumber: string
    status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
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
      id: string
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
      id: string
      description: string
      quantity: number
      unitPrice: number
      amount: number
    }>
    createdBy: {
      name: string | null
      email: string
    }
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

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<InvoiceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPaidDialog, setShowPaidDialog] = useState(false)
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${params.id}`)
        if (response.ok) {
          const invoiceData = await response.json()
          setData(invoiceData)
        } else if (response.status === 404) {
          router.push("/invoices")
        }
      } catch (error) {
        console.error("Error fetching invoice:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchInvoice()
    }
  }, [params.id, router])

  const handleMarkAsPaid = () => {
    setPaidDate(new Date().toISOString().split('T')[0])
    setShowPaidDialog(true)
  }

  const handleConfirmPaid = async () => {
    if (!data) return

    try {
      const response = await fetch(`/api/invoices/${data.invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          paidAt: new Date(paidDate).toISOString(),
        }),
      })

      if (response.ok) {
        const updatedData = await response.json()
        setData({ ...data, invoice: updatedData })
        setShowPaidDialog(false)
      }
    } catch (error) {
      console.error("Error updating invoice:", error)
    }
  }

  const handleMarkAsSent = async () => {
    if (!data) return

    try {
      const response = await fetch(`/api/invoices/${data.invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SENT",
        }),
      })

      if (response.ok) {
        const updatedData = await response.json()
        setData({ ...data, invoice: updatedData })
      }
    } catch (error) {
      console.error("Error updating invoice:", error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    if (!data) return
    downloadInvoicePDF(data)
  }

  const getStatusBadge = (status: InvoiceData["invoice"]["status"]) => {
    const statusConfig = {
      DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      SENT: { label: "Sent", className: "bg-blue-100 text-blue-800" },
      PAID: { label: "Paid", className: "bg-green-100 text-green-800" },
      OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-800" },
      CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-800" },
    }

    const config = statusConfig[status]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading invoice...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Invoice not found</div>
      </div>
    )
  }

  const { invoice, companySettings } = data

  return (
    <>
      {/* Mark as Paid Dialog */}
      <Dialog open={showPaidDialog} onOpenChange={setShowPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
            <DialogDescription>
              Enter the date when this invoice was paid. This helps track your cash flow accurately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paidDate">Paid Date</Label>
              <Input
                id="paidDate"
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              <p className="text-sm text-muted-foreground">
                This date will be used for revenue tracking in your dashboard.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaidDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPaid}>
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 print:space-y-0">
        {/* Actions Bar - Hidden when printing */}
        <div className="flex justify-between items-center print:hidden">
        <Link href="/invoices">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
        <div className="flex gap-2">
          {invoice.status === "DRAFT" && (
            <Button onClick={handleMarkAsSent} variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Mark as Sent
            </Button>
          )}
          {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
            <Button onClick={handleMarkAsPaid} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          )}
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <Card className="max-w-4xl mx-auto print:max-w-none print:mx-0 invoice-print-container">
        <CardContent className="p-12">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
              <div className="text-lg">{invoice.invoiceNumber}</div>
              <div className="mt-2">{getStatusBadge(invoice.status)}</div>
            </div>
            {companySettings && (
              <div className="text-right">
                <div className="font-bold text-xl mb-2">{companySettings.companyName}</div>
                {companySettings.address && <div>{companySettings.address}</div>}
                {(companySettings.city || companySettings.state || companySettings.zipCode) && (
                  <div>
                    {companySettings.city && `${companySettings.city}, `}
                    {companySettings.state && `${companySettings.state} `}
                    {companySettings.zipCode}
                  </div>
                )}
                {companySettings.country && <div>{companySettings.country}</div>}
                {companySettings.email && <div className="mt-2">{companySettings.email}</div>}
                {companySettings.phone && <div>{companySettings.phone}</div>}
                {companySettings.website && <div>{companySettings.website}</div>}
                {companySettings.taxId && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Tax ID: {companySettings.taxId}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator className="my-8" />

          {/* Bill To & Dates */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <div className="font-semibold text-sm text-muted-foreground mb-2">BILL TO</div>
              <div className="font-bold text-lg">{invoice.client.name}</div>
              {invoice.client.company && <div>{invoice.client.company}</div>}
              {invoice.client.address && <div className="mt-2">{invoice.client.address}</div>}
              {(invoice.client.city || invoice.client.state || invoice.client.zipCode) && (
                <div>
                  {invoice.client.city && `${invoice.client.city}, `}
                  {invoice.client.state && `${invoice.client.state} `}
                  {invoice.client.zipCode}
                </div>
              )}
              {invoice.client.country && <div>{invoice.client.country}</div>}
              {invoice.client.email && <div className="mt-2">{invoice.client.email}</div>}
            </div>
            <div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-sm text-muted-foreground">ISSUE DATE:</span>
                  <span>{format(new Date(invoice.issueDate), "MMMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-sm text-muted-foreground">DUE DATE:</span>
                  <span>{format(new Date(invoice.dueDate), "MMMM d, yyyy")}</span>
                </div>
                {invoice.paidAt && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-sm text-muted-foreground">PAID DATE:</span>
                    <span className="text-green-600">
                      {format(new Date(invoice.paidAt), "MMMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 font-semibold">DESCRIPTION</th>
                  <th className="text-right py-3 font-semibold">QTY</th>
                  <th className="text-right py-3 font-semibold">RATE</th>
                  <th className="text-right py-3 font-semibold">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-3">{item.description}</td>
                    <td className="text-right py-3">{item.quantity}</td>
                    <td className="text-right py-3">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                    <td className="text-right py-3">{formatCurrency(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(invoice.discount, invoice.currency)}</span>
                </div>
              )}
              {invoice.taxRate > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({invoice.taxRate}%):</span>
                  <span>{formatCurrency(invoice.tax, invoice.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
              {invoice.status === "PAID" && invoice.paidAt && (
                <div className="text-center py-2 bg-green-50 text-green-700 font-semibold rounded">
                  PAID
                </div>
              )}
            </div>
          </div>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <>
              <Separator className="my-8" />
              <div className="grid grid-cols-2 gap-8">
                {invoice.notes && (
                  <div>
                    <div className="font-semibold text-sm text-muted-foreground mb-2">NOTES</div>
                    <div className="text-sm whitespace-pre-wrap">{invoice.notes}</div>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <div className="font-semibold text-sm text-muted-foreground mb-2">
                      PAYMENT TERMS
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{invoice.terms}</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-muted-foreground">
            Thank you for your business!
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  )
}
