"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Building2, User as UserIcon, Briefcase, MapPin, Phone } from "lucide-react"
import { CURRENCIES } from "@/lib/currency"
import { AvatarUpload } from "@/components/ui/avatar-upload"

type CompanySettings = {
  id: string
  companyName: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  website: string | null
  taxId: string | null
  invoicePrefix: string
  nextInvoiceNumber: number
  defaultTaxRate: number
  defaultCurrency: string
  defaultTerms: string | null
}

type UserPreferences = {
  id: string
  name: string | null
  email: string
  image: string | null
  preferredCurrency: string
  jobTitle: string | null
  bio: string | null
  defaultHourlyRate: number | null
  phone: string | null
  website: string | null
  linkedinUrl: string | null
  twitterUrl: string | null
  address: string | null
  city: string | null
  country: string | null
  timezone: string | null
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingUser, setIsSavingUser] = useState(false)
  const [error, setError] = useState("")
  const [userError, setUserError] = useState("")
  const [success, setSuccess] = useState(false)
  const [userSuccess, setUserSuccess] = useState(false)

  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    website: "",
    taxId: "",
    invoicePrefix: "",
    defaultTaxRate: 0,
    defaultCurrency: "EUR",
    defaultTerms: "",
  })

  const [userFormData, setUserFormData] = useState({
    name: "",
    image: "",
    preferredCurrency: "EUR",
    jobTitle: "",
    bio: "",
    defaultHourlyRate: 0,
    phone: "",
    website: "",
    linkedinUrl: "",
    twitterUrl: "",
    address: "",
    city: "",
    country: "",
    timezone: "UTC",
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch company settings
        const companyResponse = await fetch("/api/settings/company")
        if (companyResponse.ok) {
          const data = await companyResponse.json()
          setSettings(data)
          setFormData({
            companyName: data.companyName || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            zipCode: data.zipCode || "",
            country: data.country || "",
            website: data.website || "",
            taxId: data.taxId || "",
            invoicePrefix: data.invoicePrefix || "",
            defaultTaxRate: data.defaultTaxRate || 0,
            defaultCurrency: data.defaultCurrency || "EUR",
            defaultTerms: data.defaultTerms || "",
          })
        }

        // Fetch user preferences
        const userResponse = await fetch("/api/user")
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUserPreferences(userData)
          setUserFormData({
            name: userData.name || "",
            image: userData.image || "",
            preferredCurrency: userData.preferredCurrency || "EUR",
            jobTitle: userData.jobTitle || "",
            bio: userData.bio || "",
            defaultHourlyRate: userData.defaultHourlyRate || 0,
            phone: userData.phone || "",
            website: userData.website || "",
            linkedinUrl: userData.linkedinUrl || "",
            twitterUrl: userData.twitterUrl || "",
            address: userData.address || "",
            city: userData.city || "",
            country: userData.country || "",
            timezone: userData.timezone || "UTC",
          })
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        setError("Failed to load settings")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to save settings")
        return
      }

      const updatedSettings = await response.json()
      setSettings(updatedSettings)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      setError("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingUser(true)
    setUserError("")
    setUserSuccess(false)

    try {
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userFormData),
      })

      if (!response.ok) {
        const data = await response.json()
        setUserError(data.error || "Failed to save preferences")
        return
      }

      const updatedUser = await response.json()
      setUserPreferences(updatedUser)
      setUserSuccess(true)
      setTimeout(() => setUserSuccess(false), 3000)
    } catch (error) {
      setUserError("Failed to save preferences")
    } finally {
      setIsSavingUser(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal preferences and company information
        </p>
      </div>

      {/* Personal Preferences */}
      <form onSubmit={handleUserSubmit} className="space-y-6">
        {userError && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
            {userError}
          </div>
        )}

        {userSuccess && (
          <div className="bg-green-50 text-green-800 p-3 rounded-md text-sm">
            Preferences saved successfully!
          </div>
        )}

        {/* Profile Picture & Basic Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>
              Update your personal information and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <AvatarUpload
                currentImage={userFormData.image}
                name={userFormData.name}
                onUpload={(imageUrl) => setUserFormData({ ...userFormData, image: imageUrl })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Name</Label>
                <Input
                  id="userName"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userPreferences?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed (used for login)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredCurrency">Preferred Currency</Label>
              <Select
                value={userFormData.preferredCurrency}
                onValueChange={(value) => setUserFormData({ ...userFormData, preferredCurrency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} ({currency.symbol}) - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                All amounts in your dashboard and reports will be converted to this currency for display
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              <CardTitle>Professional Information</CardTitle>
            </div>
            <CardDescription>
              Your professional details and default rates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title / Role</Label>
              <Input
                id="jobTitle"
                value={userFormData.jobTitle}
                onChange={(e) => setUserFormData({ ...userFormData, jobTitle: e.target.value })}
                placeholder="e.g., Freelance Web Developer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={userFormData.bio}
                onChange={(e) => setUserFormData({ ...userFormData, bio: e.target.value })}
                rows={4}
                placeholder="Tell us about yourself and your work..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultHourlyRate">Default Hourly Rate ({userFormData.preferredCurrency})</Label>
              <Input
                id="defaultHourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={userFormData.defaultHourlyRate}
                onChange={(e) => setUserFormData({ ...userFormData, defaultHourlyRate: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                This will be used as the default rate for new projects
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              <CardTitle>Contact Information</CardTitle>
            </div>
            <CardDescription>
              How clients can reach you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website / Portfolio</Label>
                <Input
                  id="website"
                  type="url"
                  value={userFormData.website}
                  onChange={(e) => setUserFormData({ ...userFormData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={userFormData.linkedinUrl}
                  onChange={(e) => setUserFormData({ ...userFormData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitterUrl">Twitter / X URL</Label>
                <Input
                  id="twitterUrl"
                  type="url"
                  value={userFormData.twitterUrl}
                  onChange={(e) => setUserFormData({ ...userFormData, twitterUrl: e.target.value })}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <CardTitle>Location</CardTitle>
            </div>
            <CardDescription>
              Your location and timezone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={userFormData.address}
                onChange={(e) => setUserFormData({ ...userFormData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={userFormData.city}
                  onChange={(e) => setUserFormData({ ...userFormData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={userFormData.country}
                  onChange={(e) => setUserFormData({ ...userFormData, country: e.target.value })}
                  placeholder="Country"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={userFormData.timezone}
                onValueChange={(value) => setUserFormData({ ...userFormData, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin (CET/CEST)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                  <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney (AEDT/AEST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSavingUser}>
            <Save className="h-4 w-4 mr-2" />
            {isSavingUser ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </form>

      {/* Company Settings */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-800 p-3 rounded-md text-sm">
            Company settings saved successfully!
          </div>
        )}

        {/* Company Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Company Information</CardTitle>
            </div>
            <CardDescription>
              This information will appear on your invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
            <CardDescription>
              Configure default settings for your invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Number Prefix *</Label>
                <Input
                  id="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  required
                  placeholder="INV"
                />
                <p className="text-xs text-muted-foreground">
                  {settings && `Next invoice: ${formData.invoicePrefix}-${settings.nextInvoiceNumber.toString().padStart(4, '0')}`}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Default Invoice Currency *</Label>
                <Select value={formData.defaultCurrency} onValueChange={(value) => setFormData({ ...formData, defaultCurrency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} ({currency.symbol}) - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Default currency pre-selected when creating new invoices (you can change it per invoice)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                <Input
                  id="defaultTaxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.defaultTaxRate}
                  onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultTerms">Default Payment Terms</Label>
              <Textarea
                id="defaultTerms"
                value={formData.defaultTerms}
                onChange={(e) => setFormData({ ...formData, defaultTerms: e.target.value })}
                rows={4}
                placeholder="Payment is due within 30 days..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  )
}
