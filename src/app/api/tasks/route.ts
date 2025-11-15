import { NextRequest, NextResponse } from "next/server"
import { requireWorkspace } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().optional(),
})

// GET /api/tasks - List all tasks
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace()

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")

    const where: any = {
      workspaceId,
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { dueDate: "asc" },
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await requireWorkspace()
    const body = await request.json()
    const validatedData = taskSchema.parse(body)

    // Verify project belongs to user's workspace
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        workspaceId,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        workspaceId,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
