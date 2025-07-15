import { Product } from '@/types/product';
import { mockProducts } from '@/data/mockProducts';

export const productUtils = {
  // Get all products (admin + mock products)
  getAllProducts(): Product[] {
    try {
      // Get admin products from localStorage
      const adminProducts = JSON.parse(localStorage.getItem('admin_products') || '[]').map((product: any) => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt)
      }));

      // Combine admin products with mock products
      // Admin products appear first (newer products on top)
      return [...adminProducts, ...mockProducts];
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to mock products if localStorage fails
      return mockProducts;
    }
  },

  // Get products by category
  getProductsByCategory(category: string): Product[] {
    return this.getAllProducts().filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    );
  },

  // Get products by platform
  getProductsByPlatform(platform: string): Product[] {
    return this.getAllProducts().filter(product => 
      product.platform.id === platform
    );
  },

  // Search products
  searchProducts(query: string): Product[] {
    if (!query.trim()) return this.getAllProducts();
    
    const searchTerm = query.toLowerCase();
    return this.getAllProducts().filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      (product.brand && product.brand.toLowerCase().includes(searchTerm))
    );
  },

  // Get product by ID
  getProductById(id: string): Product | undefined {
    return this.getAllProducts().find(product => product.id === id);
  },

  // Get admin products only
  getAdminProducts(): Product[] {
    try {
      return JSON.parse(localStorage.getItem('admin_products') || '[]').map((product: any) => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading admin products:', error);
      return [];
    }
  },

  // Remove product (admin products only)
  removeProduct(productId: string): void {
    try {
      const adminProducts = this.getAdminProducts();
      const updatedProducts = adminProducts.filter(product => product.id !== productId);
      localStorage.setItem('admin_products', JSON.stringify(updatedProducts));
    } catch (error) {
      console.error('Error removing product:', error);
    }
  },

  // Update product (admin products only)
  updateProduct(updatedProduct: Product): void {
    try {
      const adminProducts = this.getAdminProducts();
      const updatedProducts = adminProducts.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      );
      localStorage.setItem('admin_products', JSON.stringify(updatedProducts));
    } catch (error) {
      console.error('Error updating product:', error);
    }
  }
};
