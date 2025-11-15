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
  duration: z.number().optional(), // Duration in seconds
  hourlyRate: z.number(),
  billable: z.boolean().optional(),
})

// GET /api/time-entries - List all time entries
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const taskId = searchParams.get("taskId")
    const active = searchParams.get("active") // Filter for active timer
    const unbilled = searchParams.get("unbilled") // Filter for unbilled entries
    const clientId = searchParams.get("clientId") // Filter by client

    const where: any = {
      workspaceId: workspaceMember.workspaceId,
      userId: session.user.id,
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (taskId) {
      where.taskId = taskId
    }

    if (active === "true") {
      where.endTime = null
    }

    if (unbilled === "true") {
      where.invoiced = false
      where.billable = true
      where.endTime = { not: null } // Only completed entries
    }

    if (clientId) {
      where.project = {
        clientId: clientId,
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: {
          include: {
            client: true,
          },
        },
        task: true,
      },
      orderBy: { startTime: "desc" },
    })

    return NextResponse.json(timeEntries)
  } catch (error) {
    console.error("Error fetching time entries:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/time-entries - Create new time entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = timeEntrySchema.parse(body)

    // Get user's first workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    // If starting a new timer, stop any existing active timers
    if (!validatedData.endTime) {
      const activeTimers = await prisma.timeEntry.findMany({
        where: {
          workspaceId: workspaceMember.workspaceId,
          userId: session.user.id,
          endTime: null,
        },
      })

      // Stop all active timers
      for (const timer of activeTimers) {
        const now = new Date()
        const duration = Math.floor((now.getTime() - new Date(timer.startTime).getTime()) / 1000)
        await prisma.timeEntry.update({
          where: { id: timer.id },
          data: {
            endTime: now,
            duration,
          },
        })
      }
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        ...validatedData,
        workspaceId: workspaceMember.workspaceId,
        userId: session.user.id,
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

    return NextResponse.json(timeEntry, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating time entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
