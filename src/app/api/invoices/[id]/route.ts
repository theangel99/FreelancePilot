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

const invoiceUpdateSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(invoiceItemSchema).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  taxRate: z.number().optional(),
  discount: z.number().optional(),
  currency: z.string().optional(),
  paidAt: z.string().optional(),
})

// GET /api/invoices/[id] - Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    // First, automatically update overdue invoices
    const now = new Date()
    await prisma.invoice.updateMany({
      where: {
        workspaceId: workspaceMember.workspaceId,
        status: "SENT",
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: "OVERDUE",
      },
    })

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        workspaceId: workspaceMember.workspaceId,
      },
      include: {
        client: true,
        items: {
          include: {
            project: true,
            task: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Also get company settings for invoice template
    const companySettings = await prisma.companySettings.findUnique({
      where: { workspaceId: workspaceMember.workspaceId },
    })

    return NextResponse.json({ invoice, companySettings })
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = invoiceUpdateSchema.parse(body)

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    // Verify invoice belongs to user's workspace
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        workspaceId: workspaceMember.workspaceId,
      },
      include: {
        items: true,
      },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.issueDate) updateData.issueDate = new Date(validatedData.issueDate)
    if (validatedData.dueDate) updateData.dueDate = new Date(validatedData.dueDate)
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.terms !== undefined) updateData.terms = validatedData.terms
    if (validatedData.currency) updateData.currency = validatedData.currency
    if (validatedData.paidAt) updateData.paidAt = new Date(validatedData.paidAt)

    // If items are updated, recalculate totals
    if (validatedData.items) {
      // Delete existing items and create new ones
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      })

      const subtotal = validatedData.items.reduce((sum, item) => sum + item.amount, 0)
      const taxRate = validatedData.taxRate ?? existingInvoice.taxRate
      const discount = validatedData.discount ?? existingInvoice.discount
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

      updateData.subtotal = subtotal
      updateData.tax = tax
      updateData.taxRate = taxRate
      updateData.discount = discount
      updateData.total = total
      updateData.items = {
        create: cleanedItems,
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: true,
        items: true,
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    // Verify invoice belongs to user's workspace
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        workspaceId: workspaceMember.workspaceId,
      },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
