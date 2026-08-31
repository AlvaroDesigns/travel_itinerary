'use client';

import React from 'react';

interface TabSkeletonProps {
  tab: string;
}

export function TabSkeleton({ tab }: TabSkeletonProps) {
  if (tab === 'descripcion') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-zinc-200" />
            <div className="space-y-2">
              <div className="h-5 w-48 rounded-lg bg-zinc-200" />
              <div className="h-3 w-32 rounded-lg bg-zinc-100" />
            </div>
          </div>
          <div className="h-4 w-full rounded-lg bg-zinc-100" />
          <div className="h-4 w-5/6 rounded-lg bg-zinc-100" />
          <div className="h-4 w-4/6 rounded-lg bg-zinc-100" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-zinc-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-zinc-100 p-3 space-y-2">
                <div className="h-3 w-16 rounded bg-zinc-200" />
                <div className="h-5 w-12 rounded bg-zinc-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'detalles') {
    return (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 animate-pulse">
        <div className="space-y-6 md:col-span-2">
          {/* Main cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-zinc-200/80 bg-white p-4 space-y-2">
                <div className="h-3 w-16 rounded bg-zinc-200" />
                <div className="h-6 w-24 rounded bg-zinc-300" />
                <div className="h-2 w-12 rounded bg-zinc-100" />
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 space-y-4">
            <div className="h-5 w-40 rounded-lg bg-zinc-200" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-50">
                <div className="h-10 w-10 rounded-xl bg-zinc-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-zinc-200" />
                  <div className="h-3 w-1/4 rounded bg-zinc-100" />
                </div>
                <div className="h-6 w-16 rounded bg-zinc-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 space-y-4">
          <div className="h-5 w-32 rounded-lg bg-zinc-200" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-20 rounded bg-zinc-200" />
                  <div className="h-3 w-12 rounded bg-zinc-300" />
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tab === 'notas') {
    return (
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 space-y-5 animate-pulse">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="space-y-2">
            <div className="h-5 w-36 rounded-lg bg-zinc-200" />
            <div className="h-3 w-56 rounded bg-zinc-100" />
          </div>
          <div className="h-10 w-32 rounded-xl bg-zinc-200" />
        </div>
        <div className="h-64 w-full rounded-2xl bg-zinc-50 border border-zinc-200/60 p-4 space-y-3">
          <div className="h-4 w-full rounded bg-zinc-200/80" />
          <div className="h-4 w-5/6 rounded bg-zinc-200/60" />
          <div className="h-4 w-4/6 rounded bg-zinc-200/60" />
          <div className="h-4 w-3/4 rounded bg-zinc-200/40" />
        </div>
      </div>
    );
  }

  if (tab === 'configuracion') {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-3xl border border-zinc-200/80 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-zinc-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded bg-zinc-200" />
                  <div className="h-3 w-48 rounded bg-zinc-100" />
                </div>
              </div>
              <div className="h-6 w-12 rounded-full bg-zinc-200" />
            </div>
            <div className="h-10 w-full rounded-xl bg-zinc-50 border border-zinc-200/60" />
          </div>
        ))}
      </div>
    );
  }

  // Default: Itinerario Skeleton
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 animate-pulse">
      {/* Timeline left col */}
      <div className="space-y-6 lg:col-span-2">
        {/* Day Selector Strip Skeleton */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 rounded bg-zinc-200" />
            <div className="h-4 w-12 rounded-full bg-zinc-100" />
          </div>
          <div className="flex gap-2.5 overflow-hidden pt-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-20 w-18 shrink-0 rounded-2xl bg-zinc-100 p-2.5 flex flex-col justify-between"
              >
                <div className="h-3 w-8 rounded bg-zinc-200" />
                <div className="h-6 w-6 rounded bg-zinc-300" />
                <div className="h-2 w-10 rounded bg-zinc-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Action Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-40 rounded-lg bg-zinc-200" />
            <div className="h-3 w-28 rounded bg-zinc-100" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-zinc-200" />
        </div>

        {/* Activity Timeline Skeletons */}
        <div className="space-y-4 pl-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-20 rounded-full bg-zinc-200" />
                  <div className="h-5 w-14 rounded-md bg-zinc-100" />
                </div>
                <div className="h-5 w-16 rounded bg-zinc-200" />
              </div>
              <div className="h-4 w-2/3 rounded bg-zinc-200" />
              <div className="h-3 w-1/2 rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Expense Bento Skeleton */}
      <div className="space-y-6">
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 rounded bg-zinc-200" />
            <div className="h-5 w-16 rounded-full bg-zinc-100" />
          </div>
          <div className="h-8 w-28 rounded-lg bg-zinc-300" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-20 rounded bg-zinc-200" />
                  <div className="h-3 w-12 rounded bg-zinc-300" />
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
