export type FormFieldType = 'text' | 'number' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface FormDefinition {
  id?: string;
  title: string;
  description?: string;
  ownerId: string;
  fields: FormField[];
  createdAt: any;
  updatedAt: any;
  isPublished: boolean;
}

export interface Submission {
  id?: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: any;
  submitterId?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: any;
}
