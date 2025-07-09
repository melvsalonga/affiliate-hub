import { Product } from '@/types/product';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  showPlatform?: boolean;
  showDescription?: boolean;
  className?: string;
  emptyMessage?: string;
}

export default function ProductGrid({
  products,
  showPlatform = true,
  showDescription = false,
  className = '',
  emptyMessage = 'No products found'
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="text-6xl mb-4">🛍️</div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">No Products Found</h3>
        <p className="text-gray-600 text-center max-w-md">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          showPlatform={showPlatform}
          showDescription={showDescription}
        />
      ))}
    </div>
  );
}
