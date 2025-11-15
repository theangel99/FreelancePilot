"use client"

import { useState, useEffect } from "react"
import { Plus, Play, Square, Edit, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TimeEntryDialog } from "@/components/time/time-entry-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import Link from "next/link"

type TimeEntry = {
  id: string
  description: string | null
  startTime: string
  endTime: string | null
  duration: number | null
  hourlyRate: number
  billable: boolean
  project: {
    id: string
    name: string
    client: {
      name: string
    }
  } | null
  task: {
    id: string
    title: string
  } | null
}

export default function TimeTrackingPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])

  // Timer start form
  const [timerForm, setTimerForm] = useState({
    projectId: "",
    taskId: "",
    description: "",
    hourlyRate: "150",
  })

  const fetchTimeEntries = async () => {
    try {
      const response = await fetch("/api/time-entries")
      if (response.ok) {
        const data = await response.json()
        setTimeEntries(data)

        // Find active timer
        const active = data.find((entry: TimeEntry) => !entry.endTime)
        setActiveTimer(active || null)
      }
    } catch (error) {
      console.error("Error fetching time entries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)

        // Set default hourly rate
        if (data.length > 0 && data[0].billingType === "HOURLY" && data[0].hourlyRate) {
          setTimerForm(prev => ({ ...prev, hourlyRate: data[0].hourlyRate.toString() }))
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const fetchTasks = async (projectId: string) => {
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  useEffect(() => {
    fetchTimeEntries()
    fetchProjects()
  }, [])

  useEffect(() => {
    if (timerForm.projectId) {
      fetchTasks(timerForm.projectId)

      // Update hourly rate when project changes
      const selectedProject = projects.find(p => p.id === timerForm.projectId)
      if (selectedProject?.billingType === "HOURLY" && selectedProject?.hourlyRate) {
        setTimerForm(prev => ({ ...prev, hourlyRate: selectedProject.hourlyRate.toString() }))
      }
    } else {
      setTasks([])
    }
  }, [timerForm.projectId, projects])

  // Update elapsed time for active timer
  useEffect(() => {
    if (activeTimer) {
      const startTime = new Date(activeTimer.startTime).getTime()

      const interval = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - startTime) / 1000)
        setElapsedSeconds(elapsed)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [activeTimer])

  const handleStartTimer = async () => {
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: timerForm.projectId || undefined,
          taskId: timerForm.taskId || undefined,
          description: timerForm.description || undefined,
          startTime: new Date().toISOString(),
          hourlyRate: parseFloat(timerForm.hourlyRate),
          billable: true,
        }),
      })

      if (response.ok) {
        fetchTimeEntries()
        setTimerForm({ projectId: "", taskId: "", description: "", hourlyRate: timerForm.hourlyRate })
      }
    } catch (error) {
      console.error("Error starting timer:", error)
    }
  }

  const handleStopTimer = async () => {
    if (!activeTimer) return

    try {
      const now = new Date()
      const duration = Math.floor((now.getTime() - new Date(activeTimer.startTime).getTime()) / 1000)

      const payload: any = {
        startTime: activeTimer.startTime,
        endTime: now.toISOString(),
        duration,
        hourlyRate: activeTimer.hourlyRate,
        billable: activeTimer.billable ?? true,
      }

      // Only add optional fields if they have values
      if (activeTimer.project?.id) {
        payload.projectId = activeTimer.project.id
      }
      if (activeTimer.task?.id) {
        payload.taskId = activeTimer.task.id
      }
      if (activeTimer.description) {
        payload.description = activeTimer.description
      }

      console.log("Stopping timer with payload:", payload)

      const response = await fetch(`/api/time-entries/${activeTimer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        fetchTimeEntries()
      } else {
        const errorData = await response.json()
        console.error("Error stopping timer - Status:", response.status, "Data:", errorData)
      }
    } catch (error) {
      console.error("Error stopping timer:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this time entry?")) return

    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchTimeEntries()
      }
    } catch (error) {
      console.error("Error deleting time entry:", error)
    }
  }

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingEntry(null)
    fetchTimeEntries()
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00:00"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate stats
  const today = new Date().toDateString()
  const todayEntries = timeEntries.filter(entry =>
    new Date(entry.startTime).toDateString() === today && entry.endTime
  )
  const todayHours = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 3600
  const todayRevenue = todayEntries.reduce((sum, entry) =>
    sum + ((entry.duration || 0) / 3600) * entry.hourlyRate, 0
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Time Tracking</h1>
          <p className="text-muted-foreground">Track your time and manage entries</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Time Entry
        </Button>
      </div>

      {/* Active Timer */}
      {activeTimer ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-semibold">Timer Running</span>
                </div>
                <div className="text-3xl font-mono font-bold">
                  {formatDuration(elapsedSeconds)}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  {activeTimer.project && (
                    <div className="text-sm font-medium">{activeTimer.project.name}</div>
                  )}
                  {activeTimer.task && (
                    <div className="text-sm text-muted-foreground">{activeTimer.task.title}</div>
                  )}
                  {activeTimer.description && (
                    <div className="text-sm text-muted-foreground">{activeTimer.description}</div>
                  )}
                </div>
                <Button onClick={handleStopTimer} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Start Timer</CardTitle>
            <CardDescription>Begin tracking time on a project or task</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Select value={timerForm.projectId} onValueChange={(value) => setTimerForm({ ...timerForm, projectId: value, taskId: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} - {project.client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Select
                  value={timerForm.taskId}
                  onValueChange={(value) => setTimerForm({ ...timerForm, taskId: value })}
                  disabled={!timerForm.projectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={timerForm.description}
                  onChange={(e) => setTimerForm({ ...timerForm, description: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <Button onClick={handleStartTimer} size="lg">
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today's Hours</CardDescription>
            <CardTitle className="text-3xl">{todayHours.toFixed(2)}h</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today's Revenue</CardDescription>
            <CardTitle className="text-3xl">${todayRevenue.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Entries</CardDescription>
            <CardTitle className="text-3xl">{timeEntries.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>Your recent time tracking entries</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No time entries yet. Start the timer or add a manual entry.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project / Task</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => {
                  const durationHours = entry.duration ? entry.duration / 3600 : 0
                  const amount = durationHours * entry.hourlyRate

                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(new Date(entry.startTime), "MMM d, yyyy")}
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(entry.startTime), "HH:mm")}
                          {entry.endTime && ` - ${format(new Date(entry.endTime), "HH:mm")}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.project && (
                          <Link href={`/projects/${entry.project.id}`} className="hover:underline">
                            <div className="text-sm font-medium">{entry.project.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {entry.project.client.name}
                            </div>
                          </Link>
                        )}
                        {entry.task && (
                          <div className="text-xs text-muted-foreground">{entry.task.title}</div>
                        )}
                        {!entry.project && !entry.task && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.description || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {entry.endTime ? (
                          <div className="font-mono">{formatDuration(entry.duration)}</div>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">Running</Badge>
                        )}
                      </TableCell>
                      <TableCell>${entry.hourlyRate.toFixed(2)}/hr</TableCell>
                      <TableCell className="font-medium">
                        {entry.endTime ? `$${amount.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TimeEntryDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        timeEntry={editingEntry}
      />
    </div>
  )
}
