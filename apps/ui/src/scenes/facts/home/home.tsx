import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronRight, Loader2, Tag } from 'lucide-react';
import type { Fact } from '@home-ai/shared/domain/fact/fact';
import { Badge } from '@/components/ui/badge';
import { useFactHomeData } from './use-fact-home-data';

function FactRow({ fact }: { fact: Fact }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/facts/details/${fact.id}`)}
      className="w-full text-left flex items-start justify-between gap-4 px-3 py-2.5 rounded-lg hover:bg-accent/60 transition-colors group"
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate">{fact.key}</span>
        <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {fact.value}
        </span>
      </div>
      {fact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 shrink-0 mt-0.5">
          {fact.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
}

function TagSection({ tag, facts }: { tag: string; facts: Fact[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold tracking-tight">{tag}</span>
          <span className="text-xs text-muted-foreground font-medium ml-1">({facts.length})</span>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border/30 divide-y divide-border/20 px-2 py-1.5">
          {facts.map((fact) => (
            <FactRow key={fact.id} fact={fact} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FactHome() {
  const { groupedByTag, isLoading, totalFacts } = useFactHomeData();

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-accent rounded-xl border border-border/50 shrink-0">
            <BookOpen className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Facts</h1>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
              Knowledge base · {totalFacts} {totalFacts === 1 ? 'fact' : 'facts'}
            </p>
          </div>
        </div>

        <Link
          to="/facts/all"
          className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline shrink-0 pt-1"
        >
          View all facts
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin mr-2" />
          Loading facts…
        </div>
      ) : groupedByTag.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <BookOpen className="size-8 mb-3 opacity-40" />
          <p className="text-sm font-medium">No facts yet</p>
          <p className="text-xs mt-1 max-w-xs">
            Facts added by you or the AI assistant will appear here, grouped by tag.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groupedByTag.map(({ tag, facts }) => (
            <TagSection key={tag} tag={tag} facts={facts} />
          ))}
        </div>
      )}
    </div>
  );
}
