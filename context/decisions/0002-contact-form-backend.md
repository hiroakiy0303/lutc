# 0002 Contact Form Backend

Date: 2026-06-22

## Decision

問い合わせフォームの送信先を、`mailto:` から **Google Apps Script（GAS）の Web アプリ**へ置き換えます。
送信内容は **Google スプレッドシート「LUTC お問い合わせ管理」**に蓄積し、対応状況をシート上で管理、
**GAS のカスタムメニューから返信メール**を送れるようにします。

```text
[サイトの問い合わせフォーム]
   └─ fetch POST (application/x-www-form-urlencoded)
[GAS Web アプリ /exec]  ← スプレッドシートにバインドしたコンテナバウンド型スクリプト
   ├─ 行を追記（受付日時・受付ID・全項目・対応状況=未対応 …）
   ├─ 送信者へ自動返信メール
   └─ info@lutc.jp へ社内通知メール
[管理スプレッドシート]
   └─ メニュー「お問い合わせ ▸ 選択行に返信」→ 返信＋状況スタンプ
```

GAS のソースは `apps-script/` でバージョン管理します（`Code.gs` / `Notify.gs` / `Reply.gs` /
`ReplyDialog.html` / `appsscript.json`）。デプロイ手順は `apps-script/README.md`。

## Rationale

- 要望は「スプレッドシートで一元管理し、GAS で返信」。Firebase Functions 等を増やさず、
  スプレッドシート＋GAS だけで完結でき、運用・引き継ぎが容易。
- サイトは静的（ビルド無し）のため、フォームは `fetch` で外部エンドポイントへ送るだけで済む。
- `application/x-www-form-urlencoded` で送ることで CORS プリフライトを回避し、GAS Web アプリでも
  応答 JSON を読める。失敗時は `mailto:` 文言にフォールバック。
- スパムは隠しフィールド（ハニーポット）＋必須項目検証で一次対策。reCAPTCHA は将来候補。

## Consequences

- `site/src/index.html` のフォームは `id="contact-form"` と `data-endpoint`（公開後に `/exec` URL へ置換）を持つ。
- GAS Web アプリは「アクセス: 全員（匿名）」「実行: 自分」で公開する必要がある。
- 差出人を `info@lutc.jp` にする場合は所有 Gmail に送信エイリアスを登録し、`CONFIG.USE_FROM_ALIAS=true`。
- スプレッドシートのスキーマ（列順）は `apps-script/Code.gs` の `HEADERS` を正とする。
- 本番反映は従来どおり `firebase deploy --only hosting --project lutc-com`（自動デプロイ無し）。
