// loading shadcn skeleton component from explorer components
// color unique to jup terminal bg
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={`animate-pulse rounded-md bg-[#C0C0C0] dark:bg-navy-400 ${className}`} {...props} />;
}