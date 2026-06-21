# 0001 Repository Structure

Date: 2026-06-20

## Decision

LUTCリポジトリは、ブランド、コンテキスト、サイト実装を分離して管理します。

```text
brand/
context/
site/
```

## Rationale

- ブランド変更とサイト実装変更を分けて追跡できる。
- 仕様書や制作背景を実装ファイルから切り離して保管できる。
- 将来的にNext.js、Webflow、STUDIO、WordPressなどへ移行しても、ブランド・コンテキスト資産を再利用しやすい。
- 初期段階では1枚HTMLを `site/src/index.html` に置き、GitHub Pagesで公開できるようにする。

## Consequences

- Webサイト本体は `site/src/index.html` を正とする。
- 元資料は `context/source-documents/` に保持する。
- 実装者向けの要約は `context/briefs/` に作成する。
- 重要な判断は `context/decisions/` に追記する。

