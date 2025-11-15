import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().email("Invalid email").optional()
  ),
  phone: z.string().optional(),
  company: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  status: z.enum(["LEAD", "PROSPECT", "ACTIVE", "INACTIVE", "LOST"]).optional(),
  leadSource: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(["REFERRAL", "WEBSITE", "SOCIAL_MEDIA", "COLD_OUTREACH", "NETWORKING", "ADVERTISEMENT", "OTHER"]).optional()
  ),
  referredBy: z.string().optional(),
  firstContactDate: z.string().optional(),
  lastContactDate: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
})

// GET /api/clients/[id] - Get single client
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

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        workspaceId: workspaceMember.workspaceId,
      },
      include: {
        projects: true,
        invoices: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/clients/[id] - Update client
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
    const validatedData = clientSchema.parse(body)

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    // Verify client belongs to user's workspace
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.id,
        workspaceId: workspaceMember.workspaceId,
      },
    })

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        email: validatedData.email || null,
        firstContactDate: validatedData.firstContactDate ? new Date(validatedData.firstContactDate) : null,
        lastContactDate: validatedData.lastContactDate ? new Date(validatedData.lastContactDate) : null,
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/clients/[id] - Delete client
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

    // Verify client belongs to user's workspace
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.id,
        workspaceId: workspaceMember.workspaceId,
      },
    })

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    await prisma.client.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
