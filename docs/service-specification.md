# DIFYベースAIアプリケーションサービス仕様書

## 第1章：基本プランについて

当サービスの基本プランは、AIアプリケーションを実行するための専用サーバーと初期構成環境を提供します。

サーバーには、オープンソースのAIアプリフレームワーク「DIFY」がインストール済みで、ユーザーはその上で各種AIアプリケーションを運用できます。

ユーザーごとに個別のサーバーを設置し、DIFYを構築・初期設定した状態でお渡しします。この**DIFY搭載サーバー環境が「基本プラン」**です。

### 提供内容：
- DIFYの初期セットアップ
- 動作環境の維持
- 最低限の保守管理

サーバーは初期状態で5GBのストレージ容量を持ち、50GBや200GBなどへの容量アップも可能です（詳細は第3章）。

なお、DIFY内部で動く個別アプリケーションは基本プランに含まれず、必要に応じて追加するオプション扱いとなります。

## 第2章：オプション（DIFY内アプリケーション）について

基本プラン上のDIFYに対して、当社開発のAIアプリケーション（記録支援、要約、分析など）をオプションとして追加提供しています。

各アプリケーションは当社があらかじめ用意した構成単位で提供されており、ユーザーは必要なものを選んで申請すれば追加利用を開始できます。

**オプションは基本プランと同時に初回申込時から選択可能です。**

### オプション申請時の課金：
- **初回申込時**: 基本プランと同時にオプションを申し込んだ場合、基本プラン料金とオプション料金の合計で翌月分が即時課金されます。
- **後日追加時**: 申請時に翌月分の利用料が即時課金されます。

いずれの場合も、サービス提供は当社の設置作業完了次第すぐに開始されるため、ユーザーは申請月のうちから利用開始できます。

### 料金請求：
オプション料金は基本プランと同様、毎月1日に翌月分として一括前払いで請求されます。

### 追加・停止：
オプションの追加・停止を希望する場合は、前月末までに申請すれば翌月以降の請求に反映されます。

なお、オプションについては途中解約、日割り精算、返金には一切対応しておりません。

## 第3章：サーバー容量の変更について

AIサーバーにはストレージ容量の上限が設定されています。

### 初期容量：
1契約あたり5GB

### 容量アップ：
利用状況に応じて50GB、200GBなどの上位容量への変更を申請できます。

### 変更のタイミング：
容量変更の申請はいつでも可能ですが、変更反映は申請月の翌月1日からとなります。

### 初回変更時の特例：
本サービスは毎月1日に翌月分の利用料を前払いで課金するため、申請月の翌月分料金はすでに確定済みです。そのため、容量変更が反映された月については追加料金の差額の請求は行わず、当社が差額を負担します。

**例：** 6月1日に7月分の料金（5GBプラン）が課金済みの状態で、6月20日に200GBへの変更を申請した場合：
- 7月1日に8月利用料金決済＆200GB提供開始
- 7月1日から200GB利用可能だが6月1日利用料金の変更はしない。
- 200GBの課金は8月分から開始。じゃあ7月分利用料金はだれが払うの？クラビズです。

### ダウングレードについて：
ストレージ容量の減量は一切受け付けておりません。理由は、ユーザーの保持データ量が容量制限を下回る保証が取れないことと、運用管理上の整合性を保つためです。

## 第4章：課金とサービス提供のタイミング

### 課金方式：
毎月1日に翌月分の料金を前払いで課金します。

**例：** 6月1日には7月分の利用料（基本プラン・オプション・容量変更）が決済されます。

### 初回申込時：
基本プラン（およびオプションを同時申込した場合はその分も含めて）の翌月分料金がその場で即時決済されます。

### サービス開始：
サーバーおよび追加オプションは、当社の設置作業完了次第、即時利用開始できます。

### 月途中の申込・変更：
課金は翌月分としてすでに処理済みのため、当月分の利用について追加請求や日割り計算は行いません。

## 第5章：解約について

### 解約申請：
前月の月末までにご申請ください。

### 解約処理：
申請後、翌月1日以降の定期課金は停止され、当該月の月末をもってサービス提供は終了します。申請月の翌月末までサービスは継続し、それ以降は自動的に停止されます。

**具体例：** 6月中に解約申請をした場合：
- 6月1日に課金済みの7月分サービスは提供される
- 7月31日で終了

### 返金について：
日割り精算や返金は行っておりませんので、あらかじめご了承ください。

## 第6章：支払い失敗時の対応

### 猶予期間：
毎月1日の定期課金（翌月分の前払い）が失敗した場合でも、ただちにサービスは停止されません。最大7日間の猶予期間を設けて、自動的に再決済を試みます。

### 契約解除：
猶予期間内に決済が完了しなかった場合、8日目からすべてのサービスを停止し、同時に契約解除とみなします。

### データ削除：
この時点で、AIサーバー環境・DIFY構成・保存データを含むすべての情報は削除され、復旧は一切できません。

---


## 重要ポイントまとめ

### サービス構造
- **基本プラン**: DIFY搭載サーバー環境（5GB初期容量）
- **オプション**: DIFY上のAIアプリケーション（別課金、初回から同時申込可能）

### 課金体系
- **前払い制**: 毎月1日に翌月分課金
- **初回申込時**: 基本プラン+オプション（選択時）の翌月分を即時課金
- **即時サービス開始**: 課金後、設置完了次第利用可能
- **返金なし**: 日割り精算、途中解約返金は一切なし

### 運用ルール
- **申請タイミング**: 変更・解約は前月末まで
- **支払い猶予**: 失敗時7日間、8日目で契約解除・データ完全削除
- **容量変更**: 変更初月時のみ課金済みのため差額を会社負担、翌月から新容量料金に変更。ダウングレード不可 