# Full Platform Architecture — Jotform-Style SaaS

This doc describes the **complete system architecture** for a template-driven form & automation platform (like Jotform): 20,000+ templates, AI form generation, login, dashboard, and deployment.

---

## 1. Four Main Layers

```
User Browser
      │
Frontend (UI + Dashboard)   ← React + Vite (current) or Next.js
      │
API / Backend               ← Firebase (current) or Next.js API Routes
      │
Database                    ← Firestore (current) or PostgreSQL
      │
Storage                     ← Form JSON templates (Firestore docs or S3/DB)
```

**Optional later:**
- AI Form Generator (Gemini — already started)
- Payment System (Stripe, payment forms)
- Automation Engine (workflows, webhooks)

---

## 2. Current vs. Alternative Stack

| Layer     | Current (this repo)     | Alternative (full Jotform-style)   |
|----------|--------------------------|------------------------------------|
| Frontend | React, Vite, Tailwind    | Next.js, Tailwind, App Router      |
| Auth     | Firebase Auth            | NextAuth + credentials or OAuth    |
| API      | Firebase SDK (client)     | Next.js API routes + server        |
| Database | Firestore                | PostgreSQL + Prisma                |
| Storage  | Firestore `forms` docs   | PostgreSQL `forms` + JSON column   |

You can **keep the current stack** and scale it (Firestore, more templates, more pages), or **migrate later** to Next.js + Prisma + PostgreSQL for a single deploy (e.g. Vercel) and relational data.

---

## 3. Project Structure (Current)

```
workflows-main (or form-builder)
│
├── app / src
│   ├── pages
│   │   ├── Dashboard.tsx       → My Workspace
│   │   ├── Templates.tsx      → Template launcher
│   │   ├── TemplateLibrary.tsx → Marketplace per category
│   │   ├── TemplatePreview.tsx → Preview + Use template
│   │   ├── Builder.tsx        → Form builder
│   │   ├── Products.tsx       → Products page
│   │   ├── Integrations.tsx   → Integrations
│   │   ├── ConsentForm.tsx    → Sally Health consent
│   │   └── ViewForm.tsx       → Public form fill
│   │
│   ├── components
│   │   ├── TemplatePanel.tsx
│   │   ├── TemplateCard / FormCard
│   │   ├── FormBuilder (in Builder page)
│   │   └── Navbar
│   │
│   ├── data
│   │   ├── templates.ts       → Category tiles
│   │   └── templateLibrary.ts → Marketplace templates
│   │
│   ├── lib / services
│   │   ├── firebase.ts
│   │   └── geminiService.ts   → AI form generation
│   │
│   └── types.ts
│
├── prisma (optional, if you add PostgreSQL)
│   └── schema.prisma
│
└── public
```

---

## 4. Database Schema (Prisma + PostgreSQL Option)

If you add a backend with PostgreSQL:

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  forms     Form[]
}

model Template {
  id          String   @id @default(uuid())
  name        String
  category    String   // e.g. "Contact", "Registration"
  description String?
  config      Json     // form JSON: fields, options
  createdAt   DateTime @default(now())
}

model Form {
  id         String   @id @default(uuid())
  name       String
  templateId String?
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  data       Json     // form definition (fields, settings)
  createdAt  DateTime @default(now())
}

model Submission {
  id         String   @id @default(uuid())
  formId     String
  data       Json
  submittedAt DateTime @default(now())
}
```

**Firestore equivalent (current):**
- `users` → Firebase Auth
- `forms` → collection `forms` (ownerId, title, description, fields, …)
- `submissions` → subcollection `forms/{id}/submissions`
- `templates` → static data in `templateLibrary.ts` or a Firestore `templates` collection

---

## 5. Template JSON Format

Each template (and each saved form) is stored as JSON like this:

```json
{
  "name": "Contact Form",
  "description": "Collect name, email, and message",
  "fields": [
    { "id": "f1", "type": "text", "label": "Full Name", "required": true },
    { "id": "f2", "type": "email", "label": "Email", "required": true },
    { "id": "f3", "type": "textarea", "label": "Message", "required": true }
  ]
}
```

This powers the drag-and-drop form builder and the “Use template” flow.

---

## 6. Template Categories (Jotform-Style Taxonomy)

For a 20,000+ template marketplace, organize by category. Example categories:

| Category              | Examples |
|-----------------------|----------|
| Order forms           | Purchase order, Quote request |
| Registration forms    | Event registration, Vendor registration |
| Application forms     | Job application, Loan application |
| Survey templates      | Customer survey, NPS, Feedback |
| Consent forms         | Medical consent, GDPR consent |
| Appointment forms     | Booking, Scheduling |
| Contact forms         | General contact, Support |
| Reservation forms     | Restaurant, Travel |
| Donation forms        | Fundraising, One-time donation |
| Volunteer forms       | Sign-up, Availability |
| Loan / KYC forms      | KYC, Identity verification |
| HR forms              | Onboarding, Exit interview |
| Medical forms         | Patient intake, HIPAA |
| Legal forms           | NDA, Contract, Consent |
| Payment forms         | Checkout, Invoice |

Your app already has **product-level** categories (Form, Workflow, Table, PDF, Sign, AI Agent, App, Board, Store). The list above is **template-level** categories inside “Form templates” (and can be reused for PDF/Sign/etc.).

---

## 7. Auth (NextAuth Alternative)

Current: **Firebase Auth** (Google sign-in, client SDK).

Alternative for Next.js:

```ts
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},
      async authorize(credentials) {
        // Validate credentials, return user or null
        return { id: "1", name: "Admin", email: "admin@example.com" }
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

---

## 8. Core Features Checklist

**Core (current or in progress)**  
- [x] Login (Firebase Auth)  
- [x] Dashboard / My Workspace  
- [x] Template launcher + marketplace  
- [x] Template preview + “Use template”  
- [x] Form builder (drag-and-drop)  
- [x] Form view + submissions  
- [ ] 20,000+ templates (structure ready; add data over time)

**Advanced (roadmap)**  
- [ ] AI form generator (Gemini — started)  
- [ ] Payment forms (Stripe)  
- [ ] Workflow automation (triggers, actions)  
- [ ] Analytics (views, completion rate)  
- [ ] Integrations (Zapier, webhooks, email)

---

## 9. Deployment

**Current:** Firebase Hosting (or Cloud Run) for React/Vite build; Firestore + Auth as backend.

**Alternative:** Single deploy with Next.js:
1. Push to GitHub  
2. Connect repo to **Vercel**  
3. Deploy (frontend + API routes together)

---

## 10. Growth Roadmap

1. **Scale templates** — Move from static `templateLibrary.ts` to Firestore `templates` or PostgreSQL; add search, filters, and category taxonomy above.  
2. **AI generator** — Expand Gemini usage: “Create a registration form for…” → full template JSON.  
3. **Payments** — Stripe (or similar) for payment forms and SaaS subscriptions.  
4. **Workflow engine** — Triggers (form submit, webhook) → actions (email, CRM, internal form).  
5. **Multi-tenant** — Orgs, teams, shared templates, and billing per workspace.

This architecture supports evolving into a no-code automation platform (Typeform / Jotform / Zapier style) while keeping your current Vite + Firebase stack as the starting point.
