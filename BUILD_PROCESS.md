# ビルド方式設計（Single-File配布を維持）

## 目的

このプロジェクトは最終成果物として **単一の `index.html`** を維持する。  
ただし開発効率のため、作業中は HTML / CSS / JS を分割管理し、ビルド時に 1 ファイルへ統合する。

- 配布・実行: `index.html` をブラウザで開くだけ
- 開発・保守: `index-src.html` + `src/css/*.css` + `src/js/*.js`

---

## 方針

1. ソース編集対象は `index-src.html` と `src/` 配下に限定する
2. `index.html` は生成物として扱う（手編集しない）
3. `index-src.html` は開発時にそのまま実行可能とする（外部 `link/script` を参照）
4. Node.js スクリプトで外部参照をインライン化し、`index.html` を生成する

---

## 想定ディレクトリ構成

```text
starship-sim/
├── index-src.html          # 開発用テンプレート
├── index.html              # 生成物（配布物）
├── src/
│   ├── css/
│   │   ├── base.css
│   │   ├── layout.css
│   │   └── components.css
│   └── js/
│       ├── constants.js
│       ├── entities.js
│       ├── systems.js
│       ├── scenes.js
│       └── main.js
└── scripts/
    └── build.mjs           # ビルドスクリプト
```

※ 実際の分割粒度は、初回は最小限（例: `app.js` 1ファイル）から始めてもよい。

---

## `index-src.html` のテンプレート仕様（開発実行可能）

`index-src.html` は、開発時にブラウザで直接開いて動作確認できるように、  
外部CSS/JSを通常のタグで参照する。

```html
<head>
  <link rel="stylesheet" href="src/css/app.css">
</head>
<body>
  <canvas id="canvas"></canvas>
  <script src="src/js/app.js"></script>
</body>
```

ビルド時に以下へ置換する（`index.html` 生成時）。

- `<link rel="stylesheet" href="src/css/app.css">` → `<style> ...連結済みCSS... </style>`
- `<script src="src/js/app.js"></script>` → `<script> ...連結済みJS... </script>`

---

## ビルド処理仕様（`scripts/build.mjs`）

`build.mjs` は次を実行する。

1. `index-src.html` を読み込む
2. `src/css/*.css` を順序どおり連結
3. `src/js/*.js` を順序どおり連結
4. `index-src.html` 内の開発用 `link/script` タグをインライン化して置換
5. `index.html` として出力

補助仕様:

- ファイル順序は配列で固定管理（`fs.readdir` の結果順に依存しない）
- 出力先 `index.html` は毎回上書き
- 最低限のヘッダコメントを生成物へ付与（生成日時など）

---

## npm scripts（導入時）

`package.json` を追加して、最低限以下を定義する。

```json
{
  "scripts": {
    "build": "node scripts/build.mjs"
  }
}
```

必要に応じて:

- `build:watch`（監視ビルド）
- `check:generated`（ソースから再生成して差分ゼロ確認）

---

## 運用ルール

1. 通常編集は `index-src.html` と `src/` のみ
2. 開発中の動作確認は `index-src.html` で行える
3. 変更後は必ず `npm run build` を実行
4. PR には `index.html`（生成物）も含める
5. `index.html` への直接修正は原則禁止

---

## 段階的移行案

### Phase 1（最小導入）

- `index.html` を `index-src.html` にコピー
- CSS を `src/css/app.css`、JS を `src/js/app.js` へ抽出
- `build.mjs` を実装して `index.html` を再生成

### Phase 2（分割整理）

- JSを責務ごとに分割（entities/systems/scenes/main）
- CSSを用途ごとに分割（base/layout/components）

### Phase 3（運用強化）

- CIで `npm run build` 実行＋差分チェック
- 「生成物が最新であること」を自動検証

---

## 受け入れ条件

- `index.html` 単体をブラウザで開いて現状どおり動作する
- 生成前後で主要シーン（L1D2C8, C8vsD2, L1vsD2）が同等挙動
- 手動編集対象と生成物の責務分離が守られている
