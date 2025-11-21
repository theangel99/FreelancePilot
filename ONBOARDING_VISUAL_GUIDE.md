# Onboarding Wizard - Visual Guide

## What You'll See When Testing

### 1. New User Signup Flow

```
User signs up → Redirected to Dashboard → Onboarding Wizard Appears Automatically
```

---

## Onboarding Wizard Steps

### Step 1/4: Welcome Screen

**Visual Elements:**
- Large purple/blue gradient rocket icon
- "Let's Get You Started!" heading
- Description text
- Three feature checkboxes with green checkmarks:
  - ✓ Client Management
  - ✓ Project & Task Tracking
  - ✓ Time Tracking & Invoicing
- Progress bar at 25%
- "Back" (disabled) and "Next" buttons
- "Skip Tutorial" option

**User sees:** Welcoming introduction to FreelancePilot

---

### Step 2/4: Core Features

**Visual Elements:**
- 4 feature cards in a 2x2 grid:
  1. **Clients** (Blue icon)
     - User icon
     - Description of client management
  2. **Projects** (Purple icon)
     - Folder icon
     - Description of project tracking
  3. **Tasks** (Green icon)
     - Checkbox icon
     - Description of task management
  4. **Invoicing** (Orange icon)
     - Dollar sign icon
     - Description of billing features
- Progress bar at 50%
- "Back" and "Next" buttons
- "Skip Tutorial" option

**User sees:** Detailed overview of all main features

---

### Step 3/4: Load Sample Data

**Visual Elements:**
- Large yellow/orange gradient sparkles icon
- "Load Sample Data" heading
- Description explaining sample data
- Before loading:
  - Dashed border box listing what will be created:
    - ✓ 3 sample clients
    - ✓ 2 projects with tasks
    - ✓ 1 sample invoice
    - ✓ Time entries and analytics
  - Blue "Load Sample Data" button
  - "You can skip this step" hint
- After loading:
  - Green success box with checkmark
  - Stats showing: 3 Clients | 2 Projects | 1 Invoice
  - Note about deleting sample data
- Progress bar at 75%
- "Back" and "Next" buttons

**User sees:** Option to explore with realistic demo data

---

### Step 4/4: Ready to Launch

**Visual Elements:**
- Large green gradient rocket icon
- "Ready to Launch!" heading
- "Quick Start Checklist" card:
  - ✓ Add your first client (strikethrough if sample data loaded)
  - ✓ Create a project (strikethrough if sample data loaded)
  - ○ Set up company settings for invoices
  - ○ Track your first time entry
  - ○ Create your first invoice
- Progress bar at 100%
- Large "Go to Dashboard" button
- "Complete Setup" button with rocket icon

**User sees:** Completion screen with next steps

---

## Dashboard After Onboarding

### Welcome Banner (Shows if no real data exists)

**Visual Elements:**
- Purple gradient card with border
- Sparkles icon in purple/blue circle
- "Welcome to FreelancePilot!" heading
- Description: "Get started by adding your first client or explore with sample data"
- Two action buttons:
  - "Add Your First Client" (primary)
  - "Create a Project" (outline)
- X button to dismiss

**Location:** Top of dashboard, below header

---

### Contextual Tooltips

**Visual Elements:**
- Small circular gray buttons with "?" icon
- Appear next to:
  - "Dashboard" heading
  - "Revenue Trend" chart title
  - "Projects by Status" chart title
- On hover: Dark tooltip box appears with helpful text

**Example tooltips:**
- Dashboard: "Your dashboard shows real-time analytics of your freelance business, including revenue, projects, and time tracking."
- Revenue Trend: "Track your revenue over time. This chart shows income from invoices marked as 'Paid'."
- Projects by Status: "See how your projects are distributed across different statuses: Planning, Active, On Hold, Completed, or Cancelled."

---

## Sample Data Created

When user clicks "Load Sample Data", they'll see:

### Clients Page
1. **Acme Corporation** (Active)
   - Full contact info, address
   - Status: Green "ACTIVE" badge
   - Source: Referral

2. **TechStart Inc** (Prospect)
   - Contact details
   - Status: Blue "PROSPECT" badge
   - Source: Website

3. **Global Ventures** (Lead)
   - Basic info
   - Status: Gray "LEAD" badge
   - Source: Networking

### Projects Page
1. **Website Redesign**
   - Client: Acme Corporation
   - Status: Active (Green)
   - Billing: Hourly @ $85/hr
   - Budget: $15,000
   - Has 3 tasks

2. **Mobile App Development**
   - Client: Acme Corporation
   - Status: Planning (Blue)
   - Billing: Fixed Fee @ $35,000
   - Has 1 task

### Tasks Created
1. Design homepage mockups (Completed)
2. Implement responsive navigation (In Progress) - Due in 3 days
3. Set up content management system (To Do) - Due in 10 days
4. Define app requirements (To Do) - Due in 5 days

### Time Tracking
- 15 time entries spread over 30 days
- Various durations (2-5 hours each)
- All linked to tasks and projects
- Shows realistic work pattern in analytics

### Invoices
- One professional invoice created
- Invoice number: INV-0001
- Client: Acme Corporation
- Status: Sent (Blue badge)
- Amount calculated from time entries
- Includes tax (10%)
- Due in 30 days

### Dashboard Analytics Will Show:
- Revenue chart with data points
- Project distribution pie chart
- Recent projects list (2 items)
- Recent invoices (1 item)
- Upcoming tasks (4 items)
- All metrics populated with realistic numbers

---

## User Journey Map

```
┌─────────────────────────────────────────────────────────┐
│ 1. User signs up for FreelancePilot                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Redirected to /dashboard                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Onboarding wizard modal appears (auto)              │
│    - Can't dismiss by clicking outside                 │
│    - Can skip tutorial if experienced                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. User steps through 4 screens                        │
│    - Learns about features                             │
│    - Optionally loads sample data                      │
│    - Sees quick start checklist                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Clicks "Complete Setup"                             │
│    - Wizard closes                                      │
│    - Dashboard refreshes                               │
│    - User marked as onboarded in database              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 6. User sees dashboard                                  │
│    - Welcome banner appears (if no data)               │
│    - Help tooltips available on hover                  │
│    - Sample data visible (if loaded)                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 7. User can start working                              │
│    - Add real clients                                   │
│    - Create projects                                    │
│    - Delete sample data when ready                     │
└─────────────────────────────────────────────────────────┘
```

---

## Testing Scenarios

### Test 1: Complete Onboarding with Sample Data
1. Sign up as new user
2. See onboarding wizard
3. Click through all 4 steps
4. Load sample data on step 3
5. Complete onboarding
6. Verify dashboard shows sample clients/projects/invoices
7. Verify welcome banner does NOT show (has data)
8. Verify tooltips work

### Test 2: Skip Onboarding
1. Sign up as new user
2. See onboarding wizard
3. Click "Skip Tutorial" on any step
4. Verify user lands on empty dashboard
5. Verify welcome banner appears
6. Click "Add Your First Client" button
7. Verify redirect to client creation form

### Test 3: Onboarding Without Sample Data
1. Sign up as new user
2. Complete all 4 steps
3. Don't load sample data on step 3
4. Complete onboarding
5. Verify empty dashboard
6. Verify welcome banner appears
7. Verify tooltips work
8. Dismiss welcome banner
9. Verify banner doesn't show again (localStorage)

### Test 4: Returning User
1. Log in as user who completed onboarding
2. Verify wizard does NOT appear
3. Verify tooltips still available
4. Verify welcome banner logic based on data

---

## Color Scheme

### Gradient Backgrounds:
- Welcome: Purple (from-purple-500) → Blue (to-blue-600)
- Features: Varied by feature (blue, purple, green, orange)
- Sample Data: Yellow (from-yellow-400) → Orange (to-orange-500)
- Complete: Green (from-green-500) → Emerald (to-emerald-600)

### Status Colors:
- Active/Success: Green (#10b981)
- Prospect/Info: Blue (#3b82f6)
- Lead/Warning: Gray/Yellow
- Completed: Gray (#6b7280)

### UI Elements:
- Primary buttons: Default theme blue
- Outline buttons: Border with transparent bg
- Cards: White/dark with subtle borders
- Icons: Colored backgrounds at 10% opacity

---

## Responsive Design

- Modal adjusts to screen size
- Cards stack on mobile (2x2 → 1 column)
- Buttons remain accessible
- Text remains readable
- Progress bar responsive
- Tooltips position intelligently

---

## Accessibility Features

- Clear visual hierarchy
- High contrast text
- Interactive elements have focus states
- Tooltips have proper ARIA labels
- Keyboard navigation supported
- Progress clearly indicated
- Skip options available
- Non-modal tooltips

---

## Next Steps After Implementation

### For Users:
1. Complete onboarding wizard
2. Explore with sample data OR add real data
3. Use tooltips for help
4. Follow quick start checklist
5. Start managing freelance business

### For Development:
1. Monitor completion rates
2. Track which steps users skip
3. Gather feedback on clarity
4. Consider adding more tooltips
5. Plan for additional onboarding features

---

This comprehensive onboarding system ensures new users have a smooth, guided experience when starting with FreelancePilot!
