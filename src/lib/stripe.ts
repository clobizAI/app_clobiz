import Stripe from 'stripe';

// 開発時はダミーキーを使用
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development';

// 開発用フラグ（実際の有効なStripeキーがない場合はデモモード）
export const isDemoMode = true; // 開発中は常にデモモード

// デモモードではnull、本番では実際のStripeインスタンス
export const stripe = isDemoMode ? null : new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

// 業務アプリ定義
export const businessApps = [
  {
    id: 'faq-chat-ai',
    name: 'FAQチャットAI',
    description: '問い合わせ業務をAIで自動化',
    difyUrl: 'https://dify.example.com/faq-chat',
    category: 'customer-service'
  },
  {
    id: 'document-analyzer',
    name: '文書解析AI',
    description: '契約書や報告書の内容を自動分析',
    difyUrl: 'https://dify.example.com/document-analyzer',
    category: 'document'
  },
  {
    id: 'email-assistant',
    name: 'メール作成AI',
    description: 'ビジネスメールの下書きを自動生成',
    difyUrl: 'https://dify.example.com/email-assistant',
    category: 'communication'
  },
  {
    id: 'meeting-summarizer',
    name: '会議要約AI',
    description: '会議録から重要ポイントを抽出',
    difyUrl: 'https://dify.example.com/meeting-summarizer',
    category: 'productivity'
  },
  {
    id: 'sales-proposal',
    name: '営業提案AI',
    description: '顧客情報から最適な提案書を作成',
    difyUrl: 'https://dify.example.com/sales-proposal',
    category: 'sales'
  },
  {
    id: 'hr-screening',
    name: '人事選考AI',
    description: '履歴書の初期スクリーニングを自動化',
    difyUrl: 'https://dify.example.com/hr-screening',
    category: 'hr'
  },
  {
    id: 'inventory-optimizer',
    name: '在庫最適化AI',
    description: '需要予測に基づく在庫管理',
    difyUrl: 'https://dify.example.com/inventory-optimizer',
    category: 'operations'
  },
  {
    id: 'risk-analyzer',
    name: 'リスク分析AI',
    description: '投資や事業リスクの評価分析',
    difyUrl: 'https://dify.example.com/risk-analyzer',
    category: 'finance'
  },
  {
    id: 'content-generator',
    name: 'コンテンツ生成AI',
    description: 'マーケティング用コンテンツの自動作成',
    difyUrl: 'https://dify.example.com/content-generator',
    category: 'marketing'
  },
  {
    id: 'quality-checker',
    name: '品質検査AI',
    description: '製品やサービスの品質チェック',
    difyUrl: 'https://dify.example.com/quality-checker',
    category: 'quality'
  }
];

// プラン設定（基本プランのみ）
export const plans = [
  {
    id: 'basic',
    name: '基本プラン【Dify】',
    price: 800,
    currency: 'HKD',
    features: [
      '🇯🇵 多言語UIで誰でも使える',
      '⚡ ノーコード導入（設定不要）',
      '🔒 入力内容はAIに学習されません',
      '📊 ログが残り、管理しやすい',      
    ],
    benefits: [      
      '🚀 アプリ追加：無制限',
      '👨‍👩‍👧‍👦 利用ユーザー追加：無制限',
      '🗄️ データストレージ：5GB'
    ],
    stripePriceId: 'price_test_basic_hkd',
  }
];

// OpenAI API代行サービス
export const openaiProxyService = {
  id: 'openai-proxy',
  name: 'API代行『OpenAI』',
  price: 200,
  currency: 'HKD',
  description: 'OpenAI APIをお持ちでない方向けの代行サービス',
  stripePriceId: 'price_test_openai_proxy_hkd',
}; 