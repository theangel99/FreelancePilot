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

// GET /api/clients - List all clients
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

    const clients = await prisma.client.findMany({
      where: { workspaceId: workspaceMember.workspaceId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Received body:", JSON.stringify(body, null, 2))
    const validatedData = clientSchema.parse(body)

    // Get user's first workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    const client = await prisma.client.create({
      data: {
        ...validatedData,
        workspaceId: workspaceMember.workspaceId,
        email: validatedData.email || null,
        firstContactDate: validatedData.firstContactDate ? new Date(validatedData.firstContactDate) : null,
        lastContactDate: validatedData.lastContactDate ? new Date(validatedData.lastContactDate) : null,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", JSON.stringify(error.errors, null, 2))
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
