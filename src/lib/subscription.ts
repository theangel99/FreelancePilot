import { User } from "@/generated/prisma"

export type SubscriptionStatus = "active" | "trial" | "expired" | "admin"

export function getSubscriptionStatus(user: User): SubscriptionStatus {
  // Admins always have access
  if (user.role === "ADMIN") {
    return "admin"
  }

  // Pro users with active subscription
  if (user.role === "PRO") {
    if (user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > new Date()) {
      return "active"
    }
    return "expired"
  }

  // Free trial users
  if (user.role === "FREE_TRIAL") {
    if (user.trialEndsAt && new Date(user.trialEndsAt) > new Date()) {
      return "trial"
    }
    return "expired"
  }

  return "expired"
}

export function hasAccess(user: User): boolean {
  const status = getSubscriptionStatus(user)
  return status === "active" || status === "trial" || status === "admin"
}

export function isAdmin(user: User): boolean {
  return user.role === "ADMIN"
}

export function getDaysRemaining(user: User): number | null {
  if (user.role === "ADMIN") return null

  const endDate = user.role === "PRO" ? user.subscriptionEndsAt : user.trialEndsAt
  if (!endDate) return null

  const now = new Date()
  const end = new Date(endDate)
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays > 0 ? diffDays : 0
}

export function getTrialEndDate(): Date {
  const date = new Date()
  date.setDate(date.getDate() + 30) // 30 days from now
  return date
}
