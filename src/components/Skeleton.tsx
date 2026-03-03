interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`skeleton ${className}`} />
);

export const SkeletonText = ({ lines = 1, className = '' }: { lines?: number; className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-3.5 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`} />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="card p-5 space-y-3">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-1/4" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

export const SkeletonTableRow = () => (
  <tr>
    <td className="px-4 py-4"><Skeleton className="h-5 w-12 rounded-full" /></td>
    <td className="px-4 py-4">
      <Skeleton className="h-4 w-48 mb-1.5" />
      <Skeleton className="h-3 w-24" />
    </td>
    <td className="px-4 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
    <td className="px-4 py-4 hidden md:table-cell"><Skeleton className="h-4 w-28" /></td>
    <td className="px-4 py-4 hidden lg:table-cell"><Skeleton className="h-4 w-12" /></td>
    <td className="px-4 py-4 hidden lg:table-cell"><Skeleton className="h-4 w-16" /></td>
    <td className="px-4 py-4"><Skeleton className="h-4 w-4" /></td>
  </tr>
);
