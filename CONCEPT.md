# Template-Driven Platform — App Concept & Architecture

Your app is a **Template-Driven Platform** where users create things (forms, workflows, documents, AI agents) from templates — similar to Notion, Airtable, ClickUp, Canva, and Jotform.

For full system architecture (4 layers, database schema, Next.js/Prisma option, 20k template taxonomy, deployment), see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

---

## What the app is

| Template type       | What users create                |
|---------------------|-----------------------------------|
| Form templates      | Surveys, patient intake forms    |
| Workflow templates  | Automation pipelines              |
| Table templates     | Database tables / spreadsheets   |
| PDF templates      | Documents & reports               |
| Sign templates     | Digital signatures                |
| AI Agent templates | Automated assistants              |
| App templates      | Small apps                        |
| Board templates    | Project boards                    |

---

## App architecture

```
Frontend (React + Vite)
        │
        ├── Dashboard (template launcher)
        ├── Template marketplace (per category)
        ├── Template preview + "Use template"
        ├── Form builder (drag-and-drop)
        └── User workspace (My Forms, etc.)
        │
Firebase (Auth + Firestore)
        │
        ├── users / auth
        ├── forms (user-created forms; from templates or blank)
        └── submissions (form responses)
        │
AI (optional)
        │
        └── Gemini — generate forms from prompt, future: workflow / doc generation
```

Current stack: **React**, **Vite**, **Tailwind**, **Firebase (Auth + Firestore)**, **Gemini**. Backend can be extended with **Node/Express** and **PostgreSQL/MongoDB** later if needed.

---

## Main screens

1. **Dashboard** — After sign-in: consent form or template launcher. Template launcher shows category tiles (Form, Workflow, Table, PDF, Sign, AI Agent, App, Board, Store).
2. **Template marketplace** — Click a category → list of templates (e.g. Workflow → CRM Lead Automation, Patient Intake Workflow, Invoice Approval, Employee Onboarding).
3. **Template preview** — Click a template → name, description, fields/steps, **[Use template]** → creates a new form/project and opens the builder.
4. **Template builder** — Drag-and-drop form builder (existing). Future: workflow builder, table builder, etc.
5. **User workspace** — My Forms, and later: My Workflows, My Tables, My Documents, My AI Agents.

---

## Database design (Firestore today)

- **users** — Handled by Firebase Auth.
- **forms** — `id`, `ownerId`, `title`, `description`, `fields[]`, `createdAt`, `updatedAt`, `isPublished`. Created from templates or blank.
- **submissions** — `formId`, `data`, `submittedAt`. Form responses.

Future (if you add a backend):

- **templates** — `id`, `name`, `type`, `description`, `icon`, `config_json`, `created_at`.
- **projects** — `id`, `user_id`, `template_id`, `name`, `data_json`, `created_at` (for workflows, tables, etc.).

---

## MVP development plan

| Phase   | Scope                                      | Status        |
|---------|--------------------------------------------|---------------|
| Phase 1 | Login, dashboard, template launcher         | Done          |
| Phase 2 | Template marketplace, template preview      | Done          |
| Phase 3 | Form builder (existing), workflow builder   | Form done     |
| Phase 4 | AI template generation, automation          | Partial (form AI) |

---

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend / DB:** Firebase (Auth + Firestore); optional later: Node.js, Express, PostgreSQL or MongoDB
- **AI:** Gemini (form generation); extend to workflows/documents as needed

---

## Finished product vision

A **template automation platform** where users can build:

- Forms and surveys  
- Workflows and automations  
- Tables and data views  
- Documents and PDFs  
- AI agents  

Functionally: a small “operating system” for productivity, driven by templates.
