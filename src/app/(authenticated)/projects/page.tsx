"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ProjectDialog } from "@/components/projects/project-dialog"

type Project = {
  id: string
  name: string
  description: string | null
  status: string
  billingType: string
  hourlyRate: number | null
  fixedPrice: number | null
  startDate: string | null
  endDate: string | null
  client: {
    name: string
    company: string | null
  }
  _count: {
    tasks: number
    timeEntries: number
  }
}

const statusColors = {
  PLANNING: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
}

const billingTypeLabels = {
  HOURLY: "Hourly",
  FIXED_FEE: "Fixed Fee",
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project? This will also delete all associated tasks.")) return

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchProjects()
      }
    } catch (error) {
      console.error("Error deleting project:", error)
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingProject(null)
    fetchProjects()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Track and manage your client projects</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            {projects.length} total project{projects.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No projects yet. Click "New Project" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      {project.client.name}
                      {project.client.company && (
                        <span className="text-muted-foreground text-sm ml-1">
                          ({project.client.company})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[project.status as keyof typeof statusColors] || ""}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{billingTypeLabels[project.billingType as keyof typeof billingTypeLabels]}</div>
                        {project.billingType === "HOURLY" && project.hourlyRate && (
                          <div className="text-muted-foreground">${project.hourlyRate}/hr</div>
                        )}
                        {project.billingType === "FIXED_FEE" && project.fixedPrice && (
                          <div className="text-muted-foreground">${project.fixedPrice.toFixed(2)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {(() => {
                          const openTasks = project.tasks?.filter((t: any) =>
                            t.status !== "COMPLETED" && t.status !== "CANCELLED"
                          ).length || 0
                          const completedTasks = project.tasks?.filter((t: any) =>
                            t.status === "COMPLETED"
                          ).length || 0
                          return (
                            <div className="space-y-1">
                              <div className="text-green-600">{completedTasks} done</div>
                              <div className="text-blue-600">{openTasks} open</div>
                            </div>
                          )
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link href={`/projects/${project.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(project)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProjectDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        project={editingProject}
      />
    </div>
  )
}
