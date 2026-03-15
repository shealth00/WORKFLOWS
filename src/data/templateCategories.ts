/**
 * Jotform-style template categories for scaling to a large template marketplace.
 * Use for filtering, search, and future template seeding (20k+ templates).
 */
export interface TemplateCategoryMeta {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export const FORM_TEMPLATE_CATEGORIES: TemplateCategoryMeta[] = [
  { id: 'contact', name: 'Contact Forms', slug: 'contact', description: 'General contact and support' },
  { id: 'registration', name: 'Registration Forms', slug: 'registration', description: 'Events, vendors, members' },
  { id: 'application', name: 'Application Forms', slug: 'application', description: 'Job, loan, program applications' },
  { id: 'survey', name: 'Survey Templates', slug: 'survey', description: 'Surveys, NPS, feedback' },
  { id: 'consent', name: 'Consent Forms', slug: 'consent', description: 'Medical, legal, GDPR consent' },
  { id: 'appointment', name: 'Appointment Forms', slug: 'appointment', description: 'Booking and scheduling' },
  { id: 'reservation', name: 'Reservation Forms', slug: 'reservation', description: 'Restaurant, travel, services' },
  { id: 'donation', name: 'Donation Forms', slug: 'donation', description: 'Fundraising and donations' },
  { id: 'volunteer', name: 'Volunteer Forms', slug: 'volunteer', description: 'Volunteer sign-up and availability' },
  { id: 'order', name: 'Order Forms', slug: 'order', description: 'Purchase orders, quote requests' },
  { id: 'kyc', name: 'KYC / Loan Forms', slug: 'kyc', description: 'Identity verification, loan applications' },
  { id: 'hr', name: 'HR Forms', slug: 'hr', description: 'Onboarding, exit, internal HR' },
  { id: 'medical', name: 'Medical Forms', slug: 'medical', description: 'Patient intake, HIPAA forms' },
  { id: 'legal', name: 'Legal Forms', slug: 'legal', description: 'NDA, contracts, legal consent' },
  { id: 'payment', name: 'Payment Forms', slug: 'payment', description: 'Checkout, invoice, payment collection' },
];

export function getCategoryBySlug(slug: string): TemplateCategoryMeta | undefined {
  return FORM_TEMPLATE_CATEGORIES.find((c) => c.slug === slug);
}
