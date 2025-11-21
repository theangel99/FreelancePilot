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

    // Get the user's workspace
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

    // Check if sample data already exists
    const existingClients = await prisma.client.count({
      where: { workspaceId },
    })

    if (existingClients > 0) {
      return NextResponse.json(
        { error: "Workspace already has data" },
        { status: 400 }
      )
    }

    // Create sample clients
    const activeClient = await prisma.client.create({
      data: {
        workspaceId,
        name: "Acme Corporation",
        email: "contact@acmecorp.com",
        phone: "+1 (555) 123-4567",
        company: "Acme Corp",
        website: "https://acmecorp.com",
        address: "123 Business St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94102",
        country: "USA",
        industry: "Technology",
        companySize: "50-200",
        status: "ACTIVE",
        leadSource: "REFERRAL",
        firstContactDate: new Date("2024-01-15"),
        lastContactDate: new Date(),
        notes: "Great long-term client. Prefers weekly check-ins.",
      },
    })

    const prospectClient = await prisma.client.create({
      data: {
        workspaceId,
        name: "TechStart Inc",
        email: "hello@techstart.io",
        phone: "+1 (555) 987-6543",
        company: "TechStart",
        website: "https://techstart.io",
        address: "456 Startup Ave",
        city: "Austin",
        state: "TX",
        zipCode: "78701",
        country: "USA",
        industry: "Software",
        companySize: "10-50",
        status: "PROSPECT",
        leadSource: "WEBSITE",
        firstContactDate: new Date("2024-11-01"),
        lastContactDate: new Date("2024-11-15"),
        notes: "In discussion for a 3-month project. Budget confirmed.",
      },
    })

    const leadClient = await prisma.client.create({
      data: {
        workspaceId,
        name: "Global Ventures",
        email: "contact@globalventures.com",
        company: "Global Ventures",
        status: "LEAD",
        leadSource: "NETWORKING",
        firstContactDate: new Date("2024-11-18"),
        notes: "Met at tech conference. Interested in Q1 2025 project.",
      },
    })

    // Create sample projects
    const activeProject = await prisma.project.create({
      data: {
        workspaceId,
        clientId: activeClient.id,
        name: "Website Redesign",
        description: "Complete redesign of corporate website with modern UI/UX",
        status: "ACTIVE",
        billingType: "HOURLY",
        startDate: new Date("2024-10-01"),
        endDate: new Date("2024-12-31"),
        budget: 15000,
        hourlyRate: 85,
        color: "#3b82f6",
      },
    })

    const planningProject = await prisma.project.create({
      data: {
        workspaceId,
        clientId: activeClient.id,
        name: "Mobile App Development",
        description: "iOS and Android app for customer engagement",
        status: "PLANNING",
        billingType: "FIXED_FEE",
        startDate: new Date("2025-01-15"),
        budget: 35000,
        fixedPrice: 35000,
        color: "#10b981",
      },
    })

    // Create sample tasks
    const tasks = await Promise.all([
      prisma.task.create({
        data: {
          workspaceId,
          projectId: activeProject.id,
          title: "Design homepage mockups",
          description: "Create 3 design variations for the new homepage",
          status: "COMPLETED",
          priority: "HIGH",
          estimatedHours: 8,
          completedAt: new Date("2024-10-15"),
        },
      }),
      prisma.task.create({
        data: {
          workspaceId,
          projectId: activeProject.id,
          title: "Implement responsive navigation",
          description: "Build mobile-friendly navigation component",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          estimatedHours: 6,
        },
      }),
      prisma.task.create({
        data: {
          workspaceId,
          projectId: activeProject.id,
          title: "Set up content management system",
          description: "Configure CMS for easy content updates",
          status: "TODO",
          priority: "MEDIUM",
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          estimatedHours: 12,
        },
      }),
      prisma.task.create({
        data: {
          workspaceId,
          projectId: planningProject.id,
          title: "Define app requirements",
          description: "Document all features and user stories",
          status: "TODO",
          priority: "URGENT",
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          estimatedHours: 10,
        },
      }),
    ])

    // Create sample time entries
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() - 30) // Start 30 days ago

    const timeEntries = []
    for (let i = 0; i < 15; i++) {
      const entryDate = new Date(baseDate)
      entryDate.setDate(entryDate.getDate() + i * 2) // Every 2 days

      const startTime = new Date(entryDate)
      startTime.setHours(9, 0, 0, 0)

      const endTime = new Date(entryDate)
      const hoursWorked = 2 + Math.floor(Math.random() * 4) // 2-5 hours
      endTime.setHours(9 + hoursWorked, 0, 0, 0)

      const duration = (endTime.getTime() - startTime.getTime()) / 1000 // Duration in seconds

      timeEntries.push(
        prisma.timeEntry.create({
          data: {
            workspaceId,
            userId: user.id,
            projectId: activeProject.id,
            taskId: tasks[i % 3].id, // Rotate through first 3 tasks
            description: `Working on ${tasks[i % 3].title}`,
            startTime,
            endTime,
            duration,
            hourlyRate: 85,
            billable: true,
            invoiced: false,
          },
        })
      )
    }

    await Promise.all(timeEntries)

    // Calculate invoice amounts
    const billableTimeEntries = await prisma.timeEntry.findMany({
      where: {
        workspaceId,
        projectId: activeProject.id,
        billable: true,
        invoiced: false,
      },
    })

    const totalHours = billableTimeEntries.reduce((sum, entry) => {
      return sum + (entry.duration || 0) / 3600 // Convert seconds to hours
    }, 0)

    const subtotal = totalHours * 85
    const taxRate = 10
    const tax = subtotal * (taxRate / 100)
    const total = subtotal + tax

    // Get next invoice number
    const companySettings = await prisma.companySettings.findUnique({
      where: { workspaceId },
    })

    let invoiceNumber = "INV-0001"
    if (companySettings) {
      const prefix = companySettings.invoicePrefix || "INV"
      const nextNum = companySettings.nextInvoiceNumber || 1
      invoiceNumber = `${prefix}-${String(nextNum).padStart(4, "0")}`

      // Update next invoice number
      await prisma.companySettings.update({
        where: { workspaceId },
        data: { nextInvoiceNumber: nextNum + 1 },
      })
    } else {
      // Create company settings if doesn't exist
      await prisma.companySettings.create({
        data: {
          workspaceId,
          companyName: workspace.name,
          invoicePrefix: "INV",
          nextInvoiceNumber: 2,
        },
      })
    }

    // Create sample invoice
    const invoice = await prisma.invoice.create({
      data: {
        workspaceId,
        clientId: activeClient.id,
        invoiceNumber,
        status: "SENT",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        subtotal,
        tax,
        taxRate,
        discount: 0,
        total,
        currency: "USD",
        notes: "Thank you for your business!",
        terms: "Payment due within 30 days",
        createdById: user.id,
      },
    })

    // Create invoice item
    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        projectId: activeProject.id,
        description: `Website Redesign - ${totalHours.toFixed(2)} hours @ $85/hr`,
        quantity: totalHours,
        unitPrice: 85,
        amount: subtotal,
      },
    })

    // Mark time entries as invoiced
    await prisma.timeEntry.updateMany({
      where: {
        workspaceId,
        projectId: activeProject.id,
        billable: true,
        invoiced: false,
      },
      data: { invoiced: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        clients: 3,
        projects: 2,
        tasks: 4,
        timeEntries: 15,
        invoices: 1,
      },
    })
  } catch (error) {
    console.error("Error creating sample data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
