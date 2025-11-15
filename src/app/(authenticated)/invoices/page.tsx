"use client"

import { useState, useEffect } from "react"
import { Plus, FileText, Download, Edit, Trash2, Send, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InvoiceDialog } from "@/components/invoices/invoice-dialog"
import { format } from "date-fns"
import Link from "next/link"
import { formatCurrency, convertCurrency } from "@/lib/currency"

type Invoice = {
  id: string
  invoiceNumber: string
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
  issueDate: string
  dueDate: string
  paidAt: string | null
  total: number
  subtotal: number
  tax: number
  discount: number
  currency: string
  client: {
    id: string
    name: string
    company: string | null
  }
  items: any[]
  createdBy: {
    name: string | null
    email: string
  }
  createdAt: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [selectedClient, setSelectedClient] = useState<string>()
  const [userCurrency, setUserCurrency] = useState<string>("EUR")
  const [showPaidDialog, setShowPaidDialog] = useState(false)
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0])
  const [invoiceToMarkPaid, setInvoiceToMarkPaid] = useState<Invoice | null>(null)

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices")
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch("/api/user")
      if (response.ok) {
        const data = await response.json()
        setUserCurrency(data.preferredCurrency || "EUR")
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error)
    }
  }

  useEffect(() => {
    fetchInvoices()
    fetchUserPreferences()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchInvoices()
      }
    } catch (error) {
      console.error("Error deleting invoice:", error)
    }
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setIsDialogOpen(true)
  }

  const handleMarkAsPaid = (invoice: Invoice) => {
    setInvoiceToMarkPaid(invoice)
    setPaidDate(new Date().toISOString().split('T')[0])
    setShowPaidDialog(true)
  }

  const handleConfirmPaid = async () => {
    if (!invoiceToMarkPaid) return

    try {
      const response = await fetch(`/api/invoices/${invoiceToMarkPaid.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          paidAt: new Date(paidDate).toISOString(),
        }),
      })

      if (response.ok) {
        fetchInvoices()
        setShowPaidDialog(false)
        setInvoiceToMarkPaid(null)
      }
    } catch (error) {
      console.error("Error updating invoice:", error)
    }
  }

  const handleMarkAsSent = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SENT",
        }),
      })

      if (response.ok) {
        fetchInvoices()
      }
    } catch (error) {
      console.error("Error updating invoice:", error)
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingInvoice(null)
    setSelectedClient(undefined)
    fetchInvoices()
  }

  const getStatusBadge = (status: Invoice["status"]) => {
    const statusConfig = {
      DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30" },
      SENT: { label: "Sent", className: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30" },
      PAID: { label: "Paid", className: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30" },
      OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30" },
      CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30" },
    }

    const config = statusConfig[status]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  // Calculate stats - convert all amounts to user's preferred currency
  const totalRevenue = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => {
      const converted = convertCurrency(inv.total, inv.currency, userCurrency)
      return sum + converted
    }, 0)

  const pendingAmount = invoices
    .filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE")
    .reduce((sum, inv) => {
      const converted = convertCurrency(inv.total, inv.currency, userCurrency)
      return sum + converted
    }, 0)

  const draftCount = invoices.filter((inv) => inv.status === "DRAFT").length
  const overdueCount = invoices.filter((inv) => inv.status === "OVERDUE").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage and track your invoices</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(totalRevenue, userCurrency)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Payments</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(pendingAmount, userCurrency)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Draft Invoices</CardDescription>
            <CardTitle className="text-3xl">{draftCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-3xl text-red-600 dark:text-red-400">{overdueCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>A complete list of all your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices yet. Create your first invoice to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="font-medium hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.client.name}</div>
                        {invoice.client.company && (
                          <div className="text-sm text-muted-foreground">
                            {invoice.client.company}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                      {invoice.status === "OVERDUE" && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                          Overdue
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="font-medium">
                      <div>{formatCurrency(invoice.total, invoice.currency)}</div>
                      {invoice.currency !== userCurrency && (
                        <div className="text-xs text-muted-foreground">
                          ≈ {formatCurrency(convertCurrency(invoice.total, invoice.currency, userCurrency), userCurrency)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="icon" title="View">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>

                        {invoice.status === "DRAFT" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(invoice)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkAsSent(invoice)}
                              title="Mark as Sent"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkAsPaid(invoice)}
                            title="Mark as Paid"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(invoice.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InvoiceDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        invoice={editingInvoice}
        preselectedClient={selectedClient}
      />

      {/* Mark as Paid Dialog */}
      <Dialog open={showPaidDialog} onOpenChange={setShowPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
            <DialogDescription>
              Enter the date when invoice {invoiceToMarkPaid?.invoiceNumber} was paid. This helps track your cash flow accurately.
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
    </div>
  )
}
