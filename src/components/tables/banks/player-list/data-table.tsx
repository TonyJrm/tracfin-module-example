"use client";

import { useRef, useEffect } from "react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, VisibilityState } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  selectedClientId?: string;
};

export default function DataTable<TData, TValue>({
  columns,
  data,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  onRowClick,
  selectedClientId,
}: DataTableProps<TData, TValue>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility: {
        client_id: false,
      } as VisibilityState,
    },
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Détection de scroll pour charger plus - dans useEffect pour éviter setState pendant render
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];

    if (
      lastItem &&
      lastItem.index >= rows.length - 1 &&
      hasMore &&
      !isLoading &&
      onLoadMore
    ) {
      onLoadMore();
    }
  }, [virtualItems, rows.length, hasMore, isLoading, onLoadMore]);

  const visibleColumns = table.getVisibleLeafColumns();

  return (
    <div className="w-full rounded-md border text-xs bg-card">
      {/* Header sticky */}
      <div className="flex border-b sticky top-0 bg-background z-10">
        {table.getHeaderGroups().map((hg) =>
          hg.headers.map((h) => (
            <div
              key={h.id}
              className="h-10 px-2 flex items-center font-medium text-muted-foreground"
              style={{ flex: `${h.getSize()} 0 0`, minWidth: 0 }}
            >
              {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
            </div>
          ))
        )}
      </div>
      {/* Body virtualisé */}
      <div
        ref={tableContainerRef}
        className="overflow-auto max-h-[600px]"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            const original = row.original as Record<string, unknown>;
            const isSelected = selectedClientId !== undefined && original.client_id === selectedClientId;
            return (
              <div
                key={row.id}
                className={`flex items-center border-b transition-colors cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`}
                onClick={() => onRowClick?.(row.original)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="px-2 truncate"
                    style={{ flex: `${cell.column.getSize()} 0 0`, minWidth: 0 }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
          {virtualItems.length === 0 && (
            <div className="h-24 flex items-center justify-center text-muted-foreground">
              No results.
            </div>
          )}
        </div>
        {isLoading && (
          <div className="h-12 flex items-center justify-center text-muted-foreground border-t">
            Loading more...
          </div>
        )}
      </div>
    </div>
  )
}