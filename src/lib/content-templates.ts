export interface ContentTemplate {
  id: string
  name: string
  description: string
  type: 'review' | 'comparison' | 'buying-guide'
  structure: ContentSection[]
  seoTemplate: SEOTemplate
}

export interface ContentSection {
  id: string
  title: string
  type: 'heading' | 'paragraph' | 'list' | 'pros-cons' | 'rating' | 'product-info' | 'comparison-table'
  required: boolean
  placeholder?: string
  options?: string[]
}

export interface SEOTemplate {
  titleTemplate: string
  descriptionTemplate: string
  keywordSuggestions: string[]
  structuredDataType: 'Product' | 'Review' | 'Article' | 'HowTo'
}

export const contentTemplates: ContentTemplate[] = [
  {
    id: 'product-review',
    name: 'Product Review',
    description: 'Comprehensive product review template with ratings and pros/cons',
    type: 'review',
    structure: [
      {
        id: 'intro',
        title: 'Introduction',
        type: 'paragraph',
        required: true,
        placeholder: 'Brief introduction to the product and why you\'re reviewing it. Include what makes this product unique and why readers should care about this review.'
      },
      {
        id: 'product-overview',
        title: 'Product Overview',
        type: 'product-info',
        required: true
      },
      {
        id: 'unboxing',
        title: 'Unboxing & First Impressions',
        type: 'paragraph',
        required: false,
        placeholder: 'Describe the packaging, what\'s included, and your first impressions...'
      },
      {
        id: 'key-features',
        title: 'Key Features',
        type: 'list',
        required: true,
        placeholder: 'List the main features of the product with brief explanations...'
      },
      {
        id: 'performance-testing',
        title: 'Performance & Testing',
        type: 'paragraph',
        required: true,
        placeholder: 'Detailed testing results, performance metrics, real-world usage scenarios...'
      },
      {
        id: 'pros-cons',
        title: 'Pros and Cons',
        type: 'pros-cons',
        required: true
      },
      {
        id: 'comparison',
        title: 'How It Compares',
        type: 'paragraph',
        required: false,
        placeholder: 'Compare with similar products in the market...'
      },
      {
        id: 'who-should-buy',
        title: 'Who Should Buy This?',
        type: 'paragraph',
        required: true,
        placeholder: 'Target audience, use cases, and scenarios where this product excels...'
      },
      {
        id: 'rating',
        title: 'Overall Rating',
        type: 'rating',
        required: true
      },
      {
        id: 'conclusion',
        title: 'Final Verdict',
        type: 'paragraph',
        required: true,
        placeholder: 'Summary, final recommendation, and where to buy...'
      }
    ],
    seoTemplate: {
      titleTemplate: '{productName} Review {year}: Honest Analysis & Testing Results',
      descriptionTemplate: 'In-depth {productName} review with real testing, pros/cons, and honest verdict. See if this {category} is worth buying in {year}.',
      keywordSuggestions: [
        '{productName} review {year}',
        '{productName} honest review',
        '{productName} pros and cons',
        'best {category} {year}',
        '{productName} worth it',
        '{productName} vs alternatives',
        '{productName} testing results'
      ],
      structuredDataType: 'Review'
    }
  },
  {
    id: 'product-comparison',
    name: 'Product Comparison',
    description: 'Side-by-side comparison of multiple products',
    type: 'comparison',
    structure: [
      {
        id: 'intro',
        title: 'Introduction',
        type: 'paragraph',
        required: true,
        placeholder: 'Introduce the products being compared and why this comparison is valuable...'
      },
      {
        id: 'comparison-overview',
        title: 'Products Overview',
        type: 'paragraph',
        required: true,
        placeholder: 'Brief overview of each product being compared...'
      },
      {
        id: 'comparison-table',
        title: 'Feature Comparison',
        type: 'comparison-table',
        required: true
      },
      {
        id: 'detailed-comparison',
        title: 'Detailed Comparison',
        type: 'paragraph',
        required: true,
        placeholder: 'In-depth comparison of features, performance, value...'
      },
      {
        id: 'winner',
        title: 'The Winner',
        type: 'paragraph',
        required: true,
        placeholder: 'Which product comes out on top and why...'
      },
      {
        id: 'recommendations',
        title: 'Our Recommendations',
        type: 'paragraph',
        required: true,
        placeholder: 'Specific recommendations for different use cases or budgets...'
      }
    ],
    seoTemplate: {
      titleTemplate: '{product1} vs {product2}: Which {category} Is Better in {year}?',
      descriptionTemplate: 'Compare {product1} and {product2} side-by-side. See which {category} offers better value, features, and performance for your needs.',
      keywordSuggestions: ['{product1} vs {product2}', 'best {category} comparison', '{product1} {product2} difference'],
      structuredDataType: 'Article'
    }
  },
  {
    id: 'buying-guide',
    name: 'Buying Guide',
    description: 'Comprehensive buying guide to help users make informed decisions',
    type: 'buying-guide',
    structure: [
      {
        id: 'intro',
        title: 'Introduction',
        type: 'paragraph',
        required: true,
        placeholder: 'Why this buying guide is important, what readers will learn, and how it will help them make the right choice...'
      },
      {
        id: 'quick-picks',
        title: 'Quick Picks',
        type: 'list',
        required: true,
        placeholder: 'Top 3-5 quick recommendations for different needs (best overall, best budget, best premium, etc.)...'
      },
      {
        id: 'what-to-look-for',
        title: 'Key Factors to Consider',
        type: 'list',
        required: true,
        placeholder: 'Essential features, specifications, and factors to evaluate when choosing...'
      },
      {
        id: 'types-explained',
        title: 'Types & Categories Explained',
        type: 'paragraph',
        required: true,
        placeholder: 'Different types, styles, or categories available with their pros and cons...'
      },
      {
        id: 'budget-guide',
        title: 'Budget Guide & Price Ranges',
        type: 'paragraph',
        required: true,
        placeholder: 'What to expect at different price points, value for money considerations...'
      },
      {
        id: 'detailed-recommendations',
        title: 'Detailed Product Recommendations',
        type: 'paragraph',
        required: true,
        placeholder: 'In-depth analysis of top products with reasons why they made the list...'
      },
      {
        id: 'sizing-compatibility',
        title: 'Sizing & Compatibility Guide',
        type: 'paragraph',
        required: false,
        placeholder: 'Size charts, compatibility requirements, fitting guides...'
      },
      {
        id: 'maintenance-care',
        title: 'Maintenance & Care Tips',
        type: 'paragraph',
        required: false,
        placeholder: 'How to maintain, clean, and care for the product to extend its life...'
      },
      {
        id: 'common-mistakes',
        title: 'Common Buying Mistakes to Avoid',
        type: 'list',
        required: true,
        placeholder: 'Pitfalls, misconceptions, and mistakes that buyers often make...'
      },
      {
        id: 'where-to-buy',
        title: 'Where to Buy & Best Deals',
        type: 'paragraph',
        required: true,
        placeholder: 'Best places to purchase, seasonal sales, warranty considerations...'
      },
      {
        id: 'faq',
        title: 'Frequently Asked Questions',
        type: 'list',
        required: false,
        placeholder: 'Common questions and detailed answers...'
      },
      {
        id: 'conclusion',
        title: 'Final Recommendations',
        type: 'paragraph',
        required: true,
        placeholder: 'Summary of top picks for different needs and final buying advice...'
      }
    ],
    seoTemplate: {
      titleTemplate: 'Best {category} {year}: Complete Buying Guide & Top Picks',
      descriptionTemplate: 'Expert {category} buying guide with top recommendations, key factors to consider, and everything you need to choose the perfect {category} in {year}.',
      keywordSuggestions: [
        'best {category} {year}',
        '{category} buying guide',
        'how to choose {category}',
        'top {category} {year}',
        '{category} reviews',
        'best {category} for beginners',
        '{category} comparison guide',
        'cheap vs expensive {category}'
      ],
      structuredDataType: 'HowTo'
    }
  },
  {
    id: 'deal-alert',
    name: 'Deal Alert',
    description: 'Template for highlighting special deals and limited-time offers',
    type: 'review',
    structure: [
      {
        id: 'deal-headline',
        title: 'Deal Headline',
        type: 'heading',
        required: true,
        placeholder: 'Eye-catching headline about the deal (e.g., "50% Off Premium Headphones - Limited Time!")'
      },
      {
        id: 'deal-summary',
        title: 'Deal Summary',
        type: 'paragraph',
        required: true,
        placeholder: 'Quick overview of the deal, original price, sale price, and savings amount...'
      },
      {
        id: 'product-highlights',
        title: 'Product Highlights',
        type: 'list',
        required: true,
        placeholder: 'Key features and benefits that make this deal worth it...'
      },
      {
        id: 'deal-details',
        title: 'Deal Details',
        type: 'paragraph',
        required: true,
        placeholder: 'Expiration date, coupon codes, terms and conditions, stock availability...'
      },
      {
        id: 'why-good-deal',
        title: 'Why This Is a Great Deal',
        type: 'paragraph',
        required: true,
        placeholder: 'Historical pricing, comparison with competitors, value analysis...'
      },
      {
        id: 'how-to-get-deal',
        title: 'How to Get This Deal',
        type: 'list',
        required: true,
        placeholder: 'Step-by-step instructions to claim the deal...'
      }
    ],
    seoTemplate: {
      titleTemplate: '{productName} Deal: {discount}% Off - Limited Time Offer',
      descriptionTemplate: 'Save {discount}% on {productName}! Limited time deal with {savings} savings. Get this {category} deal before it expires.',
      keywordSuggestions: [
        '{productName} deal',
        '{productName} discount',
        '{productName} sale',
        'cheap {category}',
        '{productName} coupon',
        'best {category} deals'
      ],
      structuredDataType: 'Product'
    }
  },
  {
    id: 'roundup-list',
    name: 'Best Of Roundup',
    description: 'Template for "Best of" lists and product roundups',
    type: 'comparison',
    structure: [
      {
        id: 'intro',
        title: 'Introduction',
        type: 'paragraph',
        required: true,
        placeholder: 'Introduction to the roundup, criteria for selection, and what readers will find...'
      },
      {
        id: 'methodology',
        title: 'How We Choose',
        type: 'paragraph',
        required: true,
        placeholder: 'Testing methodology, evaluation criteria, and selection process...'
      },
      {
        id: 'quick-list',
        title: 'Quick List',
        type: 'list',
        required: true,
        placeholder: 'Numbered list of top picks with brief descriptions...'
      },
      {
        id: 'detailed-reviews',
        title: 'Detailed Reviews',
        type: 'paragraph',
        required: true,
        placeholder: 'In-depth review of each product with pros, cons, and recommendations...'
      },
      {
        id: 'comparison-table',
        title: 'Comparison Table',
        type: 'comparison-table',
        required: false
      },
      {
        id: 'also-considered',
        title: 'Also Considered',
        type: 'paragraph',
        required: false,
        placeholder: 'Products that didn\'t make the main list but are worth mentioning...'
      },
      {
        id: 'conclusion',
        title: 'Bottom Line',
        type: 'paragraph',
        required: true,
        placeholder: 'Final recommendations and summary of top picks...'
      }
    ],
    seoTemplate: {
      titleTemplate: 'Best {category} {year}: Top {number} Picks Tested & Reviewed',
      descriptionTemplate: 'We tested {number} {category} to find the best ones. See our top picks for {year} with detailed reviews and comparisons.',
      keywordSuggestions: [
        'best {category} {year}',
        'top {category}',
        '{category} reviews',
        'best {category} list',
        '{category} comparison',
        'top rated {category}'
      ],
      structuredDataType: 'Article'
    }
  }
]

export function getTemplateById(id: string): ContentTemplate | undefined {
  return contentTemplates.find(template => template.id === id)
}

export function getTemplatesByType(type: ContentTemplate['type']): ContentTemplate[] {
  return contentTemplates.filter(template => template.type === type)
}

export function generateSEOFromTemplate(template: ContentTemplate, variables: Record<string, string>) {
  const replaceVariables = (text: string) => {
    return Object.entries(variables).reduce((result, [key, value]) => {
      return result.replace(new RegExp(`{${key}}`, 'g'), value)
    }, text)
  }

  return {
    title: replaceVariables(template.seoTemplate.titleTemplate),
    description: replaceVariables(template.seoTemplate.descriptionTemplate),
    keywords: template.seoTemplate.keywordSuggestions.map(keyword => replaceVariables(keyword)),
    structuredDataType: template.seoTemplate.structuredDataType
  }
}