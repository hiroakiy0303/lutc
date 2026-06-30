# お問い合わせフォーム バックエンド（Google Apps Script）

サイトの問い合わせフォーム送信を **Google スプレッドシートに蓄積**し、**自動返信・社内通知**を送り、スプレッドシート上の**カスタムメニューから返信**できるようにする GAS 一式です。

- 管理用スプレッドシート: **LUTCお問合せフォーム**
  `https://docs.google.com/spreadsheets/d/1jQdgbkyB_pOqDN8W1Wt4qG6HZHuI9tP12qh3riYN2KA/edit`
- スクリプト形式: **コンテナバウンド型**（上記スプレッドシートに紐づく）

## ファイル構成

| ファイル | 役割 |
| --- | --- |
| `appsscript.json` | マニフェスト（タイムゾーン・OAuthスコープ・Webアプリ公開設定） |
| `Code.gs` | `doPost`（フォーム受信→行追記）・`doGet`（ヘルスチェック）・設定 `CONFIG`・シート整形 |
| `Notify.gs` | 自動返信メール・社内通知メール・メール送信共通処理 |
| `Reply.gs` | カスタムメニュー・選択行への返信・対応状況スタンプ |
| `ReplyDialog.html` | 返信メールの編集ダイアログ |

## セットアップ手順（コピペ方式）

1. 管理用スプレッドシートを開く → メニュー **拡張機能 → Apps Script**。
2. エディタで以下のファイルを作成し、本フォルダの内容を貼り付ける。
   - `Code.gs`（既定の `コード.gs` を置き換え）
   - 「＋」→ スクリプト：`Notify.gs`、`Reply.gs`
   - 「＋」→ HTML：**`ReplyDialog`**（拡張子なしの名前。中身は `ReplyDialog.html`）
   - マニフェスト：⚙️ プロジェクトの設定 →「`appsscript.json` をエディタで表示」にチェック → `appsscript.json` を本フォルダの内容で置き換え
3. 保存（Ctrl+S）。
4. 一度スプレッドシートを再読み込みすると、メニューに **「お問い合わせ」** が表示される。
   **お問い合わせ → シートを初期化** を実行して、ヘッダーと「対応状況」ドロップダウンを整える（初回のみ／承認ダイアログが出たら許可）。

## Web アプリとして公開（フォームの送信先）

1. Apps Script エディタ右上 **デプロイ → 新しいデプロイ**。
2. 種類（⚙️）で **ウェブアプリ** を選択。
3. 設定：
   - 説明：`LUTC contact form`（任意）
   - 次のユーザーとして実行：**自分**
   - アクセスできるユーザー：**全員** ← ★重要（匿名の訪問者が送信できるようにする）
4. **デプロイ** → 権限の承認（スプレッドシート・メール送信のスコープを許可）。
5. 表示される **ウェブアプリ URL（`https://script.google.com/macros/s/XXXX/exec`）** をコピー。

> ⚠️ アクセスを「全員」にしないと、サイトからの送信が 401/403 になります。
> コードを更新したら **デプロイ → デプロイを管理 → 鉛筆 → バージョン＝新バージョン → デプロイ** で再公開してください（`/exec` URL は変わりません）。

## サイトへ反映

`site/src/index.html` の問い合わせフォームにあるプレースホルダー

```html
<form id="contact-form" data-endpoint="__GAS_ENDPOINT_URL__" ...>
```

の `__GAS_ENDPOINT_URL__` を、上で取得した `/exec` URL に置き換えてコミット → PR をマージ →
`firebase deploy --only hosting --project lutc-com` で本番反映。

## 設定（`Code.gs` の `CONFIG`）

| 項目 | 既定 | 説明 |
| --- | --- | --- |
| `NOTIFY_TO` | `info@lutc.jp` | 新着通知の送信先 |
| `FROM_ADDRESS` | `info@lutc.jp` | 差出人／返信先に使うアドレス |
| `FROM_NAME` | `LUTC Consulting` | 差出人の表示名 |
| `USE_FROM_ALIAS` | `false` | `true` で差出人を `FROM_ADDRESS` にする（下記の前提あり） |
| `SEND_ACK` | `true` | 送信者への自動返信を送るか |
| `SEND_NOTIFY` | `true` | 社内通知を送るか |

### 差出人を `info@lutc.jp` にしたい場合

GAS は既定では**スクリプト所有者（このスプレッドシートの所有者）のアドレス**から送信し、
`Reply-To` に `info@lutc.jp` を設定します。差出人自体を `info@lutc.jp` にするには：

1. 所有者の Gmail → 設定 → **アカウントとインポート → 他のアドレスとして送信** に `info@lutc.jp` を追加し、確認を完了。
2. `CONFIG.USE_FROM_ALIAS` を `true` にして再デプロイ。

（エイリアス未登録のまま `true` にするとメール送信時にエラーになります。）

## 返信の使い方

1. 管理シートで返信したい行（どこかのセル）を選択。
2. メニュー **お問い合わせ → 選択行に返信**。
3. ダイアログで件名・本文を確認／編集し **送信**。
   → 送信者へメールが送られ、`返信日時`・`担当者`・`対応状況=返信済み` が自動記入されます。
- 電話などメール以外で対応した場合は **選択行を対応済みにする** を使用。

## 上級者向け：clasp でバージョン管理

```bash
npm install -g @google/clasp
clasp login
# スプレッドシートのスクリプトIDを使ってクローン（拡張機能→Apps Script→プロジェクトの設定→スクリプトID）
clasp clone <SCRIPT_ID> --rootDir apps-script
# 以後は編集して push
clasp push
```

`.clasp.json` はローカル専用のため `.gitignore` 済みです。
