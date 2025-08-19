# Product Requirements Document (PRD)

## Overview

Build a modern web application for writing, managing, and publishing blogs. The app will feature a public-facing blog, a secure dashboard for managing content, and integrations for monetization, email, and AI-powered features.

---

## Goals

- Allow users (initially just you) to write, edit, and publish blog posts.
- Enable simple blog management through a secure dashboard.
- Provide a pleasant writing experience with TipTap editor.
- Support user authentication and paid features using Stripe.
- Notify users/readers via email (Resend).
- Use OpenAI for writing suggestions or content improvement.
- Host and deploy seamlessly on Vercel.

---

## Core Pages & Features

### 1. Landing Page

- Brief intro to the blog/app
- Call-to-action (CTA) for signup/login
- List of latest/pinned blog posts (public)
- Clean, attractive design

### 2. Dashboard (Protected)

- Authentication required (Supabase Auth)
- List of all authored blog posts
- Create new blog post (TipTap editor)
- Edit existing posts
- Delete posts
- Toggle post visibility (published/draft)
- Show post status (published/draft)
- Blog analytics (optional, e.g., views)

### 3. Blogs (Public Blog List)

- Paginated or infinite scroll list of published blogs
- Filter/search by title, tag, or date
- Each entry links to individual blog page

### 4. Blog Page (Public)

- Full content of the blog post
- Author info and publish date
- Share buttons (optional)
- Related posts (optional)
- Newsletter signup (optional, using Resend)

### 5. Auth (Login/Signup)

- Email/password login (Supabase)
- Magic link (optional)
- User profile management (optional)

---

## Integrations

- **Supabase:** Auth, data storage for users and blogs
- **Stripe:** Payments for premium features (e.g., paid newsletter, premium content)
- **Resend:** Transactional and marketing emails (e.g., new post notifications, newsletters)
- **OpenAI:** Writing suggestions, grammar checks, auto-generate summaries, etc.
- **Vercel:** Hosting, CI/CD, and environment management
- **TipTap:** Rich text editing for blogs

---

## User Flows

### Visiting the blog (anonymous user)

1. Land on homepage, see latest blogs.
2. Click on a blog to read full post.

### Writing a blog (authenticated user)

1. Login via Auth page.
2. Access dashboard.
3. Create/edit blog post using TipTap editor.
4. Publish or save as draft.

### Premium features (future)

1. Sign up for paid newsletter/content via Stripe.
2. Receive email notifications (Resend).

---

## Data Model (Simplified)

### Users

- `id` (UUID)
- `email`
- `name`
- `subscription_status` (via Stripe)

### Blogs

- `id` (UUID)
- `author_id` (FK to Users)
- `title`
- `content` (rich text JSON)
- `status` (published/draft)
- `created_at`
- `updated_at`
- `published_at`

---

## Non-Functional Requirements

- **Performance:** Fast page loads, optimized for SEO
- **Security:** Authenticated dashboard, secure API
- **Scalability:** Ready for multi-user (future)
- **Responsive:** Mobile and desktop support

---

## Milestones

### MVP

- Landing page
- Auth
- Dashboard (create, edit, list blogs)
- Public blogs/blog page
- Deploy to Vercel

### Integrations

- Resend for email notifications
- OpenAI for writing aids
- Stripe for payments
