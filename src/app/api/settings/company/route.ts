import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const companySettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  taxId: z.string().optional(),
  invoicePrefix: z.string().min(1, "Invoice prefix is required"),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  defaultTerms: z.string().optional(),
})

// GET /api/settings/company - Get company settings
export async function GET(request: NextRequest) {
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

    let companySettings = await prisma.companySettings.findUnique({
      where: { workspaceId: workspaceMember.workspaceId },
    })

    // If no settings exist, create default ones
    if (!companySettings) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceMember.workspaceId },
      })

      companySettings = await prisma.companySettings.create({
        data: {
          workspaceId: workspaceMember.workspaceId,
          companyName: workspace?.name || "My Company",
          invoicePrefix: "INV",
          nextInvoiceNumber: 1,
          defaultTaxRate: 0,
          defaultTerms: "Payment is due within 30 days",
        },
      })
    }

    return NextResponse.json(companySettings)
  } catch (error) {
    console.error("Error fetching company settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/settings/company - Update company settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = companySettingsSchema.parse(body)

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    // Check if settings exist
    let companySettings = await prisma.companySettings.findUnique({
      where: { workspaceId: workspaceMember.workspaceId },
    })

    if (companySettings) {
      // Update existing settings
      companySettings = await prisma.companySettings.update({
        where: { workspaceId: workspaceMember.workspaceId },
        data: {
          companyName: validatedData.companyName,
          email: validatedData.email || null,
          phone: validatedData.phone || null,
          address: validatedData.address || null,
          city: validatedData.city || null,
          state: validatedData.state || null,
          zipCode: validatedData.zipCode || null,
          country: validatedData.country || null,
          website: validatedData.website || null,
          taxId: validatedData.taxId || null,
          invoicePrefix: validatedData.invoicePrefix,
          defaultTaxRate: validatedData.defaultTaxRate || 0,
          defaultTerms: validatedData.defaultTerms || null,
        },
      })
    } else {
      // Create new settings
      companySettings = await prisma.companySettings.create({
        data: {
          workspaceId: workspaceMember.workspaceId,
          companyName: validatedData.companyName,
          email: validatedData.email || null,
          phone: validatedData.phone || null,
          address: validatedData.address || null,
          city: validatedData.city || null,
          state: validatedData.state || null,
          zipCode: validatedData.zipCode || null,
          country: validatedData.country || null,
          website: validatedData.website || null,
          taxId: validatedData.taxId || null,
          invoicePrefix: validatedData.invoicePrefix,
          nextInvoiceNumber: 1,
          defaultTaxRate: validatedData.defaultTaxRate || 0,
          defaultTerms: validatedData.defaultTerms || null,
        },
      })
    }

    return NextResponse.json(companySettings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    console.error("Error updating company settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
