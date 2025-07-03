import Stripe from 'stripe';

// 開発時はダミーキーを使用
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development';

// Stripeインスタンスを作成
export const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

// 業務アプリ定義（各アプリ400ドル/月のサブスクリプション）
export const businessApps = [
  {
    id: 'email-assistant',
    name: 'メール作成AI',
    description: 'ビジネスメールの下書きを自動生成',
    difyUrl: 'https://dify-seed.nittel.net/chatbot/H0IuXgBXB5OQxBBa',
    category: 'communication',
    price: 400,
    currency: 'HKD',
    stripePriceId: 'price_email_assistant_400'
  },
  {
    id: 'faq-chat-ai',
    name: 'FAQチャットAI',
    description: '問い合わせ業務をAIで自動化',
    difyUrl: 'https://dify-seed.nittel.net/chatbot/H0IuXgBXB5OQxBBa',
    category: 'customer-service',
    price: 400,
    currency: 'HKD',
    stripePriceId: 'price_faq_chat_ai_400'
  },
  {
    id: 'document-analyzer',
    name: '文書解析AI',
    description: '契約書や報告書の内容を自動分析',
    difyUrl: 'https://dify-seed.nittel.net/chatbot/H0IuXgBXB5OQxBBa',
    category: 'document',
    price: 400,
    currency: 'HKD',
    stripePriceId: 'price_document_analyzer_400'
  },
  {
    id: 'meeting-summarizer',
    name: '会議要約AI',
    description: '会議録から重要ポイントを抽出',
    difyUrl: 'https://dify-seed.nittel.net/chatbot/H0IuXgBXB5OQxBBa',
    category: 'productivity',
    price: 400,
    currency: 'HKD',
    stripePriceId: 'price_meeting_summarizer_400'
  },
  {
    id: 'sales-proposal',
    name: '営業提案AI',
    description: '顧客情報から最適な提案書を作成',
    difyUrl: 'https://dify-seed.nittel.net/chatbot/H0IuXgBXB5OQxBBa',
    category: 'sales',
    price: 400,
    currency: 'HKD',
    stripePriceId: 'price_sales_proposal_400'
  },
  {
    id: 'hr-screening',
    name: '人事選考AI',
    description: '履歴書の初期スクリーニングを自動化',
    difyUrl: 'https://dify-seed.nittel.net/chatbot/H0IuXgBXB5OQxBBa',
    category: 'hr',
    price: 400,
    currency: 'HKD',
    stripePriceId: 'price_hr_screening_400'
  },
  {
    id: 'inventory-optimizer',
    name: '在庫最適化AI',
    description: '需要予測に基づく在庫管理',
    difyUrl: 'https://dify-seed.nittel.net/chatbot/H0IuXgBXB5OQxBBa',
    category: 'operations',
    price: 400,
    currency: 'HKD',
    stripePriceId: 'price_inventory_optimizer_400'
  },
  {
    id: 'risk-analyzer',
    name: 'リスク分析AI',
    description: '投資や事業リスクの評価分析',
    difyUrl: 'https://dify-seed.nittel.net/chatbot/H0IuXgBXB5OQxBBa',
    category: 'finance',
    price: 400,
    currency: 'HKD',
    stripePriceId: 'price_risk_analyzer_400'
  },
  {
    id: 'content-generator',
    name: 'コンテンツ生成AI',
    description: 'マーケティング用コンテンツの自動作成',
    difyUrl: 'https://dify-seed.nittel.net/chatbot/H0IuXgBXB5OQxBBa',
    category: 'marketing',
    price: 400,
    currency: 'HKD',
    stripePriceId: 'price_content_generator_400'
  },
  {
    id: 'quality-checker',
    name: '品質検査AI',
    description: '製品やサービスの品質チェック',
    difyUrl: 'https://dify-seed.nittel.net/chatbot/H0IuXgBXB5OQxBBa',
    category: 'quality',
    price: 400,
    currency: 'HKD',
    stripePriceId: 'price_quality_checker_400'
  }
];

// プラン設定（基本プラン800ドル + 個別アプリ400ドル追加制）
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
      '👨‍👩‍👧‍👦 利用ユーザー追加：無制限',
      '🗄️ データストレージ：5GB'
    ],
    stripePriceId: 'price_1ReuZ9H4hsO7RxQ6BVGs7Q8W',
  }
];

// OpenAI API代行サービス
export const openaiProxyService = {
  id: 'openai-proxy',
  name: 'API代行『OpenAI』',
  price: 200,
  currency: 'HKD',
  description: 'OpenAI APIをお持ちでない方向けの代行サービス',
  stripePriceId: 'price_1Reua8H4hsO7RxQ6ayFN7Zbo',
};

// 容量プラン設定
export const storagePlans = [
  {
    id: '5gb',
    name: '5GB（基本）',
    storageGB: 5,
    price: 0,
    currency: 'HKD',
    stripePriceId: '', // 基本プランに含まれるため空
    isDefault: true
  },
  {
    id: '50gb',
    name: '50GB',
    storageGB: 50,
    price: 200,
    currency: 'HKD',
    stripePriceId: 'price_storage_50gb_200'
  },
  {
    id: '200gb',
    name: '200GB',
    storageGB: 200,
    price: 500,
    currency: 'HKD',
    stripePriceId: 'price_storage_200gb_500'
  }
]; 