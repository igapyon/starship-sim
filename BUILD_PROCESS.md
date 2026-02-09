# ビルド方式設計（Single-File配布を維持）

## 目的

このプロジェクトは最終成果物として **単一の `index.html`** を維持する。  
ただし開発効率のため、作業中は HTML / CSS / JS を分割管理し、ビルド時に 1 ファイルへ統合する。

- 配布・実行: `index.html` をブラウザで開くだけ
- 開発・保守: `index-src.html` + `src/css/*.css` + `src/ts/*.ts`

---

## 方針

1. ソース編集対象は `index-src.html` と `src/` 配下に限定する
2. `index.html` は生成物として扱う（手編集しない）
3. `index-src.html` は開発時にそのまま実行可能とする（外部 `link/script` を参照）
4. Node.js スクリプトで TypeScript を JavaScript に変換し、外部参照をインライン化して `index.html` を生成する

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
│   ├── ts/
│       ├── main.ts
│       ├── components.ts
│       ├── projectiles-effects.ts
│       ├── starship.ts
│       ├── scenes.ts
│       └── game-loop.ts
│   └── js/
│       └── ... (ビルド生成・開発実行用)
└── scripts/
    └── build.mjs           # ビルドスクリプト
```

※ 分割粒度は変更可能だが、依存順を壊さないことを優先する。

---

## `index-src.html` のテンプレート仕様（開発実行可能）

`index-src.html` は、開発時にブラウザで直接開いて動作確認できるように、  
外部CSSと生成済みJSを通常のタグで参照する。

```html
<head>
  <link rel="stylesheet" href="src/css/app.css">
</head>
<body>
  <canvas id="canvas"></canvas>
  <script src="src/js/main.js"></script>
  <script src="src/js/components.js"></script>
  <script src="src/js/projectiles-effects.js"></script>
  <script src="src/js/starship.js"></script>
  <script src="src/js/scenes.js"></script>
  <script src="src/js/game-loop.js"></script>
</body>
```

ビルド時に以下へ置換する（`index.html` 生成時）。

- `<link rel="stylesheet" href="src/css/app.css">` → `<style> ...連結済みCSS... </style>`
- 上記6つの `<script src=...>` 群 → `<script> ...連結済みJS... </script>`

---

## ビルド処理仕様（`scripts/build.mjs`）

`build.mjs` は次を実行する。

1. `index-src.html` を読み込む
2. `src/ts/*.ts` を順序どおり JavaScript に変換し `src/js/*.js` を生成
3. `src/css/*.css` と `src/js/*.js` を順序どおり連結
4. `index-src.html` 内の開発用 `link/script` タグをインライン化して置換
5. `index.html` として出力

補助仕様:

- ファイル順序は配列で固定管理（`fs.readdir` の結果順に依存しない）
- `index-src.html` の `<script src="src/js/...">` 並び順を自動検証し、依存順が崩れていたらビルド失敗
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

### Phase 1（導入済み）

- `index-src.html` を開発実行可能な構成で運用
- CSS を `src/css/app.css` に分離
- TypeScript ソースを責務ごとに6ファイルへ分離
- `build.mjs` で `index.html` を再生成

### Phase 2（運用強化）

- CIで `npm run build` 実行＋差分チェック
- 「生成物が最新であること」を自動検証

---

## 受け入れ条件

- `index.html` 単体をブラウザで開いて現状どおり動作する
- 生成前後で主要シーン（L1D2C8, C8vsD2, L1vsD2）が同等挙動
- 手動編集対象と生成物の責務分離が守られている
