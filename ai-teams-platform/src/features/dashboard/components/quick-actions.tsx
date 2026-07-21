'use client';

import Link from 'next/link';
import { Plus, Bot, FolderKanban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { ROUTES } from '@/config/constants';

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Link
          href={`${ROUTES.projects}/new`}
          className={buttonVariants({
            variant: 'outline',
            className: 'justify-start',
          })}
        >
          <Plus className="mr-2 h-4 w-4" /> New project
        </Link>
        <Link
          href={ROUTES.aiTeams}
          className={buttonVariants({
            variant: 'outline',
            className: 'justify-start',
          })}
        >
          <Bot className="mr-2 h-4 w-4" /> View AI teams
        </Link>
        <Link
          href={ROUTES.projects}
          className={buttonVariants({
            variant: 'outline',
            className: 'justify-start',
          })}
        >
          <FolderKanban className="mr-2 h-4 w-4" /> All projects
        </Link>
      </CardContent>
    </Card>
  );
}
