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

// GET /api/projects/[id] - Get single project
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

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        workspaceId: workspaceMember.workspaceId,
      },
      include: {
        client: true,
        tasks: {
          orderBy: { createdAt: "desc" },
        },
        timeEntries: true,
        _count: {
          select: {
            tasks: true,
            timeEntries: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Update project
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
    const validatedData = projectSchema.parse(body)

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    // Verify project belongs to user's workspace
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        workspaceId: workspaceMember.workspaceId,
      },
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
      include: {
        client: true,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete project
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

    // Verify project belongs to user's workspace
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        workspaceId: workspaceMember.workspaceId,
      },
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    await prisma.project.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
