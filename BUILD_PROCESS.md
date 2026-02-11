# ビルド方式（現行実装）

## 目的

このプロジェクトは、**配布物として単一の `index.html`** を維持します。  
一方、開発では保守性のために HTML/CSS/TypeScript を分割管理します。

- 配布・実行: `index.html` をブラウザで開くだけ
- 開発・保守: `index-src.html` + `src/css/app.css` + `src/ts/*.ts`

---

## 現行構成

```text
starship-sim/
├── index-src.html              # 開発用テンプレート（手編集対象）
├── index.html                  # 配布用生成物（手編集しない）
├── src/
│   ├── css/
│   │   └── app.css
│   ├── ts/
│   │   ├── main.ts
│   │   ├── components.ts
│   │   ├── projectiles-effects.ts
│   │   ├── starship.ts
│   │   ├── scenes.ts
│   │   └── game-loop.ts
│   └── js/                     # TS変換後の中間生成物
├── scripts/
│   ├── build.mjs
│   └── build-utils.mjs
└── test/
    └── build-utils.test.mjs
```

---

## `index-src.html` の役割

`index-src.html` は開発時テンプレートです。  
外部CSS/JSを参照し、開発中にそのままブラウザ確認できます。

- CSS参照:
  - `<link rel="stylesheet" href="src/css/app.css">`
- JS参照（順序固定）:
  - `src/js/main.js`
  - `src/js/components.js`
  - `src/js/projectiles-effects.js`
  - `src/js/starship.js`
  - `src/js/scenes.js`
  - `src/js/game-loop.js`

---

## ビルド処理（`scripts/build.mjs`）

`npm run build` で以下を実行します。

1. `index-src.html` を読み込む
2. `src/ts/*.ts` を `src/js/*.js` へ変換
3. CSSとJSを順序どおり連結
4. `index-src.html` の `link/script` タグをインライン化
5. `index.html` を出力

補助仕様:

- JS読み込み順は `expectedJsOrder` で固定
- `index-src.html` の `<script src="...">` 順序を検証
- 順序不一致やタグ不足はビルド失敗
- 出力 `index.html` は毎回上書き

---

## npm scripts（現行）

```json
{
  "scripts": {
    "build": "node scripts/build.mjs",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

---

## 運用ルール

1. 通常編集は `index-src.html` と `src/` を対象にする
2. `index.html` は生成物として扱い、直接編集しない
3. 変更後は `npm run build` を実行して生成物を更新する
4. PRには `index.html`（生成物）を含める
5. 必要に応じて `npm run typecheck` / `npm test` で検証する

---

## 確認手順（推奨）

```bash
npm run typecheck
npm test
npm run build
```

---

## 受け入れ条件

- `index.html` 単体でブラウザ動作する
- `index-src.html` の構成と `build.mjs` の期待順序が一致している
- 手編集対象（`index-src.html` と `src/`）と生成物（`index.html`）の責務分離が守られている
