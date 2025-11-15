# FreelancePilot

A modern, full-stack SaaS platform for freelancers to manage clients, projects, tasks, time tracking, and invoicing.

## Features

- **Client Management**: CRUD operations for client relationships
- **Project Management**: Track projects with billing, timeline, and client connections
- **Task Management**: Organize tasks with status and priorities linked to projects
- **Time Tracking**: Start/stop timer with hourly rate snapshots
- **Invoicing**: Generate invoices with PDF export
- **Dashboard**: Analytics and overview with graphs
- **Multi-workspace**: Team/agency support with roles and permissions
- **Authentication**: Secure login with NextAuth.js

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Forms & Validation**: Zod
- **Charts**: Recharts
- **PDF Generation**: jsPDF

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. **Clone the repository** (if not already done)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:

   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

   Update the following variables in `.env`:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

4. **Set up the database**:
   ```bash
   # Push the schema to your database
   npx prisma db push

   # Or run migrations
   npx prisma migrate dev --name init
   ```

5. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

6. **Run the development server**:
   ```bash
   npm run dev
   ```

7. **Open your browser**:
   Visit [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses a comprehensive database schema including:

- **Users & Authentication**: NextAuth.js compatible models
- **Workspaces**: Multi-tenant support with roles (OWNER, ADMIN, MEMBER)
- **Clients**: Client contact and company information
- **Projects**: Project tracking with budgets, timelines, and status
- **Tasks**: Task management with priorities and status tracking
- **Time Entries**: Time tracking with hourly rate snapshots
- **Invoices & Invoice Items**: Complete invoicing system
- **Company Settings**: Invoice configuration and company details

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Protected dashboard pages
├── components/            # React components
│   ├── layout/           # Layout components (Header, Sidebar)
│   ├── providers/        # Context providers
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript type definitions
└── generated/             # Prisma generated types
    └── prisma/

prisma/
└── schema.prisma          # Database schema
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Prisma Commands

- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma generate` - Generate Prisma Client
- `npx prisma db push` - Push schema changes to database
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma migrate deploy` - Apply migrations (production)

## Next Steps

The foundation is complete! Next features to implement:

1. **Client Management**: Complete CRUD operations for clients
2. **Project Management**: Full project tracking with client relationships
3. **Task Management**: Task creation and management linked to projects
4. **Time Tracking**: Timer functionality with billable hour tracking
5. **Invoicing**: Invoice generation and PDF export
6. **Dashboard Analytics**: Charts and metrics visualization

## License

Private project - All rights reserved
# FreelancePilot
