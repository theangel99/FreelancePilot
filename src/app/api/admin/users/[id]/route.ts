import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/subscription"
import { z } from "zod"

const updateUserSchema = z.object({
  role: z.enum(["ADMIN", "PRO", "FREE_TRIAL"]).optional(),
  trialEndsAt: z.string().optional().nullable(),
  subscriptionEndsAt: z.string().optional().nullable(),
})

// PATCH /api/admin/users/[id] - Update user (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const updateData: any = {}
    if (validatedData.role) updateData.role = validatedData.role
    if (validatedData.trialEndsAt !== undefined) {
      updateData.trialEndsAt = validatedData.trialEndsAt ? new Date(validatedData.trialEndsAt) : null
    }
    if (validatedData.subscriptionEndsAt !== undefined) {
      updateData.subscriptionEndsAt = validatedData.subscriptionEndsAt ? new Date(validatedData.subscriptionEndsAt) : null
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
