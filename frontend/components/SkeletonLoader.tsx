"use client"

import React from 'react'

interface SkeletonLoaderProps {
    className?: string
    style?: React.CSSProperties
}

export function SkeletonLoader({ className = "", style }: SkeletonLoaderProps) {
    return (
        <div
            className={`animate-shimmer rounded-2xl ${className}`}
            style={style}
        />
    )
}

export function DashboardSkeleton() {
    return (
        <div className="w-full space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <SkeletonLoader className="h-44" />
                <SkeletonLoader className="h-44" />
                <SkeletonLoader className="h-44" />
                <SkeletonLoader className="h-44" />
            </div>
            <SkeletonLoader className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkeletonLoader className="h-80" />
                <SkeletonLoader className="h-80" />
            </div>
            <SkeletonLoader className="h-[520px] w-full" />
        </div>
    )
}
