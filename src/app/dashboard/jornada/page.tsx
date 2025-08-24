
import { Suspense } from 'react';
import { JornadaManager } from '@/components/JornadaManager';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';


function JornadaSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-1/2" />
             <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/2" />
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            </div>
        </div>
    )
}


export default function JornadaPage() {
    return (
        <Suspense fallback={<JornadaSkeleton />}>
            <JornadaManager />
        </Suspense>
    )
}
