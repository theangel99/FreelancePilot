"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { OnboardingWizard } from "./onboarding-wizard"

export function OnboardingProvider() {
  const { data: session } = useSession()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!session?.user?.email) {
        setIsChecking(false)
        return
      }

      try {
        const response = await fetch("/api/onboarding/status")
        if (response.ok) {
          const data = await response.json()
          setShowOnboarding(!data.onboardingCompleted)
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error)
      } finally {
        setIsChecking(false)
      }
    }

    checkOnboardingStatus()
  }, [session])

  if (isChecking) {
    return null
  }

  return (
    <OnboardingWizard
      isOpen={showOnboarding}
      onClose={() => setShowOnboarding(false)}
    />
  )
}
