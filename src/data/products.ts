import { Product } from '@/types/stripe';

export const sampleProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'Premium Course',
    description: 'Complete Next.js and Stripe integration course',
    price: 4999, // $49.99 in cents
    currency: 'usd',
    image: '/images/course-premium.jpg'
  },
  {
    id: 'prod_2',
    name: 'Basic Course',
    description: 'Introduction to Stripe payments',
    price: 2999, // $29.99 in cents
    currency: 'usd',
    image: '/images/course-basic.jpg'
  },
  {
    id: 'prod_3',
    name: 'Advanced Workshop',
    description: 'Advanced Stripe features and webhooks',
    price: 7999, // $79.99 in cents
    currency: 'usd',
    image: '/images/workshop-advanced.jpg'
  }
];

export const getProductById = (id: string): Product | undefined => {
  return sampleProducts.find(product => product.id === id);
};

export const formatPrice = (amount: number, currency: string = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

