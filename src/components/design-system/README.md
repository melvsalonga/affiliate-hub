# LinkVault Pro Design System

## Overview

The LinkVault Pro design system provides a comprehensive set of components, tokens, and guidelines for building consistent, accessible, and beautiful user interfaces. Built with modern web standards and mobile-first responsive design principles.

## Brand Identity

### Colors

Our color system is built around a primary blue and secondary purple palette, with semantic colors for different states and contexts.

#### Primary Colors
- **Primary Blue**: Used for main actions, links, and brand elements
- **Secondary Purple**: Used for accents, highlights, and secondary actions
- **Neutral Grays**: Used for text, borders, and backgrounds

#### Semantic Colors
- **Success Green**: For positive states and confirmations
- **Warning Orange**: For cautions and important notices  
- **Error Red**: For errors and destructive actions

### Typography

#### Font Families
- **Sans-serif**: Inter (primary) - Modern, readable, and professional
- **Monospace**: JetBrains Mono - For code and technical content
- **Display**: Cal Sans (when available) - For headings and brand elements

#### Type Scale
- **Headings**: H1-H6 with responsive sizing
- **Body Text**: Two sizes (body1, body2) for different contexts
- **Captions**: Small text for metadata and labels
- **Overlines**: Uppercase labels for sections

### Spacing System

Consistent spacing using a 4px base unit:
- **xs**: 8px (2 units)
- **sm**: 12px (3 units)  
- **md**: 16px (4 units)
- **lg**: 24px (6 units)
- **xl**: 32px (8 units)

## Component Library

### Layout Components

#### Container
Responsive container with max-width constraints and padding.

```tsx
<Container size="lg" padding="md">
  Content goes here
</Container>
```

#### Section
Full-width sections with consistent spacing and background variants.

```tsx
<Section variant="primary" spacing="lg">
  <h2>Section Title</h2>
  <p>Section content</p>
</Section>
```

#### Grid
Flexible grid system with responsive breakpoints.

```tsx
<Grid cols={3} gap="md" responsive={{ sm: 1, md: 2, lg: 3 }}>
  <GridItem>Item 1</GridItem>
  <GridItem>Item 2</GridItem>
  <GridItem>Item 3</GridItem>
</Grid>
```

#### Flex
Flexbox utility component with responsive options.

```tsx
<Flex direction="row" align="center" justify="between" gap="md">
  <div>Left content</div>
  <div>Right content</div>
</Flex>
```

### UI Components

#### Button
Versatile button component with multiple variants and states.

```tsx
<Button variant="primary" size="lg" loading={isLoading}>
  Click me
</Button>
```

**Variants**: primary, secondary, outline, ghost, danger, success, warning
**Sizes**: xs, sm, md, lg, xl

#### Card
Container component for grouping related content.

```tsx
<Card variant="elevated" padding="lg">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Input
Form input component with validation and helper text.

```tsx
<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
  helperText="We'll never share your email"
  required
/>
```

#### Typography
Semantic typography components with consistent styling.

```tsx
<Typography variant="h1" color="primary" align="center">
  Main Heading
</Typography>

<Body1>Regular paragraph text</Body1>
<Caption color="muted">Small caption text</Caption>
```

#### Badge
Small status indicators and labels.

```tsx
<Badge variant="success" size="md">
  Active
</Badge>
```

#### Avatar
User profile images with fallbacks.

```tsx
<Avatar
  src="/user-avatar.jpg"
  alt="User Name"
  size="lg"
  fallback="UN"
/>
```

#### Modal
Overlay dialogs for focused interactions.

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
>
  Modal content goes here
</Modal>
```

#### Progress
Progress indicators for loading states and completion.

```tsx
<Progress
  value={75}
  max={100}
  variant="primary"
  showLabel
  label="Upload Progress"
/>
```

#### Separator
Visual dividers between content sections.

```tsx
<Separator orientation="horizontal" variant="default" spacing="md" />
```

### Navigation Components

#### ModernHeader
Main site navigation with search, mobile menu, and user actions.

#### MobileNavigation
Bottom navigation bar for mobile devices.

#### Footer
Site footer with links, newsletter signup, and company information.

## Theme System

### Light/Dark Mode Support

All components support both light and dark themes with automatic switching based on user preference.

```tsx
<ThemeProvider defaultTheme="light">
  <App />
</ThemeProvider>
```

### CSS Custom Properties

Theme colors are implemented using CSS custom properties for dynamic switching:

```css
:root {
  --primary: 14 165 233;
  --background: 249 250 251;
  --foreground: 17 24 39;
}

.dark {
  --primary: 56 189 248;
  --background: 3 7 18;
  --foreground: 249 250 251;
}
```

## Responsive Design

### Mobile-First Approach

All components are designed mobile-first with progressive enhancement for larger screens.

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Touch-Friendly Interactions

Mobile components include:
- Minimum 44px touch targets
- Swipe gestures where appropriate
- Touch-optimized spacing and sizing

## Accessibility

### WCAG 2.1 AA Compliance

- Semantic HTML structure
- Proper ARIA labels and roles
- Keyboard navigation support
- Color contrast ratios meet standards
- Screen reader compatibility

### Focus Management

- Visible focus indicators
- Logical tab order
- Focus trapping in modals
- Skip links for navigation

## Performance

### Optimizations

- Tree-shaking support for unused components
- Lazy loading for heavy components
- Optimized bundle sizes
- Efficient re-rendering patterns

### Loading States

- Skeleton screens for content loading
- Progress indicators for long operations
- Smooth transitions and animations

## Usage Guidelines

### Component Composition

Components are designed to work together seamlessly:

```tsx
<Section variant="primary" spacing="lg">
  <Container size="lg">
    <Grid cols={2} gap="lg" responsive={{ sm: 1, lg: 2 }}>
      <Card variant="elevated">
        <CardHeader>
          <Typography variant="h3">Feature Title</Typography>
        </CardHeader>
        <CardContent>
          <Body1>Feature description goes here.</Body1>
        </CardContent>
        <CardFooter>
          <Button variant="primary" fullWidth>
            Learn More
          </Button>
        </CardFooter>
      </Card>
    </Grid>
  </Container>
</Section>
```

### Best Practices

1. **Consistency**: Use design tokens and components consistently
2. **Accessibility**: Always include proper labels and ARIA attributes
3. **Performance**: Lazy load heavy components and optimize images
4. **Responsive**: Test on multiple device sizes
5. **Semantic**: Use appropriate HTML elements and component variants

## Development

### Installation

Components are automatically available when imported from the design system:

```tsx
import { Button, Card, Typography } from '@/components/ui';
import { Container, Grid, Section } from '@/components/layout';
```

### Customization

Components can be customized using the `className` prop and Tailwind CSS:

```tsx
<Button className="bg-gradient-to-r from-purple-500 to-pink-500">
  Custom Styled Button
</Button>
```

### Extending Components

Create new variants by extending existing components:

```tsx
const PrimaryCard = ({ children, ...props }) => (
  <Card variant="elevated" className="border-primary-200" {...props}>
    {children}
  </Card>
);
```

## Support

For questions, issues, or contributions to the design system, please refer to the project documentation or contact the development team.