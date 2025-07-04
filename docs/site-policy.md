## Firestoreアクセスに関する認証・認可ポリシー

当サイトにおけるFirestoreデータベースの読み書きは、以下のポリシーに基づき運用されます。

---

### 対象構成

このルールは、以下の技術スタックを前提とした設計ポリシーです。

- フロントエンド：Next.js（App Router構成）
- APIバックエンド：Next.js API Routes（`/app/api/`以下）
- 認証基盤：Firebase Authentication（Google Auth想定）
- データベース：Cloud Firestore（NoSQL）

---

### 基本方針

- Firestoreへのすべてのアクセスは、**クライアントから直接ではなく、Next.jsのAPI経由で行う**。
- **認証・認可の責任はAPI内部で担保**し、Firestoreセキュリティルールには依存しない。
- Firestoreのセキュリティルールは**全拒否（deny all）設定とし、外部からの直接アクセスを遮断**する。
- API内部で**認証トークンを検証し、UIDをもとにアクセス権を明示的に確認**する。

---

### 実装ルール

- クライアントはFirebase Authenticationによりログイン後、`getIdToken()` を用いてIDトークンを取得する。
- クライアントはIDトークンを `Authorization: Bearer <token>` ヘッダーとしてAPIに送信する。
- APIでは `firebase-admin` SDK を用いてトークンを `verifyIdToken()` で検証し、**信頼できるUID**を取得する。
- Firestoreを更新・書き込みする際は、該当ドキュメントの `userId` フィールドなどとUIDを突き合わせ、**認可判定をAPI内で行う**。
- 認証・認可が通った場合のみ、Firestoreへの書き込み・更新を許可する。

---

### Firestoreルール設定

以下のように、すべての読み書きを拒否するセキュリティルールを適用する。

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}


### 実装上の注意点（禁止事項）
クライアントから uid などのユーザー識別情報を送信し、それを認可に使う設計は禁止。
Firestoreのセキュリティルールにロジックを記述して認可を担わせることは禁止。
FirestoreへクライアントSDK（ブラウザ）から直接アクセスする設計は採用しない。

### 本ルールの適用範囲
このルールは、当サイトで提供されるすべてのFirestore関連機能・APIに適用されます。
今後の新規開発・仕様変更においても、本方針を前提とした実装を行うものとします。