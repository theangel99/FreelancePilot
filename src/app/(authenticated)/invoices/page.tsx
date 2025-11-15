"use client"

import { useState, useEffect } from "react"
import { Plus, FileText, Download, Edit, Trash2, Send, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { InvoiceDialog } from "@/components/invoices/invoice-dialog"
import { format } from "date-fns"
import Link from "next/link"

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

  useEffect(() => {
    fetchInvoices()
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

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          paidAt: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        fetchInvoices()
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
      DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      SENT: { label: "Sent", className: "bg-blue-100 text-blue-800" },
      PAID: { label: "Paid", className: "bg-green-100 text-green-800" },
      OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-800" },
      CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-800" },
    }

    const config = statusConfig[status]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  // Calculate stats
  const totalRevenue = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.total, 0)

  const pendingAmount = invoices
    .filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE")
    .reduce((sum, inv) => sum + inv.total, 0)

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
            <CardTitle className="text-3xl">${totalRevenue.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Payments</CardDescription>
            <CardTitle className="text-3xl">${pendingAmount.toFixed(2)}</CardTitle>
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
            <CardTitle className="text-3xl text-red-600">{overdueCount}</CardTitle>
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
                        <div className="text-xs text-red-600 mt-1">
                          Overdue
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="font-medium">
                      ${invoice.total.toFixed(2)}
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
    </div>
  )
}
