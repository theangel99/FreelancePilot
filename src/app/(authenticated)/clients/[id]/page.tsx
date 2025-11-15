"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Mail, Phone, Globe, Linkedin, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ClientDialog } from "@/components/clients/client-dialog"
import { format } from "date-fns"

const statusColors = {
  LEAD: "bg-blue-100 text-blue-800",
  PROSPECT: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  LOST: "bg-red-100 text-red-800",
}

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [client, setClient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
      } else {
        router.push("/clients")
      }
    } catch (error) {
      console.error("Error fetching client:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchClient()
    }
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this client?")) return

    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/clients")
      }
    } catch (error) {
      console.error("Error deleting client:", error)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!client) {
    return <div className="text-center py-8">Client not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">{client.company || "No company"}</p>
          </div>
          <Badge className={statusColors[client.status as keyof typeof statusColors]}>
            {client.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                  {client.phone}
                </a>
              </div>
            )}
            {client.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {client.website}
                </a>
              </div>
            )}
            {client.linkedin && (
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-muted-foreground" />
                <a href={client.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  LinkedIn Profile
                </a>
              </div>
            )}
            {client.twitter && (
              <div className="flex items-center gap-2">
                <Twitter className="h-4 w-4 text-muted-foreground" />
                <span>{client.twitter}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Industry:</div>
              <div>{client.industry || "-"}</div>

              <div className="text-muted-foreground">Company Size:</div>
              <div>{client.companySize || "-"}</div>

              <div className="text-muted-foreground">Lead Source:</div>
              <div>{client.leadSource?.replace("_", " ") || "-"}</div>

              <div className="text-muted-foreground">Referred By:</div>
              <div>{client.referredBy || "-"}</div>

              <div className="text-muted-foreground">First Contact:</div>
              <div>{client.firstContactDate ? format(new Date(client.firstContactDate), "MMM d, yyyy") : "-"}</div>

              <div className="text-muted-foreground">Last Contact:</div>
              <div>{client.lastContactDate ? format(new Date(client.lastContactDate), "MMM d, yyyy") : "-"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent>
            {client.address || client.city || client.country ? (
              <address className="not-italic text-sm space-y-1">
                {client.address && <div>{client.address}</div>}
                <div>
                  {[client.city, client.state, client.zipCode].filter(Boolean).join(", ")}
                </div>
                {client.country && <div>{client.country}</div>}
              </address>
            ) : (
              <p className="text-sm text-muted-foreground">No address on file</p>
            )}
          </CardContent>
        </Card>

        {/* Projects & Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Projects:</span>
                <span className="font-semibold">{client.projects?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoices:</span>
                <span className="font-semibold">{client.invoices?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client Since:</span>
                <span>{format(new Date(client.createdAt), "MMM d, yyyy")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      {client.tags && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {client.tags.split(",").map((tag: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {client.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      <ClientDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          fetchClient()
        }}
        client={client}
      />
    </div>
  )
}
