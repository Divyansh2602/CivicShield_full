"use client"

import React from 'react'

interface SkeletonLoaderProps {
    className?: string
    style?: React.CSSProperties
}

export function SkeletonLoader({ className = "", style }: SkeletonLoaderProps) {
    return (
        <div
            className={`animate-shimmer rounded-md ${className}`}
            style={style}
        />
    )
}

export function DashboardSkeleton() {
    return (
        <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
            {/* Top Banner Skeleton */}
            <SkeletonLoader className="h-24 w-full rounded-lg" />

            {/* Risk Metrics Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <SkeletonLoader className="h-40 rounded-lg" />
                <SkeletonLoader className="h-40 rounded-lg" />
                <SkeletonLoader className="h-40 rounded-lg" />
                <SkeletonLoader className="h-40 rounded-lg" />
            </div>

            {/* AI Threat Insight Skeleton */}
            <SkeletonLoader className="h-32 w-full rounded-lg" />

            {/* Charts Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkeletonLoader className="h-96 rounded-lg" />
                <SkeletonLoader className="h-96 rounded-lg" />
            </div>

            {/* World Map Skeleton */}
            <SkeletonLoader className="h-[500px] w-full rounded-lg" />
        </div>
    )
}
