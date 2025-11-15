"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TimeEntryDialogProps = {
  open: boolean
  onClose: () => void
  timeEntry?: any
  projectId?: string
  taskId?: string
}

export function TimeEntryDialog({ open, onClose, timeEntry, projectId, taskId }: TimeEntryDialogProps) {
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [formData, setFormData] = useState({
    projectId: projectId || "",
    taskId: taskId || "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "",
    endTime: "",
    hours: "",
    hourlyRate: "",
    billable: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Fetch projects for the dropdown
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects")
        if (response.ok) {
          const data = await response.json()
          setProjects(data)

          // Set default hourly rate from first project if available
          if (!formData.hourlyRate && data.length > 0) {
            const firstProject = data[0]
            if (firstProject.billingType === "HOURLY" && firstProject.hourlyRate) {
              setFormData(prev => ({ ...prev, hourlyRate: firstProject.hourlyRate.toString() }))
            }
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error)
      }
    }
    fetchProjects()
  }, [])

  useEffect(() => {
    // Fetch tasks when project is selected
    const fetchTasks = async () => {
      if (formData.projectId) {
        try {
          const response = await fetch(`/api/tasks?projectId=${formData.projectId}`)
          if (response.ok) {
            const data = await response.json()
            setTasks(data)
          }
        } catch (error) {
          console.error("Error fetching tasks:", error)
        }
      } else {
        setTasks([])
      }
    }
    fetchTasks()
  }, [formData.projectId])

  useEffect(() => {
    // Update hourly rate when project changes
    if (formData.projectId) {
      const selectedProject = projects.find(p => p.id === formData.projectId)
      if (selectedProject?.billingType === "HOURLY" && selectedProject?.hourlyRate) {
        setFormData(prev => ({ ...prev, hourlyRate: selectedProject.hourlyRate.toString() }))
      }
    }
  }, [formData.projectId, projects])

  useEffect(() => {
    if (timeEntry) {
      const start = new Date(timeEntry.startTime)
      const end = timeEntry.endTime ? new Date(timeEntry.endTime) : new Date()
      const durationHours = timeEntry.duration ? (timeEntry.duration / 3600).toFixed(2) : ""

      setFormData({
        projectId: timeEntry.projectId || "",
        taskId: timeEntry.taskId || "",
        description: timeEntry.description || "",
        date: start.toISOString().split('T')[0],
        startTime: start.toTimeString().slice(0, 5),
        endTime: timeEntry.endTime ? end.toTimeString().slice(0, 5) : "",
        hours: durationHours,
        hourlyRate: timeEntry.hourlyRate?.toString() || "",
        billable: timeEntry.billable ?? true,
      })
    } else {
      setFormData({
        projectId: projectId || "",
        taskId: taskId || "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        startTime: "",
        endTime: "",
        hours: "",
        hourlyRate: "",
        billable: true,
      })
    }
  }, [timeEntry, projectId, taskId, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Calculate start and end times
      let startDateTime: Date
      let endDateTime: Date | undefined
      let duration: number | undefined

      if (formData.startTime && formData.endTime) {
        // Using start/end times
        startDateTime = new Date(`${formData.date}T${formData.startTime}:00`)
        endDateTime = new Date(`${formData.date}T${formData.endTime}:00`)
        duration = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000)
      } else if (formData.hours) {
        // Using hours duration
        startDateTime = new Date(`${formData.date}T09:00:00`)
        duration = parseFloat(formData.hours) * 3600
        endDateTime = new Date(startDateTime.getTime() + duration * 1000)
      } else {
        setError("Please provide either start/end times or hours")
        setIsLoading(false)
        return
      }

      const url = timeEntry ? `/api/time-entries/${timeEntry.id}` : "/api/time-entries"
      const method = timeEntry ? "PUT" : "POST"

      const payload = {
        projectId: formData.projectId || undefined,
        taskId: formData.taskId || undefined,
        description: formData.description || undefined,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime?.toISOString(),
        duration,
        hourlyRate: parseFloat(formData.hourlyRate),
        billable: formData.billable,
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Something went wrong")
        return
      }

      onClose()
    } catch (error) {
      setError("Failed to save time entry")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{timeEntry ? "Edit Time Entry" : "Add Time Entry"}</DialogTitle>
          <DialogDescription>
            {timeEntry ? "Update time entry details" : "Manually add a time entry"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value, taskId: "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
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

            <div className="space-y-2">
              <Label htmlFor="taskId">Task (Optional)</Label>
              <Select value={formData.taskId} onValueChange={(value) => setFormData({ ...formData, taskId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="What did you work on?"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">OR</div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="8.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                required
                placeholder="150.00"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable"
              checked={formData.billable}
              onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="billable" className="cursor-pointer">Billable</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : timeEntry ? "Update Entry" : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
