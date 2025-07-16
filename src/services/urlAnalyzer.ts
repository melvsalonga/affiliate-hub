export interface URLAnalysisResult {
  platform: string;
  category: string;
  suggestedName: string;
  suggestedDescription: string;
  suggestedPrice: number;
  suggestedOriginalPrice?: number;
  suggestedBrand?: string;
  suggestedImage: string;
}

export class URLAnalyzer {
  private productKeywords = {
    'Electronics': {
      keywords: ['phone', 'smartphone', 'laptop', 'computer', 'tablet', 'camera', 'headphone', 'earphone', 'speaker', 'tv', 'monitor', 'keyboard', 'mouse', 'charger', 'cable', 'electronics'],
      priceRange: [1000, 50000],
      images: [
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=300&h=300&fit=crop'
      ]
    },
    'Fashion': {
      keywords: ['dress', 'shirt', 'pants', 'shoes', 'bag', 'jacket', 'hat', 'fashion', 'clothing', 'apparel', 'wear', 'style', 'outfit'],
      priceRange: [500, 5000],
      images: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop'
      ]
    },
    'Home & Garden': {
      keywords: ['home', 'kitchen', 'furniture', 'decor', 'garden', 'plant', 'tool', 'appliance', 'cookware', 'bedding', 'storage'],
      priceRange: [200, 10000],
      images: [
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=300&h=300&fit=crop'
      ]
    },
    'Sports & Outdoors': {
      keywords: ['sport', 'fitness', 'gym', 'exercise', 'outdoor', 'camping', 'hiking', 'running', 'yoga', 'bike', 'ball', 'equipment'],
      priceRange: [300, 8000],
      images: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop'
      ]
    },
    'Beauty & Health': {
      keywords: ['beauty', 'skincare', 'makeup', 'cosmetic', 'health', 'wellness', 'supplement', 'vitamin', 'care', 'lotion', 'cream'],
      priceRange: [200, 3000],
      images: [
        'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=300&h=300&fit=crop'
      ]
    },
    'Toys & Games': {
      keywords: ['toy', 'game', 'puzzle', 'doll', 'action', 'board', 'card', 'educational', 'kids', 'children', 'play'],
      priceRange: [100, 2000],
      images: [
        'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300&h=300&fit=crop',
        'https://images.unsplash.com/photo-1607734834519-d8576ae60ea7?w=300&h=300&fit=crop'
      ]
    }
  };

  private brands = {
    'Electronics': ['Apple', 'Samsung', 'Sony', 'LG', 'Xiaomi', 'Huawei', 'Lenovo', 'HP', 'Dell', 'Asus'],
    'Fashion': ['Nike', 'Adidas', 'Uniqlo', 'Zara', 'H&M', 'Forever 21', 'Bench', 'Penshoppe', 'Artwork'],
    'Home & Garden': ['IKEA', 'Tupperware', 'Philips', 'Black & Decker', 'Hamilton Beach', 'Tefal'],
    'Sports & Outdoors': ['Nike', 'Adidas', 'Under Armour', 'Puma', 'Wilson', 'Spalding', 'Decathlon'],
    'Beauty & Health': ['Olay', 'Dove', 'Cetaphil', 'Nivea', 'Garnier', 'Maybelline', 'L\'Oreal'],
    'Toys & Games': ['LEGO', 'Mattel', 'Hasbro', 'Disney', 'Barbie', 'Hot Wheels', 'Fisher-Price']
  };

  analyzeURL(url: string): URLAnalysisResult {
    const platform = this.detectPlatform(url);
    const urlLower = url.toLowerCase();
    
    // Find the best matching category
    const category = this.detectCategory(urlLower);
    const categoryData = this.productKeywords[category as keyof typeof this.productKeywords];
    
    // Generate product details
    const productName = this.generateProductName(urlLower, category);
    const brand = this.selectRandomBrand(category);
    const price = this.generatePrice(categoryData.priceRange);
    const originalPrice = Math.random() > 0.5 ? Math.round(price * (1 + Math.random() * 0.5)) : undefined;
    const image = this.selectRandomImage(categoryData.images);
    
    return {
      platform,
      category,
      suggestedName: productName,
      suggestedDescription: this.generateDescription(productName, category, platform),
      suggestedPrice: price,
      suggestedOriginalPrice: originalPrice,
      suggestedBrand: brand,
      suggestedImage: image
    };
  }

  private detectPlatform(url: string): string {
    if (url.includes('lazada.com')) return 'lazada';
    if (url.includes('shopee.ph')) return 'shopee';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('amazon.com')) return 'amazon';
    if (url.includes('aliexpress.com')) return 'aliexpress';
    return 'unknown';
  }

  private detectCategory(urlLower: string): string {
    let bestMatch = 'Electronics';
    let maxMatches = 0;

    for (const [category, data] of Object.entries(this.productKeywords)) {
      const matches = data.keywords.filter(keyword => urlLower.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = category;
      }
    }

    return bestMatch;
  }

  private generateProductName(urlLower: string, category: string): string {
    const categoryData = this.productKeywords[category as keyof typeof this.productKeywords];
    const matchedKeywords = categoryData.keywords.filter(keyword => urlLower.includes(keyword));
    
    if (matchedKeywords.length > 0) {
      const primaryKeyword = matchedKeywords[0];
      const descriptors = ['Premium', 'Professional', 'High-Quality', 'Advanced', 'Modern', 'Stylish', 'Portable', 'Durable'];
      const descriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
      
      return `${descriptor} ${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)} - Latest Model`;
    }
    
    const genericNames = {
      'Electronics': 'Premium Electronic Device',
      'Fashion': 'Trendy Fashion Item',
      'Home & Garden': 'Home Essential Product',
      'Sports & Outdoors': 'Sports Equipment',
      'Beauty & Health': 'Beauty Care Product',
      'Toys & Games': 'Fun Toy Set'
    };
    
    return genericNames[category as keyof typeof genericNames] || 'Quality Product';
  }

  private generateDescription(name: string, category: string, platform: string): string {
    const descriptions = {
      'Electronics': [
        'High-performance device with advanced features and modern design.',
        'Cutting-edge technology with user-friendly interface and premium build quality.',
        'Professional-grade equipment perfect for both personal and business use.'
      ],
      'Fashion': [
        'Stylish and comfortable design perfect for any occasion.',
        'Trendy fashion piece made from high-quality materials.',
        'Modern style that complements your wardrobe perfectly.'
      ],
      'Home & Garden': [
        'Essential home item that combines functionality with style.',
        'Durable and practical solution for your home needs.',
        'Quality construction designed for everyday use.'
      ],
      'Sports & Outdoors': [
        'Professional-grade equipment for optimal performance.',
        'Durable sports gear designed for active lifestyles.',
        'High-quality equipment suitable for all skill levels.'
      ],
      'Beauty & Health': [
        'Premium skincare solution for healthy, glowing skin.',
        'Gentle yet effective formula suitable for all skin types.',
        'Professional-quality beauty product with proven results.'
      ],
      'Toys & Games': [
        'Fun and educational toy that sparks creativity.',
        'Safe and durable toy designed for hours of entertainment.',
        'Interactive game that promotes learning and development.'
      ]
    };

    const categoryDescriptions = descriptions[category as keyof typeof descriptions] || descriptions.Electronics;
    const baseDescription = categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
    
    return `${baseDescription} Sourced from ${platform.charAt(0).toUpperCase() + platform.slice(1)} with authentic quality guarantee. Perfect for gift-giving or personal use. Limited stock available!`;
  }

  private selectRandomBrand(category: string): string {
    const categoryBrands = this.brands[category as keyof typeof this.brands] || this.brands.Electronics;
    return categoryBrands[Math.floor(Math.random() * categoryBrands.length)];
  }

  private generatePrice(priceRange: number[]): number {
    const min = priceRange[0];
    const max = priceRange[1];
    const price = Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Round to nearest 50 or 100 for realistic pricing
    if (price > 1000) {
      return Math.round(price / 100) * 100;
    } else {
      return Math.round(price / 50) * 50;
    }
  }

  private selectRandomImage(images: string[]): string {
    return images[Math.floor(Math.random() * images.length)];
  }
}

export const urlAnalyzer = new URLAnalyzer();
