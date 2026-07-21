'use client';

import { useQuery } from '@tanstack/react-query';

export function useRecentProjects() {
  return useQuery({
    queryKey: ['recent-projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects/recent');
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
  });
}
