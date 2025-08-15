import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingPage() {
  return (
    <div className="space-y-4 p-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-3 w-[60px]" />
              </div>
              <Skeleton className="h-3 w-[250px]" />
              <Skeleton className="h-3 w-[300px]" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}