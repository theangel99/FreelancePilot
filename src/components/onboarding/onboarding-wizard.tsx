"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Sparkles, Users, FolderKanban, CheckSquare, DollarSign, Rocket, ArrowRight, ArrowLeft, User, Briefcase } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type OnboardingStep = {
  title: string
  description: string
  icon: React.ReactNode
  content: React.ReactNode
}

interface OnboardingWizardProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingWizard({ isOpen, onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoadingSampleData, setIsLoadingSampleData] = useState(false)
  const [sampleDataLoaded, setSampleDataLoaded] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const router = useRouter()

  // Profile form state
  const [profileData, setProfileData] = useState({
    jobTitle: "",
    defaultHourlyRate: "",
    phone: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    preferredCurrency: "EUR",
    companyName: "",
    address: "",
    city: "",
    country: "",
  })

  const handleLoadSampleData = async () => {
    setIsLoadingSampleData(true)
    try {
      const response = await fetch("/api/onboarding/sample-data", {
        method: "POST",
      })

      if (response.ok) {
        setSampleDataLoaded(true)
      } else {
        console.error("Failed to load sample data")
      }
    } catch (error) {
      console.error("Error loading sample data:", error)
    } finally {
      setIsLoadingSampleData(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      const response = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      })

      if (response.ok) {
        // Move to next step after saving
        setCurrentStep(currentStep + 1)
      } else {
        console.error("Failed to save profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleComplete = async () => {
    try {
      await fetch("/api/onboarding/complete", {
        method: "POST",
      })
      onClose()
      router.refresh()
    } catch (error) {
      console.error("Error completing onboarding:", error)
    }
  }

  const steps: OnboardingStep[] = [
    {
      title: "Welcome to FreelancePilot!",
      description: "Your all-in-one platform for managing your freelance business",
      icon: <Sparkles className="h-8 w-8 text-purple-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-3">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600 mb-4">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold">Let's Get You Started!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We'll walk you through the key features of FreelancePilot and help you set up your workspace.
              This will only take a few minutes.
            </p>
          </div>

          <div className="grid gap-3 max-w-md mx-auto">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Client Management</div>
                <div className="text-sm text-muted-foreground">Track leads, clients, and relationships</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Project & Task Tracking</div>
                <div className="text-sm text-muted-foreground">Organize work and stay on schedule</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Time Tracking & Invoicing</div>
                <div className="text-sm text-muted-foreground">Track hours and get paid faster</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Set Up Your Profile",
      description: "Tell us about your business",
      icon: <User className="h-8 w-8 text-blue-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 mb-2">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold">Complete Your Profile</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              This information will be used for invoices, time tracking, and personalizing your experience.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title / Role</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Freelance Designer"
                  value={profileData.jobTitle}
                  onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">How you describe yourself professionally</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultHourlyRate">Default Hourly Rate</Label>
                <Input
                  id="defaultHourlyRate"
                  type="number"
                  placeholder="e.g., 85"
                  value={profileData.defaultHourlyRate}
                  onChange={(e) => setProfileData({ ...profileData, defaultHourlyRate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Your standard rate for time tracking</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">For client communications</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredCurrency">Preferred Currency</Label>
                <Select
                  value={profileData.preferredCurrency}
                  onValueChange={(value) => setProfileData({ ...profileData, preferredCurrency: value })}
                >
                  <SelectTrigger id="preferredCurrency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Used for invoices and reports</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Company Information (for Invoices)
              </h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Your Business Name"
                    value={profileData.companyName}
                    onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Street address"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="Country"
                      value={profileData.country}
                      onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> You can skip this step and complete it later in your settings. This information helps generate professional invoices.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Core Features",
      description: "Everything you need to run your freelance business",
      icon: <FolderKanban className="h-8 w-8 text-purple-600" />,
      content: (
        <div className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-base">Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Manage your client relationships, track leads through your pipeline, and maintain detailed contact information.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
                  <FolderKanban className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-base">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Create projects for your clients, set budgets, track progress, and manage deliverables all in one place.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
                  <CheckSquare className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-base">Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Break down projects into tasks, set priorities and due dates, and track your progress with ease.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </div>
                <CardTitle className="text-base">Invoicing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Create professional invoices, track payments, and monitor your revenue - all with just a few clicks.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      title: "Try It Out",
      description: "Load sample data to explore FreelancePilot",
      icon: <Sparkles className="h-8 w-8 text-yellow-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-2">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold">Load Sample Data</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We can populate your workspace with sample clients, projects, and invoices so you can explore the platform right away.
            </p>
          </div>

          {sampleDataLoaded ? (
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border-2 border-green-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-900 dark:text-green-100">Sample Data Loaded!</div>
                    <div className="text-sm text-green-700 dark:text-green-300">Your workspace has been populated with example data.</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-xs text-muted-foreground">Clients</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">2</div>
                  <div className="text-xs text-muted-foreground">Projects</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">1</div>
                  <div className="text-xs text-muted-foreground">Invoice</div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                You can delete this sample data anytime and add your own real clients and projects.
              </p>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border-2 border-dashed">
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-foreground">✓</span>
                    <span>3 sample clients (Active, Prospect, Lead)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-foreground">✓</span>
                    <span>2 projects with tasks</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-foreground">✓</span>
                    <span>1 sample invoice</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-foreground">✓</span>
                    <span>Time entries and analytics</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleLoadSampleData}
                disabled={isLoadingSampleData}
                className="w-full"
                size="lg"
              >
                {isLoadingSampleData ? "Loading..." : "Load Sample Data"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You can skip this step and start with a clean workspace
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "You're All Set!",
      description: "Start managing your freelance business",
      icon: <Rocket className="h-8 w-8 text-green-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-3">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-4">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold">Ready to Launch!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You're all set to start managing your freelance business with FreelancePilot.
            </p>
          </div>

          <Card className="max-w-md mx-auto border-2">
            <CardHeader>
              <CardTitle className="text-base">Quick Start Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className={sampleDataLoaded ? "line-through text-muted-foreground" : ""}>
                  Add your first client
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className={sampleDataLoaded ? "line-through text-muted-foreground" : ""}>
                  Create a project
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 rounded-full border-2" />
                <span>Set up company settings for invoices</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 rounded-full border-2" />
                <span>Track your first time entry</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 rounded-full border-2" />
                <span>Create your first invoice</span>
              </div>
            </CardContent>
          </Card>

          <div className="max-w-md mx-auto">
            <Button
              onClick={handleComplete}
              className="w-full"
              size="lg"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      ),
    },
  ]

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStepData.icon}
              <div>
                <DialogTitle className="text-xl">{currentStepData.title}</DialogTitle>
                <DialogDescription>{currentStepData.description}</DialogDescription>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </DialogHeader>

        <Progress value={progress} className="h-2" />

        <div className="min-h-[300px]">
          {currentStepData.content}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <>
                <Button
                  variant="ghost"
                  onClick={handleComplete}
                >
                  Skip Tutorial
                </Button>
                {currentStep === 1 ? (
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? "Saving..." : "Save & Continue"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={handleComplete}
                size="lg"
                className="px-8"
              >
                Complete Setup
                <Rocket className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
