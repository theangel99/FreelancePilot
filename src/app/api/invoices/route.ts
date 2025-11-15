import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive(),
  unitPrice: z.number(),
  amount: z.number(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
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
})

// GET /api/invoices - List all invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's first workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    const invoices = await prisma.invoice.findMany({
      where: { workspaceId: workspaceMember.workspaceId },
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
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = invoiceSchema.parse(body)

    // Get user's first workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    // Get or create company settings to generate invoice number
    let companySettings = await prisma.companySettings.findUnique({
      where: { workspaceId: workspaceMember.workspaceId },
    })

    if (!companySettings) {
      // Create default company settings
      companySettings = await prisma.companySettings.create({
        data: {
          workspaceId: workspaceMember.workspaceId,
          companyName: workspaceMember.workspace.name,
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

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        workspaceId: workspaceMember.workspaceId,
        clientId: validatedData.clientId,
        createdById: session.user.id,
        invoiceNumber,
        issueDate: new Date(validatedData.issueDate),
        dueDate: new Date(validatedData.dueDate),
        subtotal,
        tax,
        taxRate,
        discount,
        total,
        notes: validatedData.notes,
        terms: validatedData.terms || companySettings.defaultTerms,
        status: "DRAFT",
        items: {
          create: validatedData.items,
        },
      },
      include: {
        client: true,
        items: true,
      },
    })

    // Update next invoice number
    await prisma.companySettings.update({
      where: { workspaceId: workspaceMember.workspaceId },
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
