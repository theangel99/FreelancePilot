"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Crown, Zap, Clock } from "lucide-react"

type SubscriptionInfo = {
  role: "ADMIN" | "PRO" | "FREE_TRIAL"
  status: "active" | "trial" | "expired" | "admin"
  daysRemaining: number | null
}

export function SubscriptionBadge() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/user/subscription")
        if (response.ok) {
          const data = await response.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error("Error fetching subscription:", error)
      }
    }

    fetchSubscription()
  }, [])

  if (!subscription) return null

  if (subscription.status === "admin") {
    return (
      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30">
        <Crown className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    )
  }

  if (subscription.status === "active") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30">
        <Zap className="h-3 w-3 mr-1" />
        Pro
      </Badge>
    )
  }

  if (subscription.status === "trial") {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30">
        <Clock className="h-3 w-3 mr-1" />
        Trial ({subscription.daysRemaining} days left)
      </Badge>
    )
  }

  return (
    <Badge className="bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30">
      Expired
    </Badge>
  )
}
