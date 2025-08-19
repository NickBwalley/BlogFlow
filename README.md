# BlogFlow

### A Next.js & Supabase application that enables users to write blog posts and publish, built using cursor.ai

**Tech Stack:** Next.js, Supabase, Stripe, Resend, OpenAI, Vercel, Tip-tap Editor

## Installation Guide

### Prerequisites

- Node.js 18+ installed on your machine
- A Supabase account
- pnpm package manager

### Quick Start

#### 1. Create a new project using pnpm's dlx

```bash
# Using pnpm's dlx to create a new Next.js project
pnpm dlx create-next-app@latest my-app --use-pnpm
```

#### 2. Clone or setup the BlogFlow project

```bash
# Navigate to your project directory
cd blogflow

# Install dependencies
pnpm install
```

#### 3. Development Commands

```bash
# Start development server (runs on http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## Supabase Configuration

### Initial Setup

Follow these steps to configure Supabase for your BlogFlow project:

#### 1. Install Supabase CLI

```bash
# Install Supabase CLI on your machine
npm install -g @supabase/cli

# Verify installation
supabase --version
```

#### 2. Login to Supabase

```bash
# Login to your Supabase account
supabase login

# Copy the code generated and paste it in your CLI when prompted
```

#### 3. Link Your Project

```bash
# Link your local project to your remote Supabase project
supabase link --project-ref [your_project_id_from_supabase]

# Enter the password you used to create the project when prompted
```

#### 4. Environment Variables

Create a `.env.local` file in your project root and add your Supabase credentials:

```bash
# Get these from your Supabase project settings > API
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For advanced features
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 5. Database Setup

```bash
# Apply migrations to your remote database
supabase db push

# Generate TypeScript types (optional but recommended)
supabase gen types typescript --local > types/supabase.ts
```

### Key Features Implemented

#### User Profiles System

- **Automatic Profile Creation:** When users sign up, a profile record is automatically created via database triggers
- **Secure Access:** Row Level Security (RLS) ensures users can only access their own data
- **Extended User Data:** Stores first name, avatar URL, and email in addition to auth data

#### Database Schema

The application includes a `profiles` table with the following structure:

- `id` - Unique identifier (UUID)
- `user_id` - Reference to auth.users (UUID, unique)
- `first_name` - Optional user's first name
- `avatar_url` - Optional profile picture URL
- `email` - User's email address
- `created_at` - Timestamp of profile creation
- `updated_at` - Timestamp of last update

#### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **User-specific policies** for SELECT, INSERT, UPDATE, DELETE operations
- **Automatic triggers** for profile creation and timestamp updates

### Development Workflow

#### Working with Migrations

```bash
# Create a new migration
supabase migration new migration_name

# Apply migrations to remote database
supabase db push

# Reset local database (development only)
supabase db reset
```

#### Type Safety

The project includes TypeScript types for database operations:

- `types/database.ts` - Generated database schema types
- `types/profile.ts` - Profile-specific types and interfaces
- `types/index.ts` - Centralized type exports

### Project Structure

```
blogflow/
├── app/                    # Next.js App Router pages
├── components/             # Reusable React components
│   └── ui/                # UI component library
├── lib/                   # Utility functions and configurations
├── types/                 # TypeScript type definitions
├── supabase/              # Database migrations and config
└── public/                # Static assets
```

### NOTES:

- You can visit localhost:3000 and create a user_account with my email and password then from there say I use nickbiiybwalley@gmail.com I can use nickbiiybwalley+1@gmail.com to create a new email address to test but linked to this one account treated as my first original account but testing on different email addresses.

### Getting Help

#### Supabase Resources

- [Supabase Documentation](https://docs.supabase.com/)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

#### Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub Repository](https://github.com/vercel/next.js)

## Deployment

### Deploy on Vercel

The easiest way to deploy your BlogFlow app is to use the [Vercel Platform](https://vercel.com/new):

1. Push your code to a Git repository
2. Import your project on Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

Make sure to add all your environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.) in your Vercel project settings.

### Database Considerations

- Your Supabase database is already hosted and managed
- Migrations are applied via `supabase db push`
- No additional database setup required for deployment

---

Built by NickBwalley❤️ using [Cursor AI](https://cursor.ai) for enhanced development productivity.
