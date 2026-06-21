# Site

LUTC Consulting Webサイトのソースコードを管理します。

## 現在の構成

- `src/index.html`: 公開対象の静的HTML
- `public/`: 将来的な画像、favicon、OGP画像などの静的アセット
- `docs/`: 実装・公開・運用メモ

## ローカル確認

HTMLは単体で開けます。

```powershell
Start-Process .\site\src\index.html
```

ローカルサーバーで確認する場合:

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory .\site\src
```

その後、ブラウザで `http://127.0.0.1:8765/` を開きます。

## 公開

GitHub Pagesを使う場合は、`.github/workflows/deploy-pages.yml` が `site/src` を公開成果物として配信します。

