"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Plus, CheckCircle, Circle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProjectDialog } from "@/components/projects/project-dialog"
import { TaskDialog } from "@/components/tasks/task-dialog"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const statusColors = {
  PLANNING: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
}

const taskStatusColors = {
  TODO: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  IN_REVIEW: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

const priorityColors = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        router.push("/projects")
      }
    } catch (error) {
      console.error("Error fetching project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchProject()
    }
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This will also delete all associated tasks.")) return

    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/projects")
      }
    } catch (error) {
      console.error("Error deleting project:", error)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!project) {
    return <div className="text-center py-8">Project not found</div>
  }

  const completedTasks = project.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0
  const totalTasks = project.tasks?.length || 0
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">
              {project.client.name} {project.client.company && `• ${project.client.company}`}
            </p>
          </div>
          <Badge className={statusColors[project.status as keyof typeof statusColors]}>
            {project.status.replace("_", " ")}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {project.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Billing Type:</div>
              <div className="font-medium">
                {project.billingType === "HOURLY" ? "Hourly" : "Fixed Fee"}
              </div>

              {project.billingType === "HOURLY" && project.hourlyRate && (
                <>
                  <div className="text-muted-foreground">Hourly Rate:</div>
                  <div className="font-medium">${project.hourlyRate}/hr</div>
                </>
              )}

              {project.billingType === "FIXED_FEE" && project.fixedPrice && (
                <>
                  <div className="text-muted-foreground">Fixed Price:</div>
                  <div className="font-medium">${project.fixedPrice.toFixed(2)}</div>
                </>
              )}

              {project.budget && (
                <>
                  <div className="text-muted-foreground">Budget:</div>
                  <div className="font-medium">${project.budget.toFixed(2)}</div>
                </>
              )}

              {project.startDate && (
                <>
                  <div className="text-muted-foreground">Start Date:</div>
                  <div>{format(new Date(project.startDate), "MMM d, yyyy")}</div>
                </>
              )}

              {project.endDate && (
                <>
                  <div className="text-muted-foreground">End Date:</div>
                  <div>{format(new Date(project.endDate), "MMM d, yyyy")}</div>
                </>
              )}

              <div className="text-muted-foreground">Created:</div>
              <div>{format(new Date(project.createdAt), "MMM d, yyyy")}</div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tasks Completed</span>
                <span className="font-medium">{completedTasks} / {totalTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${taskProgress}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold">{project._count.tasks}</div>
                <div className="text-xs text-muted-foreground">Total Tasks</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{project._count.timeEntries}</div>
                <div className="text-xs text-muted-foreground">Time Entries</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Tracking Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Time Tracked</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(() => {
              const totalSeconds = project.timeEntries?.reduce((sum: number, entry: any) =>
                sum + (entry.duration || 0), 0
              ) || 0
              const totalHours = (totalSeconds / 3600).toFixed(2)
              const totalRevenue = project.timeEntries?.reduce((sum: number, entry: any) =>
                sum + ((entry.duration || 0) / 3600) * entry.hourlyRate, 0
              ) || 0

              return (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Total Hours:</div>
                  <div className="font-medium">{totalHours}h</div>

                  {project.billingType === "HOURLY" && (
                    <>
                      <div className="text-muted-foreground">Revenue:</div>
                      <div className="font-medium">${totalRevenue.toFixed(2)}</div>
                    </>
                  )}

                  {project.budget && (
                    <>
                      <div className="text-muted-foreground">Budget Used:</div>
                      <div className="font-medium">
                        {((totalRevenue / project.budget) * 100).toFixed(1)}%
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Manage tasks for this project</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsTaskDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {project.tasks && project.tasks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Est. Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.tasks.map((task: any) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge className={taskStatusColors[task.status as keyof typeof taskStatusColors]}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityColors[task.priority as keyof typeof priorityColors]}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      {task.estimatedHours ? `${task.estimatedHours}h` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No tasks yet. Click "Add Task" to create your first task.
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          fetchProject()
        }}
        project={project}
      />

      <TaskDialog
        open={isTaskDialogOpen}
        onClose={() => {
          setIsTaskDialogOpen(false)
          fetchProject()
        }}
        projectId={project?.id}
      />
    </div>
  )
}
