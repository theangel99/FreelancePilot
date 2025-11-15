"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, FolderKanban, CheckSquare, DollarSign, TrendingUp, TrendingDown, Clock, Calendar, ArrowRight } from "lucide-react"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/currency"

type DashboardStats = {
  totalClients: number
  activeClients: number
  activeProjects: number
  allProjects: number
  pendingTasks: number
  unpaidInvoices: number
  unpaidInvoicesTotal: number
  totalRevenue: number
  userCurrency: string
  revenueData: Array<{ month: string; revenue: number }>
  projectsByStatus: Array<{ status: string; count: number }>
  recentProjects: Array<any>
  recentInvoices: Array<any>
  upcomingTasks: Array<any>
  thisMonthHours: number
  lastMonthHours: number
}

const COLORS = {
  PLANNING: "#3b82f6", // blue
  ACTIVE: "#10b981", // green
  ON_HOLD: "#f59e0b", // amber
  COMPLETED: "#6b7280", // gray
  CANCELLED: "#ef4444", // red
}

const STATUS_LABELS = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

const INVOICE_STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  const hoursChange = stats.lastMonthHours > 0
    ? ((stats.thisMonthHours - stats.lastMonthHours) / stats.lastMonthHours) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your freelance business.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue, stats.userCurrency)}</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.unpaidInvoicesTotal, stats.userCurrency)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unpaidInvoices} {stats.unpaidInvoices === 1 ? "invoice" : "invoices"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FolderKanban className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.allProjects} total projects
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Hours</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthHours}h</div>
            <p className={`text-xs flex items-center gap-1 ${hoursChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {hoursChange >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(hoursChange).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Last 6 months revenue from paid invoices (in {stats.userCurrency})</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, stats.userCurrency)}
                  labelStyle={{ color: "#000" }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
            <CardDescription>Distribution of your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.projectsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${STATUS_LABELS[status as keyof typeof STATUS_LABELS]}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.projectsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity and Tasks Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Your latest projects</CardDescription>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet</p>
            ) : (
              <div className="space-y-4">
                {stats.recentProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-start justify-between hover:bg-accent p-3 rounded-lg transition-all cursor-pointer border border-transparent hover:border-border">
                      <div className="flex-1">
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.client.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {project._count.tasks} {project._count.tasks === 1 ? "task" : "tasks"}
                        </div>
                      </div>
                      <Badge className={`${
                        project.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30" :
                        project.status === "PLANNING" ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30" :
                        project.status === "ON_HOLD" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30" :
                        "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30"
                      }`}>
                        {STATUS_LABELS[project.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Due in the next 7 days</CardDescription>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming tasks</p>
            ) : (
              <div className="space-y-4">
                {stats.upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {task.project?.name} • {task.project?.client?.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Due {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </div>
                    </div>
                    <Badge className={`${
                      task.priority === "URGENT" ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30" :
                      task.priority === "HIGH" ? "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30" :
                      task.priority === "MEDIUM" ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30" :
                      "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30"
                    }`}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Your latest invoices</CardDescription>
            </div>
            <Link href="/invoices">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentInvoices.map((invoice) => (
                <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                  <div className="flex items-center justify-between hover:bg-accent p-3 rounded-lg transition-all cursor-pointer border border-border/40 hover:border-border">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.client.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">${invoice.total.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          Due {format(new Date(invoice.dueDate), "MMM d")}
                        </div>
                      </div>
                      <Badge className={
                        invoice.status === "PAID" ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30" :
                        invoice.status === "SENT" ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30" :
                        invoice.status === "OVERDUE" ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30" :
                        "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30"
                      }>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
                <p className="text-xs text-muted-foreground">{stats.activeClients} active</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.pendingTasks}</div>
                <p className="text-xs text-muted-foreground">To complete</p>
              </div>
              <CheckSquare className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Month Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.lastMonthHours}h</div>
                <p className="text-xs text-muted-foreground">Billable time</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
