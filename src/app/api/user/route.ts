import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { CURRENCIES } from "@/lib/currency"

// GET /api/user - Get user preferences
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        preferredCurrency: true,
        jobTitle: true,
        bio: true,
        defaultHourlyRate: true,
        phone: true,
        website: true,
        linkedinUrl: true,
        twitterUrl: true,
        address: true,
        city: true,
        country: true,
        timezone: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/user - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const {
      name,
      image,
      preferredCurrency,
      jobTitle,
      bio,
      defaultHourlyRate,
      phone,
      website,
      linkedinUrl,
      twitterUrl,
      address,
      city,
      country,
      timezone,
    } = body

    // Validate currency
    if (preferredCurrency && !CURRENCIES.find((c) => c.code === preferredCurrency)) {
      return NextResponse.json({ error: "Invalid currency code" }, { status: 400 })
    }

    // Build update data object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (image !== undefined) updateData.image = image
    if (preferredCurrency) updateData.preferredCurrency = preferredCurrency
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle
    if (bio !== undefined) updateData.bio = bio
    if (defaultHourlyRate !== undefined) updateData.defaultHourlyRate = defaultHourlyRate
    if (phone !== undefined) updateData.phone = phone
    if (website !== undefined) updateData.website = website
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl
    if (twitterUrl !== undefined) updateData.twitterUrl = twitterUrl
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (country !== undefined) updateData.country = country
    if (timezone !== undefined) updateData.timezone = timezone

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        preferredCurrency: true,
        jobTitle: true,
        bio: true,
        defaultHourlyRate: true,
        phone: true,
        website: true,
        linkedinUrl: true,
        twitterUrl: true,
        address: true,
        city: true,
        country: true,
        timezone: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
