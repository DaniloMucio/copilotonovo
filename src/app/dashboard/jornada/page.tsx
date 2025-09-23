
import { Suspense } from 'react';
import { JornadaManager } from '@/components/JornadaManager';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Clock, Sparkles } from 'lucide-react';


function JornadaSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
                    <Clock className="h-4 w-4 text-white" />
                </div>
                <Skeleton className="h-8 w-1/2" />
            </div>
            
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
