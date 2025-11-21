import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Update user's onboarding status
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        onboardingCompleted: true,
        onboardingStep: 4, // Final step
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error completing onboarding:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
