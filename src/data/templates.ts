export type TemplateCategory = 'all' | 'productivity' | 'ai' | 'documents' | 'automation';

export interface TemplateItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  path: string;
  category: TemplateCategory;
}

export const TEMPLATES: TemplateItem[] = [
  { id: 'forms', name: 'Form Templates', icon: '📄', color: '#f97316', path: '/templates/forms', category: 'documents' },
  { id: 'card-forms', name: 'Card Form Templates', icon: '💳', color: '#1e88e5', path: '/templates/card-forms', category: 'documents' },
  { id: 'app', name: 'App Templates', icon: '📱', color: '#8e44ad', path: '/templates/app', category: 'productivity' },
  { id: 'store', name: 'Store Builder Templates', icon: '🛒', color: '#1e293b', path: '/templates/store', category: 'automation' },
  { id: 'table', name: 'Table Templates', icon: '📊', color: '#22c55e', path: '/templates/table', category: 'productivity' },
  { id: 'workflows', name: 'Workflow Templates', icon: '🔁', color: '#14b8a6', path: '/templates/workflows', category: 'automation' },
  { id: 'pdf', name: 'PDF Templates', icon: '📑', color: '#eab308', path: '/templates/pdf', category: 'documents' },
  { id: 'sign', name: 'Sign Templates', icon: '✍', color: '#84cc16', path: '/templates/sign', category: 'documents' },
  { id: 'ai-agents', name: 'AI Agent Templates', icon: '🤖', color: '#7e57c2', path: '/templates/ai-agents', category: 'ai' },
  { id: 'board', name: 'Board Templates', icon: '📋', color: '#0ea5e9', path: '/templates/board', category: 'productivity' },
];

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  all: 'All',
  productivity: 'Productivity',
  ai: 'AI',
  documents: 'Documents',
  automation: 'Automation',
};
