'use client';

import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showFilters?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showFilters = true,
}: TableSkeletonProps) {
  return (
    <div className="w-full space-y-4 animate-pulse select-none">
      {/* Outer Card matching user reference */}
      <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white shadow-2xs">
        {/* Top Header / Filter Bar */}
        {showFilters && (
          <div className="flex items-center justify-between gap-4 border-b border-zinc-100 p-4 sm:p-5">
            <div className="h-9 w-48 sm:w-64 rounded-xl bg-zinc-100" />
            <div className="h-9 w-28 sm:w-36 rounded-xl bg-zinc-100" />
          </div>
        )}

        {/* Table Column Headers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 items-center gap-4 border-b border-zinc-100 bg-zinc-50/50 px-5 sm:px-6 py-3.5">
          <div className="h-3.5 w-24 sm:w-28 rounded-lg bg-zinc-200/90" />
          <div className="h-3.5 w-20 sm:w-24 rounded-lg bg-zinc-200/90 hidden sm:block" />
          <div className="h-3.5 w-20 sm:w-24 rounded-lg bg-zinc-200/90 hidden sm:block" />
          <div className="h-3.5 w-16 sm:w-20 rounded-lg bg-zinc-200/90 justify-self-end" />
        </div>

        {/* Table Rows matching screenshot */}
        <div className="divide-y divide-zinc-100">
          {Array.from({ length: rows }).map((_, idx) => (
            <div
              key={idx}
              className="grid grid-cols-2 sm:grid-cols-4 items-center gap-4 px-5 sm:px-6 py-4.5"
            >
              {/* Col 1: Main Title / Pill */}
              <div className="flex items-center gap-3">
                <div className="h-6 sm:h-7 w-32 sm:w-44 rounded-lg bg-zinc-100" />
              </div>

              {/* Col 2: Secondary Info */}
              <div className="hidden sm:block">
                <div className="h-5 w-24 sm:w-28 rounded-lg bg-zinc-100" />
              </div>

              {/* Col 3: Status / Date */}
              <div className="hidden sm:block">
                <div className="h-5 w-20 sm:w-24 rounded-lg bg-zinc-100" />
              </div>

              {/* Col 4: Action Buttons (wide pill + square) */}
              <div className="flex items-center justify-end gap-2">
                <div className="h-7 sm:h-8 w-24 sm:w-28 rounded-lg bg-zinc-100" />
                <div className="h-7 sm:h-8 w-8 rounded-lg bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Pagination Skeleton */}
        <div className="flex items-center justify-between border-t border-zinc-100 px-5 sm:px-6 py-3.5 bg-zinc-50/30">
          <div className="h-7 w-28 rounded-lg bg-zinc-100" />
          <div className="flex items-center gap-1.5">
            <div className="h-7 w-7 rounded-lg bg-zinc-100" />
            <div className="h-7 w-7 rounded-lg bg-zinc-100" />
            <div className="h-7 w-7 rounded-lg bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
