// User Types
export interface User {
  uid: string;
  email: string;
  name: string;
  applicantType?: 'individual' | 'corporate'; // 申込者区分
  companyName?: string; // 法人名・会社名
  passwordSetupRequired?: boolean; // 自動作成アカウントのパスワード設定が必要
  createdAt: string;
}

// Business App Types
export interface BusinessApp {
  id: string;
  name: string;
  description: string;
  difyUrl: string;
  category: string;
  price: number;
  currency: string;
  stripePriceId: string;
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

// Storage Plan Types
export interface StoragePlan {
  id: string;
  name: string;
  storageGB: number;
  price: number;
  currency: string;
  stripePriceId: string;
  isDefault?: boolean;
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
  applicantType?: 'individual' | 'corporate'; // 申込者区分
  companyName?: string; // 法人名・会社名
  passwordSetupRequired?: boolean; // 自動作成アカウントのパスワード設定が必要
  customerEmail?: string; // メールアドレスでの検索用
  // 容量プラン関連
  currentStoragePlan?: string; // 現在の容量プランID
  pendingStoragePlan?: string; // 申請中の容量プランID（翌月適用予定）
  storageUpgradeAppliedDate?: string; // 容量変更適用日
  createdAt: string;
  updatedAt: string;
}

// Form Types
export interface ApplicationForm {
  applicantType: 'individual' | 'corporate'; // 申込者区分
  name: string; // 個人名または担当者名
  companyName?: string; // 法人名・会社名
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