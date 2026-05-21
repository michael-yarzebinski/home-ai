import React, { useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { useInView } from 'react-intersection-observer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Inbox } from 'lucide-react';

interface EntityTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
}

export function EntityTable<TData>({
  columns,
  data,
  isLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  query,
  onQueryChange,
  searchPlaceholder = "Search records...",
  onRowClick,
}: EntityTableProps<TData>) {
  const { ref, inView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Toolbar - Matches Admin Style */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-8 text-xs bg-transparent border-border/50 focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        
        <div className="flex items-center min-w-[80px] justify-end">
          {!isLoading && data.length > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {data.length} {data.length === 1 ? "Item" : "Items"}
            </span>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto relative">
        <Table className="border-collapse">
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    className="h-10 px-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className="border-b border-border/50 group hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 align-top text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !isLoading && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
                    <Inbox size={24} strokeWidth={1.5} />
                    <p className="text-xs font-medium">No protocols found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Loading Sentinel */}
        <div ref={ref} className="p-8 flex justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground animate-pulse tracking-widest">
              <Loader2 size={12} className="animate-spin" />
              FETCHING MORE...
            </div>
          )}
          {!hasNextPage && data.length > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.3em]">
              End of Items
            </span>
          )}
        </div>
      </div>
    </div>
  );
}