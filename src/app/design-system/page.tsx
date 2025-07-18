'use client';

import React from 'react';
import { Container, Section, Grid, GridItem, Flex } from '@/components/layout';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter,
  Input,
  Badge,
  Avatar,
  Typography,
  Heading1,
  Heading2,
  Heading3,
  Body1,
  Body2,
  Caption,
  Progress,
  Separator
} from '@/components/ui';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Heart, Star, ShoppingCart, Download, Settings } from 'lucide-react';

export default function DesignSystemPage() {
  const [progress, setProgress] = React.useState(65);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Section variant="primary" spacing="lg">
        <Flex direction="col" align="center" gap="md">
          <Heading1 color="primary">LinkVault Pro Design System</Heading1>
          <Body1 color="muted" align="center">
            A comprehensive showcase of our design system components and patterns
          </Body1>
          <Flex gap="md" align="center">
            <ThemeToggle />
            <Badge variant="primary">v1.0.0</Badge>
          </Flex>
        </Flex>
      </Section>

      {/* Typography Section */}
      <Section spacing="lg">
        <Heading2 className="mb-8">Typography</Heading2>
        <Grid cols={1} gap="lg" responsive={{ md: 2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Headings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Heading1>Heading 1</Heading1>
              <Heading2>Heading 2</Heading2>
              <Heading3>Heading 3</Heading3>
              <Typography variant="h4">Heading 4</Typography>
              <Typography variant="h5">Heading 5</Typography>
              <Typography variant="h6">Heading 6</Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Body Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Body1>
                This is body1 text. It's perfect for main content, descriptions, and longer text passages.
              </Body1>
              <Body2>
                This is body2 text. It's slightly smaller and great for secondary content.
              </Body2>
              <Caption>This is caption text for metadata and small labels.</Caption>
              <Typography variant="overline">Overline Text</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Section>

      {/* Buttons Section */}
      <Section variant="muted" spacing="lg">
        <Heading2 className="mb-8">Buttons</Heading2>
        <Grid cols={1} gap="lg" responsive={{ md: 2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <Flex direction="col" gap="md">
                <Flex gap="sm" wrap="wrap">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </Flex>
                <Flex gap="sm" wrap="wrap">
                  <Button variant="success">Success</Button>
                  <Button variant="warning">Warning</Button>
                  <Button variant="danger">Danger</Button>
                </Flex>
              </Flex>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Button Sizes & States</CardTitle>
            </CardHeader>
            <CardContent>
              <Flex direction="col" gap="md">
                <Flex gap="sm" align="center" wrap="wrap">
                  <Button size="xs">Extra Small</Button>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                </Flex>
                <Flex gap="sm" wrap="wrap">
                  <Button icon={<Heart className="h-4 w-4" />}>With Icon</Button>
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                </Flex>
              </Flex>
            </CardContent>
          </Card>
        </Grid>
      </Section>

      {/* Cards Section */}
      <Section spacing="lg">
        <Heading2 className="mb-8">Cards</Heading2>
        <Grid cols={1} gap="lg" responsive={{ sm: 2, lg: 3 }}>
          <Card variant="default">
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <Caption color="muted">Basic card variant</Caption>
            </CardHeader>
            <CardContent>
              <Body2>This is a default card with standard styling.</Body2>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">Action</Button>
            </CardFooter>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <Caption color="muted">Enhanced shadow</Caption>
            </CardHeader>
            <CardContent>
              <Body2>This card has enhanced shadow for more prominence.</Body2>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="primary">Action</Button>
            </CardFooter>
          </Card>

          <Card variant="outlined">
            <CardHeader>
              <CardTitle>Outlined Card</CardTitle>
              <Caption color="muted">Prominent border</Caption>
            </CardHeader>
            <CardContent>
              <Body2>This card uses a prominent border instead of shadow.</Body2>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="secondary">Action</Button>
            </CardFooter>
          </Card>
        </Grid>
      </Section>

      {/* Form Elements */}
      <Section variant="accent" spacing="lg">
        <Heading2 className="mb-8">Form Elements</Heading2>
        <Grid cols={1} gap="lg" responsive={{ md: 2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Input Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                helperText="We'll never share your email"
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
              />
              <Input
                label="Search"
                placeholder="Search products..."
                leftIcon={<Settings className="h-4 w-4" />}
              />
              <Input
                label="Error State"
                placeholder="This field has an error"
                error="This field is required"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Other Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Body2 className="mb-2">Progress Indicator</Body2>
                <Progress
                  value={progress}
                  variant="primary"
                  showLabel
                  label="Upload Progress"
                />
                <Flex gap="sm" className="mt-2">
                  <Button 
                    size="xs" 
                    variant="outline"
                    onClick={() => setProgress(Math.max(0, progress - 10))}
                  >
                    -10%
                  </Button>
                  <Button 
                    size="xs" 
                    variant="outline"
                    onClick={() => setProgress(Math.min(100, progress + 10))}
                  >
                    +10%
                  </Button>
                </Flex>
              </div>

              <div>
                <Body2 className="mb-2">Badges</Body2>
                <Flex gap="sm" wrap="wrap">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                </Flex>
              </div>

              <div>
                <Body2 className="mb-2">Avatars</Body2>
                <Flex gap="sm" align="center">
                  <Avatar size="sm" fallback="SM" />
                  <Avatar size="md" fallback="MD" />
                  <Avatar size="lg" fallback="LG" />
                  <Avatar size="xl" fallback="XL" />
                </Flex>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Section>

      {/* Layout Examples */}
      <Section spacing="lg">
        <Heading2 className="mb-8">Layout Components</Heading2>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Grid System</CardTitle>
            <Caption color="muted">Responsive grid with different column counts</Caption>
          </CardHeader>
          <CardContent>
            <Grid cols={1} gap="md" responsive={{ sm: 2, md: 3, lg: 4 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-primary-100 dark:bg-primary-900/20 p-4 rounded-lg text-center">
                  <Body2>Grid Item {i + 1}</Body2>
                </div>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flex Layouts</CardTitle>
            <Caption color="muted">Flexible layouts with different alignments</Caption>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Body2 className="mb-2">Space Between</Body2>
              <Flex justify="between" align="center" className="bg-muted p-4 rounded-lg">
                <Badge variant="primary">Left</Badge>
                <Badge variant="secondary">Right</Badge>
              </Flex>
            </div>
            
            <div>
              <Body2 className="mb-2">Center Aligned</Body2>
              <Flex justify="center" align="center" gap="md" className="bg-muted p-4 rounded-lg">
                <Button size="sm" variant="outline" icon={<Star className="h-4 w-4" />}>
                  Favorite
                </Button>
                <Button size="sm" variant="outline" icon={<ShoppingCart className="h-4 w-4" />}>
                  Add to Cart
                </Button>
                <Button size="sm" variant="outline" icon={<Download className="h-4 w-4" />}>
                  Download
                </Button>
              </Flex>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Separators */}
      <Section spacing="lg">
        <Heading2 className="mb-8">Separators</Heading2>
        <Card>
          <CardContent className="space-y-6">
            <div>
              <Body2>Default Separator</Body2>
              <Separator />
              <Body2>Content after separator</Body2>
            </div>
            
            <div>
              <Body2>Dashed Separator</Body2>
              <Separator variant="dashed" />
              <Body2>Content after dashed separator</Body2>
            </div>
            
            <div>
              <Body2>Dotted Separator</Body2>
              <Separator variant="dotted" />
              <Body2>Content after dotted separator</Body2>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Color Palette */}
      <Section variant="muted" spacing="lg">
        <Heading2 className="mb-8">Color Palette</Heading2>
        <Grid cols={1} gap="lg" responsive={{ md: 2, lg: 3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Primary Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="text-center">
                    <div 
                      className={`h-12 w-full rounded mb-1 bg-primary-${shade}`}
                      title={`primary-${shade}`}
                    />
                    <Caption>{shade}</Caption>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secondary Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="text-center">
                    <div 
                      className={`h-12 w-full rounded mb-1 bg-secondary-${shade}`}
                      title={`secondary-${shade}`}
                    />
                    <Caption>{shade}</Caption>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Semantic Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Body2 className="mb-2">Success</Body2>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-success-500 rounded" />
                  <Badge variant="success">Success</Badge>
                </div>
              </div>
              <div>
                <Body2 className="mb-2">Warning</Body2>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-warning-500 rounded" />
                  <Badge variant="warning">Warning</Badge>
                </div>
              </div>
              <div>
                <Body2 className="mb-2">Error</Body2>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-error-500 rounded" />
                  <Badge variant="error">Error</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Section>
    </div>
  );
}