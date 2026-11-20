import { AppShell } from '@/components/layout/app-shell';
import { ProjectStudioView } from '@/components/projects/project-studio-view';

export function generateStaticParams() {
  return [{ id: 'proj-demo-1' }];
}

export default async function ProjectStudioDynamicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell>
      <ProjectStudioView projectId={id} />
    </AppShell>
  );
}
