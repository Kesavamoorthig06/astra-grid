import React from 'react';
import { Skeleton } from '../ui/skeleton';

export default function FormSkeleton() {
  return (
    <div className="relative min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-4">
          <Skeleton className="h-8 w-96 mb-2" />
          <Skeleton className="h-4 w-[500px]" />
        </div>

        {/* Form Sections Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Section 1 */}
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Skeleton className="h-4 w-24 mb-1.5" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-32 mb-1.5" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Skeleton className="h-4 w-28 mb-1.5" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-28 mb-1.5" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-5 w-44" />
              </div>
              <div className="space-y-3">
                <div>
                  <Skeleton className="h-4 w-36 mb-1.5" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-44 mb-1.5" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Skeleton className="h-4 w-32 mb-1.5" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-40 mb-1.5" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Skeleton className="h-4 w-36 mb-1.5" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-36 mb-1.5" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Skeleton className="h-4 w-44 mb-1.5" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-44 mb-1.5" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Button Skeleton */}
          <div className="flex justify-center pt-2">
            <Skeleton className="h-11 w-56" />
          </div>
        </div>
      </div>
    </div>
  );
}
