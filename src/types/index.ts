// User Types
export interface User {
  uid: string;
  email: string;
  name: string;
  createdAt: string;
}

// Business App Types
export interface BusinessApp {
  id: string;
  name: string;
  description: string;
  difyUrl: string;
  category: string;
}

// Plan Types
export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  benefits: string[];
  stripePriceId: string;
}

// OpenAI Proxy Service Types
export interface OpenAIProxyService {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  stripePriceId: string;
}

// Contract Types
export interface Contract {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'active' | 'inactive' | 'pending' | 'cancelled';
  startDate: string;
  endDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  contractPdfUrl?: string;
  hasOpenAIProxy?: boolean;
  selectedApps?: string[];
  createdAt: string;
  updatedAt: string;
}

// Form Types
export interface ApplicationForm {
  name: string;
  email: string;
  planId: string;
  hasOpenAIProxy: boolean;
  selectedApps: string[];
}

// Stripe Types
export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
} 