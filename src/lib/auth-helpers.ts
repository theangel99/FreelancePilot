import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "./auth"

export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return session
}
