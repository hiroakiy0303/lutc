# LUTC

LUTC Consultingのブランドデザインシステム、Webサイト仕様コンテキスト、Webサイトソースコードを管理するためのリポジトリです。

## 管理構造

```text
LUTC/
├─ brand/
│  ├─ assets/
│  │  ├─ logos/              # 正式ロゴ・ロゴ派生物
│  │  └─ references/         # 参考ビジュアル、ブランド素材候補
│  └─ design-system/         # Swiss Professional Design System
├─ context/
│  ├─ source-documents/      # 元仕様書、受領資料
│  ├─ briefs/                # 制作・運用に使う要約コンテキスト
│  └─ decisions/             # 重要な設計判断の記録
├─ site/
│  ├─ public/                # 画像・faviconなどの静的アセット
│  ├─ src/                   # Webサイトの公開ソース
│  └─ docs/                  # サイト実装・運用メモ
└─ .github/workflows/        # GitHub Pages公開用ワークフロー
```

## 現在の主要ファイル

- `site/src/index.html`: 現在のLUTC Consulting Webサイト本体
- `brand/design-system/swiss-design-system.json`: ブランドデザインシステム
- `brand/assets/logos/lutc-wordmark-red.svg`: 正式ロゴ表現として採用した赤地LUTCロゴ
- `context/source-documents/LUTC Consulting_Webサイトコンテンツ・ページ設計仕様書.docx`: 元仕様書
- `context/briefs/website-context.md`: Web制作で参照する要約コンテキスト

## 運用方針

1. ブランド表現の変更は `brand/` に先に反映する。
2. 仕様や方針の変更は `context/briefs/` または `context/decisions/` に記録する。
3. 実装変更は `site/src/index.html` に反映する。
4. GitHub Pagesで公開する場合は、Actionsから `site/src` を公開成果物として配信する。

