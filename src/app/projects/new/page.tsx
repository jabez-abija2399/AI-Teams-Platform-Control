import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/session-helper';
import { NewProjectWizard } from '@/features/projects/components/new-project-wizard';

export const metadata = {
  title: 'New Project | HibirDev AI',
  description: 'Deploy specialized autonomous AI agents for your software idea.',
};

export default async function NewProjectPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');

  return <NewProjectWizard />;
}
