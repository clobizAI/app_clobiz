# CloBiz AI サービス申込サイト

Next.js + Firebase + Stripe（テストAPI）を使用したAIサービスの申込〜契約状況確認機能

## 🚀 概要

このプロジェクトは、AIサービスの申し込みから契約状況確認までの一連の機能を提供するWebアプリケーションです。

### 主な機能

- **申込フォーム**：ユーザー情報入力とプラン選択
- **決済処理**：Stripe Checkoutによる安全な決済
- **契約管理**：Firestoreでの契約情報保存
- **マイページ**：契約状況確認と契約書ダウンロード
- **Webhook処理**：Stripeイベントの自動処理

## 🛠 技術スタック

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payment**: Stripe (テストAPI)
- **Deployment**: Vercel対応

## 📁 プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── checkout/      # Stripe Checkout
│   │   └── webhook/       # Stripe Webhook
│   ├── mypage/           # 契約状況確認ページ
│   ├── success/          # 決済完了ページ
│   ├── globals.css       # グローバルスタイル
│   ├── layout.tsx        # ルートレイアウト
│   └── page.tsx          # ホームページ（申込フォーム）
├── components/           # Reactコンポーネント
│   └── AuthProvider.tsx  # Firebase認証プロバイダー
├── lib/                  # ユーティリティ
│   ├── firebase.ts       # Firebase設定
│   ├── firestore.ts      # Firestore操作
│   └── stripe.ts         # Stripe設定
└── types/               # TypeScript型定義
    └── index.ts
```

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の変数を設定してください：

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe Configuration (Test Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 3. Firebase プロジェクトの設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Authentication を有効化（メール認証）
3. Firestore Database を作成
4. 設定値を`.env.local`に反映

### 4. Stripe アカウントの設定

1. [Stripe Dashboard](https://dashboard.stripe.com/)でテストAPIキーを取得
2. Webhookエンドポイントを設定：`https://your-domain.com/api/webhook`
3. イベント：`checkout.session.completed`、`customer.subscription.updated`、`customer.subscription.deleted`

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

## 📄 Firestoreスキーマ

### users コレクション

```typescript
{
  uid: string;           // ユーザーID
  email: string;         // メールアドレス
  name: string;          // 氏名
  createdAt: string;     // 作成日時
}
```

### contracts コレクション

```typescript
{
  id: string;                    // 契約ID
  userId: string;                // ユーザーID
  planId: string;                // プランID
  planName: string;              // プラン名
  status: 'active' | 'inactive' | 'pending' | 'cancelled';
  startDate: string;             // 開始日
  endDate?: string;              // 終了日
  stripeCustomerId?: string;     // Stripe顧客ID
  stripeSubscriptionId?: string; // StripeサブスクリプションID
  contractPdfUrl?: string;       // 契約書PDF URL
  createdAt: string;             // 作成日時
  updatedAt: string;             // 更新日時
}
```

## 🔧 Stripe Webhook検証方法

### ローカル開発

1. Stripe CLIをインストール
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

2. 表示されたWebhookシークレットを`.env.local`に設定

### 本番環境

1. Stripe DashboardでWebhookエンドポイントを設定
2. エンドポイント：`https://your-domain.com/api/webhook`
3. イベント選択：
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## 🚀 デプロイ

### Vercel デプロイ

```bash
npm run build
```

Vercelに接続して自動デプロイを設定してください。

### 環境変数の設定

Vercelのダッシュボードで本番用の環境変数を設定してください。

## 📝 開発メモ

- Stripeのテストカード番号：`4242 4242 4242 4242`
- Firebase Authは現在ダミー実装（実際の認証機能は要実装）
- 契約書PDFは仮のURLを使用（実際のPDF生成機能は要実装）
- マイページの認証チェックは要実装

## 🔒 セキュリティ

- Stripe Webhookの署名検証実装済み
- Firebase セキュリティルールの設定推奨
- 環境変数による機密情報の管理

## 📞 サポート

質問や問題がある場合は、プロジェクト管理者にお問い合わせください。 