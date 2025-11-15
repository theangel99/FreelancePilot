import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  clientId: z.string().min(1, "Client is required"),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  billingType: z.enum(["HOURLY", "FIXED_FEE"]).default("HOURLY"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().optional(),
  hourlyRate: z.number().optional(),
  fixedPrice: z.number().optional(),
  color: z.string().optional(),
})

// GET /api/projects - List all projects
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

    const projects = await prisma.project.findMany({
      where: { workspaceId: workspaceMember.workspaceId },
      include: {
        client: true,
        tasks: true,
        _count: {
          select: {
            tasks: true,
            timeEntries: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = projectSchema.parse(body)

    // Get user's first workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        workspaceId: workspaceMember.workspaceId,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
      include: {
        client: true,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
