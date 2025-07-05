
## フロントエンドデザインガイドライン

### 7.1 デザインシステム統一方針

#### CSSクラスの使用原則
- **インラインスタイル禁止**: 個別のスタイル指定ではなく、`globals.css`で定義された共通クラスを使用する
- **統一感の維持**: 全ページで一貫したデザインパターンを適用する
- **保守性重視**: スタイル変更時は共通CSSを修正することで全体に反映させる

#### ページタイトルの使い分け
- **`.page-title`**: グラデーション効果付きのメインタイトル（ホーム、申込みページ等）
- **`.mypage-title`**: 通常の色指定タイトル（マイページ系）
- **絵文字表示問題**: `.page-title`使用時は絵文字部分に`WebkitTextFillColor: 'initial'`を適用

### 7.2 プランカード統一ルール

#### デザイン原則
- **容量を主役**: 50GB、200GBなどの容量を大きく目立つ表示
- **価格は補足**: 月額料金は小さく控えめに表示
- **選択状態の明確化**: `.plan-card-selected`で視覚的に区別

#### 情報の優先順位
1. **最重要**: 容量（50GB等）
2. **重要**: プラン名
3. **補足**: 月額料金
4. **不要**: 冗長な説明文

#### 禁止事項
- 「現在より○○GB増量」等の冗長な表示
- 「GB利用可能」の重複表示
- 過度に大きなカードサイズ

### 7.3 レイアウト統一ガイドライン

#### コンテナ構造
```tsx
<div className="page-container fade-in">
  <div className="page-header"> // または mypage-header
    <h1 className="page-title"> // または mypage-title
    <p className="page-subtitle"> // または mypage-subtitle
  </div>
  <div className="form-container">
    // コンテンツ
  </div>
</div>
```

#### 余白とスペーシング
- **セクション間**: `margin: '2rem 0'`で適切な間隔を確保
- **カード内パディング**: `padding: '1rem'`でコンパクトに
- **中央寄せ**: 重要な要素は`text-align: center`で配置

### 7.4 データストレージページ修正記録

#### 修正前の問題点
1. インラインスタイルの大量使用による保守性の悪化
2. 絵文字が黒く表示される問題（グラデーションCSSとの競合）
3. 情報の重複表示（容量、価格の冗長な表現）
4. プランカードのデザイン不統一
5. 余白の調整不足

#### 実施した修正
1. **CSS統一化**: インラインスタイル → 共通CSSクラス
2. **絵文字修正**: `WebkitTextFillColor: 'initial'`で色を正常化
3. **情報整理**: 不要な説明文削除、容量を主役に
4. **レイアウト調整**: 適切な余白とコンパクト化
5. **デザイン統一**: `.plan-card`クラスの統一使用

#### 今後の方針
- 新規ページ作成時は必ず共通CSSクラスを使用
- デザイン変更時は`globals.css`を修正して全体に反映
- プランカード表示は本ガイドラインに従う

### 7.5 ボタンレイアウト統一ルール

#### 統一されたボタン配置パターン

**申請ボタン（メインアクション）**:
```tsx
<div className="form-group" style={{ textAlign: 'center' }}>
  <button className="btn btn-primary submit-btn">
    {isSubmitting ? (
      <>
        <span className="loading-spinner" style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }}></span>
        申請中...
      </>
    ) : (
      <>絵文字 申請内容</>
    )}
  </button>
</div>
```

**戻るボタン（サブアクション）**:
```tsx
<div className="actions-container">
  <Link href="/mypage" className="btn btn-secondary">
    ← マイページに戻る
  </Link>
</div>
```

#### 配置原則
1. **申請ボタン**: フォーム内の最下部、中央配置
2. **戻るボタン**: フォーム外の`actions-container`内、下部配置  
3. **分離**: 申請ボタンと戻るボタンは別のコンテナに配置
4. **統一**: 全ての申請系ページで同じパターンを使用

#### 対象ページ
- ✅ データストレージページ (`storage-upgrade/page.tsx`)
- ✅ アプリ追加ページ (`add-app/page.tsx`)
- 今後追加される申請系ページ

#### 修正記録（2024年度）
**問題**: add-appページとstorageページでボタンレイアウトが不統一
- add-app: インラインスタイルで横並び配置
- storage: form-groupとactions-containerで分離配置

**解決**: add-appページをstorageページのパターンに統一
- 申請ボタン: `form-group`内で中央配置に変更
- 戻るボタン: `actions-container`内に移動

### 7.6 タブ機能統一ルール

#### デザイン原則
- **控えめアプローチ**: 金額を大きく表示せず、興味のある人だけがタブでアクセス
- **統一されたタブUI**: 全タブで同じデザインパターンを使用
- **レスポンシブ対応**: モバイルでも使いやすいタブ設計

#### 必須構造
```tsx
<div className="billing-card">
  <h2 className="billing-card-title">💳 決済情報</h2>
  <div className="tab-container">
    <div className="tab-nav">
      <button className={`tab-button ${activeTab === 'overview' ? 'tab-button-active' : ''}`}>
        📊 概要
      </button>
      <button className={`tab-button ${activeTab === 'billing' ? 'tab-button-active' : ''}`}>
        💰 課金予定
      </button>
      <button className={`tab-button ${activeTab === 'history' ? 'tab-button-active' : ''}`}>
        📋 支払履歴
      </button>
      <button className={`tab-button ${activeTab === 'cards' ? 'tab-button-active' : ''}`}>
        💳 カード管理
      </button>
    </div>
    <div className="tab-content">
      {/* タブごとの内容 */}
    </div>
  </div>
</div>
```

#### 情報表示の優先順位
1. **概要タブ**: 最小限の情報、アクセス頻度が高い
2. **課金予定タブ**: Firestoreから取得、控えめに表示
3. **支払履歴タブ**: Stripeから取得、テーブル表示
4. **カード管理タブ**: Stripeポータルへのリンク

#### 禁止事項
- 金額を大きく表示すること
- 不必要に目立つ課金情報の表示
- タブ構造を無視した独自実装

#### 対象ページ
- ✅ マイページ (`mypage/page.tsx`)
- 今後追加される決済関連機能

---