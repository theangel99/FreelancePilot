"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, X } from "lucide-react"
import Link from "next/link"

export function WelcomeBanner() {
  const { data: session } = useSession()
  const [isVisible, setIsVisible] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    const checkIfNewUser = async () => {
      if (!session?.user?.email) return

      try {
        // Check if user has any clients, projects, or invoices
        const response = await fetch("/api/dashboard/stats")
        if (response.ok) {
          const data = await response.json()
          const hasData = data.totalClients > 0 || data.allProjects > 0 || data.recentInvoices.length > 0

          // Check if banner was dismissed
          const dismissed = localStorage.getItem("welcome-banner-dismissed")

          if (!hasData && !dismissed) {
            setIsNewUser(true)
            setIsVisible(true)
          }
        }
      } catch (error) {
        console.error("Error checking user data:", error)
      }
    }

    checkIfNewUser()
  }, [session])

  const handleDismiss = () => {
    localStorage.setItem("welcome-banner-dismissed", "true")
    setIsVisible(false)
  }

  if (!isVisible || !isNewUser) {
    return null
  }

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 dark:border-purple-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold">Welcome to FreelancePilot!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Get started by adding your first client or explore with sample data.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/clients/new">
                  <Button size="sm">
                    Add Your First Client
                  </Button>
                </Link>
                <Link href="/projects/new">
                  <Button size="sm" variant="outline">
                    Create a Project
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
