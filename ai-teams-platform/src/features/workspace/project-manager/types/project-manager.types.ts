export interface CreateProjectInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  templateId?: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  status: string;
  favorite: boolean;
  lastOpenedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { tasks: number };
}
