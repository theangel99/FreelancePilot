import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const timeEntrySchema = z.object({
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.number().optional(),
  hourlyRate: z.number(),
  billable: z.boolean().optional(),
})

// GET /api/time-entries/[id] - Get single time entry
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

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: params.id,
        workspaceId: workspaceMember.workspaceId,
        userId: session.user.id,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        task: true,
      },
    })

    if (!timeEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 })
    }

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error("Error fetching time entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/time-entries/[id] - Update time entry (mainly for stopping timer)
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
    const validatedData = timeEntrySchema.parse(body)

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    // Verify time entry belongs to user
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        id: params.id,
        workspaceId: workspaceMember.workspaceId,
        userId: session.user.id,
      },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 })
    }

    const timeEntry = await prisma.timeEntry.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        startTime: new Date(validatedData.startTime),
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        task: true,
      },
    })

    return NextResponse.json(timeEntry)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors)
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    console.error("Error updating time entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/time-entries/[id] - Delete time entry
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

    // Verify time entry belongs to user
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        id: params.id,
        workspaceId: workspaceMember.workspaceId,
        userId: session.user.id,
      },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 })
    }

    await prisma.timeEntry.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting time entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
