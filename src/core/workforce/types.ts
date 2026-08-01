export type CompanyRole =
  | 'CEO'
  | 'PRODUCT_MANAGER'
  | 'SOFTWARE_ARCHITECT'
  | 'DATABASE_ENGINEER'
  | 'BACKEND_ENGINEER'
  | 'FRONTEND_ENGINEER'
  | 'UI_ENGINEER'
  | 'QA_ENGINEER'
  | 'SECURITY_ENGINEER'
  | 'DEVOPS_ENGINEER';

export type ExperienceLevel = 'Junior' | 'Senior' | 'Staff' | 'Principal' | 'Executive';

export interface AIAgentProfile {
  id: string;
  projectId?: string;
  role: CompanyRole;
  name: string;
  avatar: string;
  title: string;
  skills: string[];
  personality: string;
  responsibilities: string[];
  experienceLevel: ExperienceLevel;
  createdAt?: string;
  updatedAt?: string;
}
