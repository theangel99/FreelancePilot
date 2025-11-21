"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Calendar, Users, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  name: string | null
  email: string
  role: "ADMIN" | "PRO" | "FREE_TRIAL"
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  createdAt: string
  workspaceMembers: Array<{
    workspace: {
      name: string
    }
  }>
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTrialDialog, setShowTrialDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [trialDays, setTrialDays] = useState("30")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else if (response.status === 403) {
        alert("You don't have admin access")
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers()
    }
  }, [status])

  const handleOpenTrialDialog = (user: User) => {
    setSelectedUser(user)
    setTrialDays("30")
    setShowTrialDialog(true)
  }

  const handleExtendTrial = async () => {
    if (!selectedUser) return

    try {
      const days = parseInt(trialDays)
      if (isNaN(days) || days <= 0) {
        alert("Please enter a valid number of days")
        return
      }

      const newEndDate = new Date()
      newEndDate.setDate(newEndDate.getDate() + days)

      const updateData: any = {}

      // If user is on trial, extend trial date
      if (selectedUser.role === "FREE_TRIAL") {
        updateData.trialEndsAt = newEndDate.toISOString()
      }
      // If user is PRO, extend subscription date
      else if (selectedUser.role === "PRO") {
        updateData.subscriptionEndsAt = newEndDate.toISOString()
      }

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        fetchUsers()
        setShowTrialDialog(false)
        setSelectedUser(null)
      }
    } catch (error) {
      console.error("Error extending trial:", error)
    }
  }

  const handleChangeRole = async (userId: string, newRole: "ADMIN" | "PRO" | "FREE_TRIAL") => {
    try {
      const updateData: any = { role: newRole }

      // If upgrading to PRO, set subscription end date to 1 month from now and clear trial
      if (newRole === "PRO") {
        const subscriptionEnd = new Date()
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1)
        updateData.subscriptionEndsAt = subscriptionEnd.toISOString()
        updateData.trialEndsAt = null // Clear trial date
      }

      // If downgrading to FREE_TRIAL, clear subscription and set trial
      if (newRole === "FREE_TRIAL") {
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 14) // 14 days trial
        updateData.trialEndsAt = trialEnd.toISOString()
        updateData.subscriptionEndsAt = null // Clear subscription date
      }

      // If upgrading to ADMIN, clear both dates
      if (newRole === "ADMIN") {
        updateData.trialEndsAt = null
        updateData.subscriptionEndsAt = null
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Error changing role:", error)
    }
  }

  const getStatusBadge = (user: User) => {
    if (user.role === "ADMIN") {
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300">Admin</Badge>
    }

    if (user.role === "PRO") {
      const isExpired = user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) < new Date()
      return (
        <Badge className={isExpired
          ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300"
          : "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300"
        }>
          {isExpired ? "Expired Pro" : "Pro"}
        </Badge>
      )
    }

    const isExpired = user.trialEndsAt && new Date(user.trialEndsAt) < new Date()
    return (
      <Badge className={isExpired
        ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300"
        : "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
      }>
        {isExpired ? "Trial Expired" : "Free Trial"}
      </Badge>
    )
  }

  const getDaysRemaining = (user: User) => {
    const endDate = user.role === "PRO" ? user.subscriptionEndsAt : user.trialEndsAt
    if (!endDate) return null

    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 0 ? diffDays : 0
  }

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "ADMIN").length,
    pro: users.filter(u => u.role === "PRO").length,
    trial: users.filter(u => u.role === "FREE_TRIAL").length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground">Manage users and subscriptions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-3xl text-purple-600 dark:text-purple-400">{stats.admins}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pro Users</CardDescription>
            <CardTitle className="text-3xl text-green-600 dark:text-green-400">{stats.pro}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trial Users</CardDescription>
            <CardTitle className="text-3xl text-blue-600 dark:text-blue-400">{stats.trial}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage user subscriptions and roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name || "No name"}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.workspaceMembers[0]?.workspace.name || "No workspace"}
                  </TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell>
                    {user.role === "ADMIN" ? (
                      <span className="text-muted-foreground">∞</span>
                    ) : (
                      <span className={getDaysRemaining(user) === 0 ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                        {getDaysRemaining(user)} days
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleChangeRole(user.id, value as any)}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FREE_TRIAL">Free Trial</SelectItem>
                          <SelectItem value="PRO">Pro</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {user.role !== "ADMIN" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTrialDialog(user)}
                        >
                          + Add Days
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

            {/* Add Days Dialog */}
      <Dialog open={showTrialDialog} onOpenChange={setShowTrialDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.role === "FREE_TRIAL" ? "Extend Free Trial" : "Extend Subscription"}
            </DialogTitle>
            <DialogDescription>
              Add days to {selectedUser?.name || selectedUser?.email}'s {selectedUser?.role === "FREE_TRIAL" ? "trial period" : "subscription"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trialDays">Number of Days</Label>
              <Input
                id="trialDays"
                type="number"
                min="1"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                placeholder="Enter number of days"
              />
              <p className="text-sm text-muted-foreground">
                {selectedUser?.role === "FREE_TRIAL"
                  ? "Days will be added to the trial end date from today."
                  : "Days will be added to the subscription end date from today."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrialDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtendTrial}>
              Add {trialDays} Days
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
