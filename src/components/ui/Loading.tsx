interface LoadingProps {
  className?: string;
}

export function LoadingSpinner({ className = '' }: LoadingProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

export function LoadingCard({ className = '' }: LoadingProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse ${className}`}>
      <div className="h-48 bg-gray-200"></div>
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded mt-4"></div>
      </div>
    </div>
  );
}

export function LoadingGrid({ count = 8, className = '' }: LoadingProps & { count?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

export default LoadingSpinner;
