import { NextRequest, NextResponse } from "next/server"
import { requireWorkspace } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive(),
  unitPrice: z.number(),
  amount: z.number(),
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
})

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  issueDate: z.string(),
  dueDate: z.string(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  taxRate: z.number().optional(),
  discount: z.number().optional(),
  currency: z.string().min(1, "Currency is required"),
})

// GET /api/invoices - List all invoices
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace()

    // First, automatically update overdue invoices
    const now = new Date()
    await prisma.invoice.updateMany({
      where: {
        workspaceId,
        status: "SENT",
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: "OVERDUE",
      },
    })

    const invoices = await prisma.invoice.findMany({
      where: { workspaceId },
      include: {
        client: true,
        items: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId } = await requireWorkspace()
    const body = await request.json()
    console.log("Invoice creation request body:", JSON.stringify(body, null, 2))
    const validatedData = invoiceSchema.parse(body)

    // Get or create company settings to generate invoice number
    let companySettings = await prisma.companySettings.findUnique({
      where: { workspaceId },
    })

    if (!companySettings) {
      // Get workspace name for default settings
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      })

      // Create default company settings
      companySettings = await prisma.companySettings.create({
        data: {
          workspaceId,
          companyName: workspace?.name || "My Company",
          invoicePrefix: "INV",
          nextInvoiceNumber: 1,
        },
      })
    }

    // Generate invoice number
    const invoiceNumber = `${companySettings.invoicePrefix}-${companySettings.nextInvoiceNumber.toString().padStart(4, '0')}`

    // Calculate totals
    const subtotal = validatedData.items.reduce((sum, item) => sum + item.amount, 0)
    const taxRate = validatedData.taxRate || companySettings.defaultTaxRate
    const discount = validatedData.discount || 0
    const tax = (subtotal - discount) * (taxRate / 100)
    const total = subtotal - discount + tax

    // Clean up items - convert null to undefined for optional fields
    const cleanedItems = validatedData.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      ...(item.projectId && { projectId: item.projectId }),
      ...(item.taskId && { taskId: item.taskId }),
    }))

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        workspaceId,
        clientId: validatedData.clientId,
        createdById: userId,
        invoiceNumber,
        issueDate: new Date(validatedData.issueDate),
        dueDate: new Date(validatedData.dueDate),
        subtotal,
        tax,
        taxRate,
        discount,
        total,
        currency: validatedData.currency,
        notes: validatedData.notes,
        terms: validatedData.terms || companySettings.defaultTerms,
        status: "DRAFT",
        items: {
          create: cleanedItems,
        },
      },
      include: {
        client: true,
        items: true,
      },
    })

    // Update next invoice number
    await prisma.companySettings.update({
      where: { workspaceId },
      data: { nextInvoiceNumber: companySettings.nextInvoiceNumber + 1 },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
