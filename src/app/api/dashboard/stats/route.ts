import { NextRequest, NextResponse } from "next/server"
import { requireWorkspace } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { convertCurrency } from "@/lib/currency"

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { workspaceId, userId } = await requireWorkspace()

    // Get user's preferred currency
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredCurrency: true },
    })
    const userCurrency = user?.preferredCurrency || "EUR"

    // Calculate date ranges in UTC to avoid timezone issues
    const now = new Date()
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, 1))
    const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))

    // First, automatically update overdue invoices
    await prisma.invoice.updateMany({
      where: {
        workspaceId,
        status: "SENT",
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: "OVERDUE",
      },
    })

    // Fix any paid invoices that don't have a paidAt date
    // (this can happen with old invoices marked as paid before paidAt tracking was added)
    // Use the invoice's issue date as a reasonable fallback
    const invoicesNeedingPaidAt = await prisma.invoice.findMany({
      where: {
        workspaceId,
        status: "PAID",
        paidAt: null,
      },
      select: {
        id: true,
        issueDate: true,
      },
    })

    // Update each invoice individually with its own issue date
    for (const invoice of invoicesNeedingPaidAt) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { paidAt: invoice.issueDate },
      })
    }

    // Get all statistics in parallel
    const [
      totalClients,
      activeClients,
      activeProjects,
      allProjects,
      pendingTasks,
      upcomingTasks,
      unpaidInvoicesCount,
      unpaidInvoicesData,
      paidInvoicesData,
      recentProjects,
      recentInvoices,
      monthlyRevenue,
      projectsByStatus,
      thisMonthHours,
      lastMonthHours,
    ] = await Promise.all([
      // Total clients
      prisma.client.count({
        where: { workspaceId },
      }),
      // Active clients
      prisma.client.count({
        where: {
          workspaceId,
          status: "ACTIVE",
        },
      }),
      // Active projects
      prisma.project.count({
        where: {
          workspaceId,
          status: "ACTIVE",
        },
      }),
      // All projects count
      prisma.project.count({
        where: { workspaceId },
      }),
      // Pending tasks
      prisma.task.count({
        where: {
          workspaceId,
          status: "TODO",
        },
      }),
      // Upcoming tasks (due in next 7 days)
      prisma.task.findMany({
        where: {
          workspaceId,
          status: {
            in: ["TODO", "IN_PROGRESS"],
          },
          dueDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          project: {
            select: {
              name: true,
              client: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      // Unpaid invoices count
      prisma.invoice.count({
        where: {
          workspaceId,
          status: {
            in: ["DRAFT", "SENT", "OVERDUE"],
          },
        },
      }),
      // Unpaid invoices (with currency info for conversion)
      prisma.invoice.findMany({
        where: {
          workspaceId,
          status: {
            in: ["DRAFT", "SENT", "OVERDUE"],
          },
        },
        select: {
          total: true,
          currency: true,
        },
      }),
      // Paid invoices (with currency info for conversion)
      prisma.invoice.findMany({
        where: {
          workspaceId,
          status: "PAID",
        },
        select: {
          total: true,
          currency: true,
        },
      }),
      // Recent projects
      prisma.project.findMany({
        where: { workspaceId },
        include: {
          client: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Recent invoices
      prisma.invoice.findMany({
        where: { workspaceId },
        include: {
          client: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Monthly revenue for last 6 months (with currency for conversion)
      prisma.invoice.findMany({
        where: {
          workspaceId,
          status: "PAID",
          paidAt: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          paidAt: true,
          total: true,
          currency: true,
        },
      }),
      // Projects by status
      prisma.project.groupBy({
        by: ["status"],
        where: { workspaceId },
        _count: true,
      }),
      // This month hours
      prisma.timeEntry.aggregate({
        where: {
          workspaceId,
          userId,
          startTime: {
            gte: thisMonthStart,
          },
          endTime: {
            not: null,
          },
        },
        _sum: {
          duration: true,
        },
      }),
      // Last month hours
      prisma.timeEntry.aggregate({
        where: {
          workspaceId,
          userId,
          startTime: {
            gte: lastMonthStart,
            lt: thisMonthStart,
          },
          endTime: {
            not: null,
          },
        },
        _sum: {
          duration: true,
        },
      }),
    ])

    // Convert unpaid invoices total to user's preferred currency
    const unpaidInvoicesTotal = unpaidInvoicesData.reduce((sum, invoice) => {
      const convertedAmount = convertCurrency(invoice.total, invoice.currency, userCurrency)
      return sum + convertedAmount
    }, 0)

    // Convert paid invoices total to user's preferred currency
    const totalRevenue = paidInvoicesData.reduce((sum, invoice) => {
      const convertedAmount = convertCurrency(invoice.total, invoice.currency, userCurrency)
      return sum + convertedAmount
    }, 0)

    // Process monthly revenue data with currency conversion
    const revenueByMonth = new Map<string, number>()
    monthlyRevenue.forEach((invoice) => {
      if (invoice.paidAt) {
        const month = new Date(invoice.paidAt).toISOString().slice(0, 7) // YYYY-MM
        const convertedAmount = convertCurrency(invoice.total, invoice.currency, userCurrency)
        const current = revenueByMonth.get(month) || 0
        revenueByMonth.set(month, current + convertedAmount)
      }
    })

    // Generate array for last 6 months
    const revenueData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      const monthKey = date.toISOString().slice(0, 7)
      const monthName = new Date(date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC"
      })
      revenueData.push({
        month: monthName,
        revenue: revenueByMonth.get(monthKey) || 0,
      })
    }

    // Calculate hours
    const thisMonthHoursValue = (thisMonthHours._sum.duration || 0) / 3600
    const lastMonthHoursValue = (lastMonthHours._sum.duration || 0) / 3600

    return NextResponse.json({
      // Basic stats
      totalClients,
      activeClients,
      activeProjects,
      allProjects,
      pendingTasks,
      unpaidInvoices: unpaidInvoicesCount,
      unpaidInvoicesTotal,
      totalRevenue,
      userCurrency, // Include user's preferred currency in response

      // Charts data
      revenueData,
      projectsByStatus: projectsByStatus.map((p) => ({
        status: p.status,
        count: p._count,
      })),

      // Recent activity
      recentProjects,
      recentInvoices,
      upcomingTasks,

      // Time tracking
      thisMonthHours: Number(thisMonthHoursValue.toFixed(1)),
      lastMonthHours: Number(lastMonthHoursValue.toFixed(1)),
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
