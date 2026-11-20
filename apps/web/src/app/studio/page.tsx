'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectStudioView } from '@/components/projects/project-studio-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function StudioContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return (
      <Card className="p-8 text-center">
        <CardContent className="space-y-3">
          <p className="font-display text-lg font-semibold">Selecione um projeto para abrir o Studio</p>
          <Button asChild>
            <Link href="/projects">Ver Meus Projetos</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <ProjectStudioView projectId={id} />;
}

export default function StudioPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Carregando Studio...</div>}>
        <StudioContent />
      </Suspense>
    </AppShell>
  );
}
