import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@home-ai/shared/domain/role/role';
import type { UpdatableFact } from '@home-ai/shared/domain/fact/fact';
import { useFactById, useUpdateFact, useSoftDeleteFact } from '@/api/facts/facts.hooks';
import { useAuth } from '@/contexts/auth-context';
import { EntityModal } from '@/components/entity-modal/entity-modal';
import { FactForm } from '@/components/form/entities/fact/fact-form';
import { Button } from '@/components/ui/button';
import { FactDetailsSummary } from './fact-details-summary';

function userHasWriteAccess(writeRoles: Role[], userRole: string | undefined): boolean {
  if (!userRole) return false;
  return writeRoles.includes(userRole as Role);
}

export default function FactDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: fact, isLoading, isError, error } = useFactById(id);
  const { mutate: updateFact, isPending: isUpdating } = useUpdateFact();
  const { mutate: deleteFact, isPending: isDeleting } = useSoftDeleteFact();

  const canWrite = fact ? userHasWriteAccess(fact.writeRoles as Role[], user?.role) : false;

  const handleDeleteFact = () => {
    if (!id) return;
    deleteFact(id, {
      onSuccess: () => {
        toast.success('Fact deleted');
        navigate('/facts/all');
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const handleUpdateFact = (formData: UpdatableFact) => {
    if (!id) return;
    updateFact(
      { id, body: formData },
      {
        onSuccess: () => {
          toast.success('Fact saved');
          setIsEditModalOpen(false);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (!id) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Missing fact id.{' '}
        <Link to="/facts/all" className="text-primary hover:underline">
          Back to all facts
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin mr-2" />
        Loading fact…
      </div>
    );
  }

  if (isError || !fact) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">{error?.message ?? 'Fact not found.'}</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/facts/all">
            <ArrowLeft className="size-4 mr-2" />
            All facts
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div className="p-2.5 bg-accent rounded-xl border border-border/50 shrink-0">
            <BookOpen className="h-6 w-6 text-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
              {fact.key}
            </h1>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
              Fact
            </p>
          </div>
        </div>
        {canWrite && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-xs font-bold uppercase tracking-wider"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Pencil className="size-3.5 mr-1.5" />
            Edit fact
          </Button>
        )}
      </div>

      <FactDetailsSummary fact={fact} />

      <EntityModal
        title="Edit fact"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        formId="edit-fact-form"
        saveLabel="Update Fact"
        isLoading={isUpdating}
        onDelete={canWrite ? handleDeleteFact : undefined}
        isDeleting={isDeleting}
      >
        <FactForm
          key={String(fact.updatedAt ?? fact.id)}
          viewMode="EDIT"
          formId="edit-fact-form"
          isLoading={isUpdating}
          onSubmit={handleUpdateFact}
          initialData={fact}
        />
      </EntityModal>
    </div>
  );
}
