'use client';

import React, { useState } from 'react';
import { 
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Modal,
  Badge,
  Avatar,
  Skeleton,
  LoadingSpinner,
  LoadingCard,
  Form,
  FormField,
  FormLabel,
  FormActions,
  Select,
  Checkbox,
  RadioGroup,
  ToastProvider,
  useToast
} from '@/components/ui';
import { 
  Heart, 
  Download, 
  User,
  Mail
} from 'lucide-react';

const UIShowcasePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    newsletter: false,
    plan: 'basic'
  });

  return (
    <ToastProvider>
      <UIShowcaseContent 
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        formData={formData}
        setFormData={setFormData}
      />
    </ToastProvider>
  );
};

interface UIShowcaseContentProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  formData: {
    name: string;
    email: string;
    category: string;
    newsletter: boolean;
    plan: string;
  };
  setFormData: (data: {
    name: string;
    email: string;
    category: string;
    newsletter: boolean;
    plan: string;
  }) => void;
}

const UIShowcaseContent = ({ isModalOpen, setIsModalOpen, formData, setFormData }: UIShowcaseContentProps) => {
  const { success, error, info, warning } = useToast();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    success('Form submitted successfully!', {
      title: 'Success',
      action: {
        label: 'View Details',
        onClick: () => info('Viewing form details...')
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">UI Component Showcase</h1>
          <p className="text-lg text-muted-foreground">
            Complete UI component library for LinkVault Pro
          </p>
        </div>

        {/* Buttons Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Buttons</h2>
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button loading>Loading</Button>
                <Button icon={<Heart className="h-4 w-4" />}>With Icon</Button>
                <Button icon={<Download className="h-4 w-4" />} iconPosition="right">
                  Download
                </Button>
                <Button fullWidth>Full Width</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This is a default card with standard styling.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This card has elevated shadow styling.
                </p>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <CardTitle>Outlined Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This card has a prominent border.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Form Components Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Form Components</h2>
          <Card>
            <CardHeader>
              <CardTitle>Sample Form</CardTitle>
            </CardHeader>
            <CardContent>
              <Form onSubmit={handleFormSubmit}>
                <FormField>
                  <FormLabel required>Full Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your full name"
                    leftIcon={<User className="h-4 w-4" />}
                  />
                </FormField>

                <FormField>
                  <FormLabel required>Email Address</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter your email"
                    leftIcon={<Mail className="h-4 w-4" />}
                  />
                </FormField>

                <FormField>
                  <FormLabel>Category</FormLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Select a category"
                    options={[
                      { value: 'electronics', label: 'Electronics' },
                      { value: 'fashion', label: 'Fashion' },
                      { value: 'home', label: 'Home & Garden' },
                      { value: 'sports', label: 'Sports & Outdoors' },
                    ]}
                  />
                </FormField>

                <FormField>
                  <FormLabel>Message</FormLabel>
                  <Textarea
                    placeholder="Enter your message..."
                    rows={4}
                  />
                </FormField>

                <Checkbox
                  checked={formData.newsletter}
                  onChange={(e) => setFormData({...formData, newsletter: e.target.checked})}
                  label="Subscribe to newsletter"
                  description="Get updates about new products and deals"
                />

                <RadioGroup
                  name="plan"
                  value={formData.plan}
                  onChange={(value) => setFormData({...formData, plan: value})}
                  label="Choose a plan"
                  options={[
                    { value: 'basic', label: 'Basic Plan', description: 'Free forever' },
                    { value: 'pro', label: 'Pro Plan', description: '$9/month' },
                    { value: 'enterprise', label: 'Enterprise', description: 'Custom pricing' },
                  ]}
                />

                <FormActions>
                  <Button type="button" variant="outline">Cancel</Button>
                  <Button type="submit">Submit Form</Button>
                </FormActions>
              </Form>
            </CardContent>
          </Card>
        </section>

        {/* Badges and Avatars */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Badges & Avatars</h2>
          <Card>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Badges</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="outline">Info</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Avatars</h3>
                <div className="flex items-center gap-4">
                  <Avatar size="sm" src="/api/placeholder/32/32" alt="Small avatar" />
                  <Avatar size="md" src="/api/placeholder/40/40" alt="Medium avatar" />
                  <Avatar size="lg" src="/api/placeholder/48/48" alt="Large avatar" />
                  <Avatar size="xl" fallback="JD" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Loading States */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Loading States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Loading Spinners</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <LoadingSpinner size="sm" />
                  <LoadingSpinner size="md" />
                  <LoadingSpinner size="lg" />
                  <LoadingSpinner size="xl" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skeleton Loading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton variant="circular" className="h-12 w-12" />
              </CardContent>
            </Card>
          </div>

          <LoadingCard />
        </section>

        {/* Interactive Elements */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Interactive Elements</h2>
          <Card>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setIsModalOpen(true)}>
                  Open Modal
                </Button>
                <Button onClick={() => success('Success message!')}>
                  Show Success Toast
                </Button>
                <Button onClick={() => error('Error message!')}>
                  Show Error Toast
                </Button>
                <Button onClick={() => info('Info message!')}>
                  Show Info Toast
                </Button>
                <Button onClick={() => warning('Warning message!')}>
                  Show Warning Toast
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Sample Modal"
          description="This is a sample modal dialog"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This modal demonstrates the modal component with proper styling,
              keyboard navigation, and overlay click handling.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setIsModalOpen(false);
                success('Modal action completed!');
              }}>
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default UIShowcasePage;