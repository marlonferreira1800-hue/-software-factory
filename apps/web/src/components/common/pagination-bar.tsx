'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginatedMeta } from '@software-factory/shared';
import { Button } from '@/components/ui/button';

export function PaginationBar({
  meta,
  onPageChange,
}: {
  meta: PaginatedMeta;
  onPageChange: (nextPage: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm text-muted-foreground">
      <span>
        Mostrando página <strong className="text-foreground">{meta.page}</strong> de{' '}
        <strong className="text-foreground">{meta.totalPages}</strong> ({meta.total}{' '}
        {meta.total === 1 ? 'registro' : 'registros'})
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasPreviousPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
