import Image from 'next/image';
import ProductGrid from '@/components/product/ProductGrid';
import { featuredProducts, trendingProducts, dealsProducts } from '@/data/mockProducts';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero section */}
      <section className="mb-16">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Affiliate Hub
          </h1>
          <p className="text-xl text-gray-700 text-center mb-6">
            Discover the best deals from Lazada, Shopee, TikTok Shop, Amazon, AliExpress, and more in one place!
          </p>
          <Image
            src="/shopping.svg"
            alt="Shopping"
            width={200}
            height={200}
            className="mb-8"
          />
          <a
            href="#products"
            className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg hover:bg-blue-700"
          >
            Start Shopping
          </a>
        </div>
      </section>

      {/* Featured products */}
      <section id="products" className="mb-16">
        <h2 className="text-3xl font-semibold text-gray-900 mb-6">Featured Products</h2>
        <ProductGrid products={featuredProducts} />
      </section>

      {/* Trending */}
      <section className="mb-16">
        <h2 className="text-3xl font-semibold text-gray-900 mb-6">Trending Now</h2>
        <ProductGrid products={trendingProducts} />
      </section>

      {/* Deals */}
      <section className="mb-16">
        <h2 className="text-3xl font-semibold text-gray-900 mb-6">Hot Deals</h2>
        <ProductGrid products={dealsProducts} />
      </section>
    </div>
  );
}
