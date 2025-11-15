"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Clock } from "lucide-react"
import { format } from "date-fns"

type InvoiceItem = {
  description: string
  quantity: number
  unitPrice: number
  amount: number
  projectId?: string
  taskId?: string
}

type InvoiceDialogProps = {
  open: boolean
  onClose: () => void
  invoice?: any
  preselectedClient?: string
}

export function InvoiceDialog({ open, onClose, invoice, preselectedClient }: InvoiceDialogProps) {
  const [clients, setClients] = useState<any[]>([])
  const [unbilledTime, setUnbilledTime] = useState<any[]>([])
  const [formData, setFormData] = useState({
    clientId: preselectedClient || "",
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    notes: "",
    terms: "",
    taxRate: 0,
    discount: 0,
  })
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0, amount: 0 },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showTimeImport, setShowTimeImport] = useState(false)

  useEffect(() => {
    // Fetch clients
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients")
        if (response.ok) {
          const data = await response.json()
          setClients(data)
        }
      } catch (error) {
        console.error("Error fetching clients:", error)
      }
    }
    fetchClients()
  }, [])

  useEffect(() => {
    if (formData.clientId) {
      // Fetch unbilled time entries for selected client
      const fetchUnbilledTime = async () => {
        try {
          const response = await fetch(`/api/time-entries?unbilled=true&clientId=${formData.clientId}`)
          if (response.ok) {
            const data = await response.json()
            setUnbilledTime(data)
          }
        } catch (error) {
          console.error("Error fetching unbilled time:", error)
        }
      }
      fetchUnbilledTime()
    }
  }, [formData.clientId])

  useEffect(() => {
    if (invoice) {
      setFormData({
        clientId: invoice.clientId || "",
        issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : "",
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : "",
        notes: invoice.notes || "",
        terms: invoice.terms || "",
        taxRate: invoice.taxRate || 0,
        discount: invoice.discount || 0,
      })
      if (invoice.items) {
        setItems(invoice.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          projectId: item.projectId,
          taskId: item.taskId,
        })))
      }
    } else {
      setFormData({
        clientId: preselectedClient || "",
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "",
        terms: "Payment is due within 30 days",
        taxRate: 0,
        discount: 0,
      })
      setItems([{ description: "", quantity: 1, unitPrice: 0, amount: 0 }])
    }
  }, [invoice, preselectedClient, open])

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, amount: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Recalculate amount
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice
    }

    setItems(newItems)
  }

  const importTimeEntries = () => {
    const timeItems: InvoiceItem[] = unbilledTime.map((entry) => {
      const hours = entry.duration / 3600
      return {
        description: `${entry.project?.name || "Time Entry"} - ${entry.description || format(new Date(entry.startTime), "MMM d, yyyy")}`,
        quantity: parseFloat(hours.toFixed(2)),
        unitPrice: entry.hourlyRate,
        amount: parseFloat((hours * entry.hourlyRate).toFixed(2)),
        projectId: entry.projectId,
        taskId: entry.taskId,
      }
    })
    setItems([...items, ...timeItems])
    setShowTimeImport(false)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0)
  }

  const calculateTax = () => {
    const subtotal = calculateSubtotal()
    return (subtotal - formData.discount) * (formData.taxRate / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - formData.discount + calculateTax()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const url = invoice ? `/api/invoices/${invoice.id}` : "/api/invoices"
      const method = invoice ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Something went wrong")
        return
      }

      onClose()
    } catch (error) {
      setError("Failed to save invoice")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>
            {invoice ? "Update invoice details" : "Fill in the details to create a new invoice"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Client and Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client *</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.company && `(${client.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date *</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Line Items</h3>
              <div className="flex gap-2">
                {unbilledTime.length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowTimeImport(!showTimeImport)}>
                    <Clock className="h-4 w-4 mr-2" />
                    Import Time ({unbilledTime.length})
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            {showTimeImport && unbilledTime.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-md space-y-2">
                <p className="text-sm font-medium">
                  Found {unbilledTime.length} unbilled time {unbilledTime.length === 1 ? "entry" : "entries"} ({(unbilledTime.reduce((sum, e) => sum + e.duration, 0) / 3600).toFixed(2)}h total)
                </p>
                <Button type="button" onClick={importTimeEntries} size="sm">
                  Import All Time Entries
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={item.amount.toFixed(2)}
                      disabled
                    />
                  </div>
                  <div className="col-span-1">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount ($)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount:</span>
                  <span>-${formData.discount.toFixed(2)}</span>
                </div>
              )}
              {formData.taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax ({formData.taxRate}%):</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes for the client..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms">Payment Terms</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                rows={3}
                placeholder="Payment terms and conditions..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
