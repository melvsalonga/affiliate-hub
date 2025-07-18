'use client';

import React from 'react';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { Container } from '@/components/layout/Container';
import { Grid, GridItem } from '@/components/layout/Grid';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  ShoppingBag, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Shield,
  Award,
  Zap
} from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'API', href: '/api' },
    { label: 'Integrations', href: '/integrations' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Contact', href: '/contact' },
  ],
  resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'Help Center', href: '/help' },
    { label: 'Community', href: '/community' },
    { label: 'Guides', href: '/guides' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'GDPR', href: '/gdpr' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

const trustIndicators = [
  { icon: Shield, text: '100% Secure' },
  { icon: Award, text: 'Trusted by 10K+' },
  { icon: Zap, text: 'Lightning Fast' },
];

export const Footer: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [isSubscribing, setIsSubscribing] = React.useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubscribing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubscribing(false);
    setEmail('');
    // Show success message
  };

  return (
    <footer className="bg-neutral-900 text-neutral-100 pb-16 md:pb-0">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 py-12">
        <Container>
          <div className="text-center">
            <Typography variant="h3" color="default" className="text-white mb-4">
              Stay Updated with Best Deals
            </Typography>
            <Typography variant="body1" color="default" className="text-primary-100 mb-8 max-w-2xl mx-auto">
              Get exclusive access to the latest deals, price drops, and affiliate marketing insights delivered to your inbox.
            </Typography>
            
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/70"
                required
              />
              <Button
                type="submit"
                variant="secondary"
                loading={isSubscribing}
                className="bg-white text-primary-600 hover:bg-neutral-100"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </Container>
      </div>

      {/* Main Footer Content */}
      <div className="py-16">
        <Container>
          <Grid cols={1} gap="lg" responsive={{ md: 2, lg: 4 }}>
            {/* Brand Section */}
            <GridItem span={1} responsive={{ lg: 1 }}>
              <div className="space-y-6">
                <Link href="/" className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500">
                    <ShoppingBag className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Typography variant="h6" color="default" className="text-white">
                      {brandConfig.name}
                    </Typography>
                    <Typography variant="caption" color="default" className="text-neutral-400">
                      {brandConfig.tagline}
                    </Typography>
                  </div>
                </Link>
                
                <Typography variant="body2" color="default" className="text-neutral-300 leading-relaxed">
                  {brandConfig.description}
                </Typography>

                {/* Trust Indicators */}
                <div className="flex flex-wrap gap-4">
                  {trustIndicators.map((indicator, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-neutral-300">
                      <indicator.icon className="h-4 w-4 text-primary-400" />
                      <span>{indicator.text}</span>
                    </div>
                  ))}
                </div>

                {/* Social Links */}
                <div className="flex space-x-4">
                  {socialLinks.map((social, index) => (
                    <Link
                      key={index}
                      href={social.href}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="h-5 w-5" />
                    </Link>
                  ))}
                </div>
              </div>
            </GridItem>

            {/* Product Links */}
            <GridItem>
              <div className="space-y-4">
                <Typography variant="h6" color="default" className="text-white">
                  Product
                </Typography>
                <ul className="space-y-3">
                  {footerLinks.product.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-neutral-300 hover:text-white transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </GridItem>

            {/* Company Links */}
            <GridItem>
              <div className="space-y-4">
                <Typography variant="h6" color="default" className="text-white">
                  Company
                </Typography>
                <ul className="space-y-3">
                  {footerLinks.company.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-neutral-300 hover:text-white transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </GridItem>

            {/* Resources Links */}
            <GridItem>
              <div className="space-y-4">
                <Typography variant="h6" color="default" className="text-white">
                  Resources
                </Typography>
                <ul className="space-y-3">
                  {footerLinks.resources.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-neutral-300 hover:text-white transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </GridItem>
          </Grid>
        </Container>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800 py-8">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <Typography variant="body2" color="default" className="text-neutral-400">
                © {new Date().getFullYear()} {brandConfig.name}. All rights reserved.
              </Typography>
              <div className="flex items-center space-x-4">
                {footerLinks.legal.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="text-neutral-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-neutral-400">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Philippines</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@linkvaultpro.com</span>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;