import Link from 'next/link';

const platforms = [
  { id: 'lazada', name: 'Lazada', href: 'https://lazada.com.ph' },
  { id: 'shopee', name: 'Shopee', href: 'https://shopee.ph' },
  { id: 'tiktok', name: 'TikTok Shop', href: 'https://shop.tiktok.com' },
  { id: 'amazon', name: 'Amazon', href: 'https://amazon.com' },
  { id: 'aliexpress', name: 'AliExpress', href: 'https://aliexpress.com' },
];

const categories = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'home', name: 'Home & Garden' },
  { id: 'beauty', name: 'Beauty & Health' },
  { id: 'sports', name: 'Sports & Outdoors' },
  { id: 'books', name: 'Books & Media' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* About Section */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold">Affiliate Hub</span>
              </div>
              <p className="text-gray-400 mb-4">
                Your one-stop destination for finding the best deals from multiple e-commerce platforms. 
                Compare prices and save money on your favorite products.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  📘
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  🐦
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  📷
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/deals" className="text-gray-400 hover:text-white">Today's Deals</Link></li>
                <li><Link href="/trending" className="text-gray-400 hover:text-white">Trending Products</Link></li>
                <li><Link href="/favorites" className="text-gray-400 hover:text-white">My Favorites</Link></li>
                <li><Link href="/alerts" className="text-gray-400 hover:text-white">Price Alerts</Link></li>
                <li><Link href="/search" className="text-gray-400 hover:text-white">Advanced Search</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <ul className="space-y-2">
                {categories.map(category => (
                  <li key={category.id}>
                    <Link 
                      href={`/category/${category.id}`}
                      className="text-gray-400 hover:text-white"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platforms */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Shop From</h3>
              <ul className="space-y-2">
                {platforms.map(platform => (
                  <li key={platform.id}>
                    <Link 
                      href={`/platform/${platform.id}`}
                      className="text-gray-400 hover:text-white"
                    >
                      {platform.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              <p>© 2025 Affiliate Hub. All rights reserved.</p>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">
                Terms of Service
              </Link>
              <Link href="/affiliate-disclosure" className="text-gray-400 hover:text-white">
                Affiliate Disclosure
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        {/* Affiliate Disclosure */}
        <div className="border-t border-gray-800 py-4">
          <p className="text-xs text-gray-500 text-center">
            <span className="font-semibold">Affiliate Disclosure:</span> This website contains affiliate links. 
            When you make a purchase through these links, we may earn a commission at no additional cost to you. 
            This helps support our platform and allows us to continue providing free price comparison services.
          </p>
        </div>
      </div>
    </footer>
  );
}
