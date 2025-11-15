import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
    })

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    // Get all statistics in parallel
    const [
      totalClients,
      activeClients,
      activeProjects,
      pendingTasks,
      unpaidInvoices,
      unpaidInvoicesTotal,
      paidInvoicesTotal,
    ] = await Promise.all([
      // Total clients
      prisma.client.count({
        where: { workspaceId: workspaceMember.workspaceId },
      }),
      // Active clients
      prisma.client.count({
        where: {
          workspaceId: workspaceMember.workspaceId,
          status: "ACTIVE",
        },
      }),
      // Active projects
      prisma.project.count({
        where: {
          workspaceId: workspaceMember.workspaceId,
          status: "ACTIVE",
        },
      }),
      // Pending tasks
      prisma.task.count({
        where: {
          workspaceId: workspaceMember.workspaceId,
          status: "TODO",
        },
      }),
      // Unpaid invoices count
      prisma.invoice.count({
        where: {
          workspaceId: workspaceMember.workspaceId,
          status: {
            in: ["DRAFT", "SENT", "OVERDUE"],
          },
        },
      }),
      // Unpaid invoices total amount
      prisma.invoice.aggregate({
        where: {
          workspaceId: workspaceMember.workspaceId,
          status: {
            in: ["DRAFT", "SENT", "OVERDUE"],
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Paid invoices total amount (revenue)
      prisma.invoice.aggregate({
        where: {
          workspaceId: workspaceMember.workspaceId,
          status: "PAID",
        },
        _sum: {
          total: true,
        },
      }),
    ])

    return NextResponse.json({
      totalClients,
      activeClients,
      activeProjects,
      pendingTasks,
      unpaidInvoices,
      unpaidInvoicesTotal: unpaidInvoicesTotal._sum.total || 0,
      totalRevenue: paidInvoicesTotal._sum.total || 0,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
