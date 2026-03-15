import type { FormField } from '../types';

/** Category slug used in URLs (e.g. forms, workflows). */
export type TemplateType =
  | 'forms'
  | 'card-forms'
  | 'workflows'
  | 'table'
  | 'pdf'
  | 'sign'
  | 'ai-agents'
  | 'app'
  | 'board'
  | 'store';

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  /** Form fields for form-type templates; used when creating a new form from template. */
  fields?: FormField[];
  /** Step labels for workflow-type templates (display + future builder). */
  steps?: string[];
}

const uid = () => Math.random().toString(36).slice(2, 11);

/** Form Templates — surveys, patient intake, feedback. */
const FORM_TEMPLATES: MarketplaceTemplate[] = [
  {
    id: 'patient-intake',
    name: 'Patient Intake Form',
    description: 'Collect patient demographics, insurance, and medical history for clinic intake.',
    fields: [
      { id: uid(), type: 'text', label: 'Full Name', required: true },
      { id: uid(), type: 'date', label: 'Date of Birth', required: true },
      { id: uid(), type: 'email', label: 'Email', required: true },
      { id: uid(), type: 'text', label: 'Phone Number', required: true },
      { id: uid(), type: 'textarea', label: 'Address', required: false },
      { id: uid(), type: 'select', label: 'Insurance Type', required: true, options: ['Medicare', 'Medicaid', 'Private', 'None'] },
      { id: uid(), type: 'textarea', label: 'Medical History', required: false },
    ],
  },
  {
    id: 'customer-feedback',
    name: 'Customer Feedback Survey',
    description: 'Short survey for product or service feedback with rating and comments.',
    fields: [
      { id: uid(), type: 'text', label: 'Name', required: false },
      { id: uid(), type: 'email', label: 'Email', required: false },
      { id: uid(), type: 'radio', label: 'Overall rating', required: true, options: ['1 - Poor', '2', '3', '4', '5 - Excellent'] },
      { id: uid(), type: 'textarea', label: 'What did we do well?', required: false },
      { id: uid(), type: 'textarea', label: 'What could we improve?', required: false },
    ],
  },
  {
    id: 'event-registration',
    name: 'Event Registration',
    description: 'Register attendees with contact info and optional preferences.',
    fields: [
      { id: uid(), type: 'text', label: 'Full Name', required: true },
      { id: uid(), type: 'email', label: 'Email', required: true },
      { id: uid(), type: 'text', label: 'Organization', required: false },
      { id: uid(), type: 'checkbox', label: 'Dietary requirements', required: false, options: ['Vegetarian', 'Vegan', 'Gluten-free', 'None'] },
      { id: uid(), type: 'textarea', label: 'Special requests', required: false },
    ],
  },
];

/** Workflow Templates — automation pipelines. */
const WORKFLOW_TEMPLATES: MarketplaceTemplate[] = [
  {
    id: 'crm-lead-automation',
    name: 'CRM Lead Automation',
    description: 'Automate lead capture, qualification, and assignment to sales.',
    steps: ['Form submission captures lead', 'Score and tag lead', 'Assign to owner', 'Send welcome email', 'Add to CRM pipeline'],
  },
  {
    id: 'patient-intake-workflow',
    name: 'Patient Intake Workflow',
    description: 'From intake form to chart and scheduling.',
    steps: ['Patient completes intake form', 'Verify insurance', 'Create chart', 'Notify provider', 'Schedule follow-up'],
  },
  {
    id: 'invoice-approval-flow',
    name: 'Invoice Approval Flow',
    description: 'Route invoices for approval by amount and department.',
    steps: ['Submit invoice', 'Route by amount/department', 'Manager approval', 'Finance review', 'Payment scheduled'],
  },
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding',
    description: 'Checklist and tasks for new hire onboarding.',
    steps: ['HR sends welcome pack', 'IT provisions accounts', 'Manager assigns buddy', 'Complete training modules', '30-day check-in'],
  },
];

/** Table Templates — database tables / spreadsheets. */
const TABLE_TEMPLATES: MarketplaceTemplate[] = [
  { id: 'contacts', name: 'Contacts', description: 'Contacts with name, email, phone, company.', steps: ['Name', 'Email', 'Phone', 'Company', 'Notes'] },
  { id: 'tasks', name: 'Task Tracker', description: 'Tasks with status, assignee, due date.', steps: ['Title', 'Status', 'Assignee', 'Due date', 'Priority'] },
  { id: 'inventory', name: 'Simple Inventory', description: 'Items with SKU, quantity, location.', steps: ['SKU', 'Name', 'Quantity', 'Location', 'Reorder at'] },
];

/** PDF / Document templates. */
const PDF_TEMPLATES: MarketplaceTemplate[] = [
  { id: 'report', name: 'Monthly Report', description: 'Standard monthly report with sections and metrics.' },
  { id: 'letter', name: 'Cover Letter', description: 'Professional cover letter template.' },
  { id: 'invoice', name: 'Invoice', description: 'Simple invoice with line items and totals.' },
];

/** Sign / e-signature templates. */
const SIGN_TEMPLATES: MarketplaceTemplate[] = [
  { id: 'consent', name: 'Consent Form', description: 'Consent to treat or procedure with signature.' },
  { id: 'nda', name: 'NDA', description: 'Non-disclosure agreement with signature block.' },
  { id: 'contract', name: 'Contract', description: 'Short contract with signature and date.' },
];

/** AI Agent templates. */
const AI_AGENT_TEMPLATES: MarketplaceTemplate[] = [
  { id: 'support-bot', name: 'Support Bot', description: 'Answer FAQs and route tickets.' },
  { id: 'scheduler', name: 'Scheduling Assistant', description: 'Book meetings and send confirmations.' },
  { id: 'summarizer', name: 'Document Summarizer', description: 'Summarize long documents and emails.' },
];

/** App templates. */
const APP_TEMPLATES: MarketplaceTemplate[] = [
  { id: 'directory', name: 'Employee Directory', description: 'Searchable directory with filters.' },
  { id: 'request', name: 'Request Tracker', description: 'Submit and track requests.' },
];

/** Board / project board templates. */
const BOARD_TEMPLATES: MarketplaceTemplate[] = [
  { id: 'kanban', name: 'Kanban Board', description: 'To Do, In Progress, Done.' },
  { id: 'sprint', name: 'Sprint Board', description: 'Backlog, Sprint, In Review, Done.' },
];

/** Card form templates (form-like). */
const CARD_FORM_TEMPLATES: MarketplaceTemplate[] = [
  {
    id: 'card-contact',
    name: 'Contact Card',
    description: 'Compact contact form in card layout.',
    fields: [
      { id: uid(), type: 'text', label: 'Name', required: true },
      { id: uid(), type: 'email', label: 'Email', required: true },
      { id: uid(), type: 'textarea', label: 'Message', required: true },
    ],
  },
];

/** Store templates. */
const STORE_TEMPLATES: MarketplaceTemplate[] = [
  { id: 'product-list', name: 'Product Catalog', description: 'List products with name, price, image.' },
];

export const TEMPLATE_LIBRARY: Record<TemplateType, MarketplaceTemplate[]> = {
  forms: FORM_TEMPLATES,
  'card-forms': CARD_FORM_TEMPLATES,
  workflows: WORKFLOW_TEMPLATES,
  table: TABLE_TEMPLATES,
  pdf: PDF_TEMPLATES,
  sign: SIGN_TEMPLATES,
  'ai-agents': AI_AGENT_TEMPLATES,
  app: APP_TEMPLATES,
  board: BOARD_TEMPLATES,
  store: STORE_TEMPLATES,
};

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  forms: 'Form Templates',
  'card-forms': 'Card Form Templates',
  workflows: 'Workflow Templates',
  table: 'Table Templates',
  pdf: 'PDF Templates',
  sign: 'Sign Templates',
  'ai-agents': 'AI Agent Templates',
  app: 'App Templates',
  board: 'Board Templates',
  store: 'Store Builder Templates',
};

export function getTemplate(type: TemplateType, templateId: string): MarketplaceTemplate | undefined {
  const list = TEMPLATE_LIBRARY[type];
  return list?.find((t) => t.id === templateId);
}

export function getTemplateList(type: TemplateType): MarketplaceTemplate[] {
  return TEMPLATE_LIBRARY[type] ?? [];
}
