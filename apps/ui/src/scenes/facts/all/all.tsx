import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import { useFactInfinite, useCreateFact } from '@/api/facts/facts.hooks';
import { useDebounce } from '@/hooks/use-debounce';
import { EntityTable } from '@/components/entity-table/entity-table';
import { factColumns } from './columns';
import { Button } from '@/components/ui/button';
import { EntityModal } from '@/components/entity-modal/entity-modal';
import { FactForm } from '@/components/form/entities/fact/fact-form';
import type { InsertableFact } from '@home-ai/shared/domain/fact/fact';

export function FactsAll() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useFactInfinite({ query: debouncedSearch, pageSize: 20 });

  const { mutate: createFact, isPending: isCreating } = useCreateFact();

  const facts = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const handleCreateSubmit = (formData: InsertableFact) => {
    createFact(formData, {
      onSuccess: (newFact) => {
        setIsCreateModalOpen(false);
        navigate(`/facts/details/${newFact.id}`);
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-background md:p-2 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-accent rounded-xl border border-border/50">
            <BookOpen className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Facts</h1>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
              Search and manage all facts in the knowledge base.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/facts/home"
            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline shrink-0"
          >
            Facts home
          </Link>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-5 h-9 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            Add Fact
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <EntityTable
          columns={factColumns}
          data={facts}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={!!hasNextPage}
          fetchNextPage={fetchNextPage}
          query={search}
          onQueryChange={setSearch}
          searchPlaceholder="Filter facts..."
          onRowClick={(item) => navigate(`/facts/details/${item.id}`)}
        />
      </div>

      <EntityModal
        title="Add New Fact"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        footer={null}
      >
        <FactForm
          viewMode="CREATE"
          onSubmit={handleCreateSubmit}
          isLoading={isCreating}
        />
      </EntityModal>
    </div>
  );
}
