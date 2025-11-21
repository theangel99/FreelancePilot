import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const profileSchema = z.object({
  jobTitle: z.string().optional(),
  defaultHourlyRate: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  preferredCurrency: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    // Get user's workspace
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    })

    if (!user || user.workspaceMembers.length === 0) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 404 }
      )
    }

    const workspace = user.workspaceMembers[0].workspace
    const workspaceId = workspace.id

    // Prepare user update data
    const userUpdateData: any = {}
    if (validatedData.jobTitle) userUpdateData.jobTitle = validatedData.jobTitle
    if (validatedData.phone) userUpdateData.phone = validatedData.phone
    if (validatedData.timezone) userUpdateData.timezone = validatedData.timezone
    if (validatedData.preferredCurrency) userUpdateData.preferredCurrency = validatedData.preferredCurrency
    if (validatedData.address) userUpdateData.address = validatedData.address
    if (validatedData.city) userUpdateData.city = validatedData.city
    if (validatedData.country) userUpdateData.country = validatedData.country

    // Convert hourly rate to float
    if (validatedData.defaultHourlyRate) {
      const rate = parseFloat(validatedData.defaultHourlyRate)
      if (!isNaN(rate)) {
        userUpdateData.defaultHourlyRate = rate
      }
    }

    // Update user profile
    await prisma.user.update({
      where: { email: session.user.email },
      data: userUpdateData,
    })

    // Update or create company settings if company name is provided
    if (validatedData.companyName) {
      const existingSettings = await prisma.companySettings.findUnique({
        where: { workspaceId },
      })

      const companyData: any = {
        companyName: validatedData.companyName,
      }

      if (validatedData.phone) companyData.phone = validatedData.phone
      if (validatedData.address) companyData.address = validatedData.address
      if (validatedData.city) companyData.city = validatedData.city
      if (validatedData.country) companyData.country = validatedData.country
      if (validatedData.preferredCurrency) companyData.defaultCurrency = validatedData.preferredCurrency

      if (existingSettings) {
        await prisma.companySettings.update({
          where: { workspaceId },
          data: companyData,
        })
      } else {
        await prisma.companySettings.create({
          data: {
            workspaceId,
            ...companyData,
          },
        })
      }
    }

    // Update workspace member hourly rate if provided
    if (validatedData.defaultHourlyRate) {
      const rate = parseFloat(validatedData.defaultHourlyRate)
      if (!isNaN(rate)) {
        await prisma.workspaceMember.updateMany({
          where: {
            workspaceId,
            userId: user.id,
          },
          data: {
            hourlyRate: rate,
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
