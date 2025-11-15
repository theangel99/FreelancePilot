import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "./auth"
import { prisma } from "./prisma"
import { cache } from "react"

export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return session
}

// Cache the workspace lookup for the duration of the request
// This prevents duplicate queries when multiple API routes are called
export const getWorkspace = cache(async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  // Fetch workspace member with workspace in a single query
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })

  if (!workspaceMember) {
    return null
  }

  return {
    userId: session.user.id,
    userEmail: session.user.email,
    workspaceId: workspaceMember.workspaceId,
    workspace: workspaceMember.workspace,
    role: workspaceMember.role,
  }
})

// Helper for API routes that require workspace access
export async function requireWorkspace() {
  const workspace = await getWorkspace()

  if (!workspace) {
    throw new Error("No workspace found")
  }

  return workspace
}
