# アーキテクチャ設計方針

## 概要

Starship Sim は、**配布物としては単一 `index.html`** を維持しつつ、  
開発では **分割ソース（HTML/CSS/TypeScript）** を使う構成です。

- 配布: `index.html` をブラウザで開くだけで動作
- 開発: `index-src.html` + `src/css/app.css` + `src/ts/*.ts`
- 生成: `npm run build` で `index.html` を再生成

この方針により、配布の手軽さと開発保守性を両立しています。

---

## 現在の設計原則

1. 配布価値の維持  
最終成果物は単一HTMLを維持する。

2. 開発生産性の確保  
実装は責務ごとに分割し、読みやすさと変更容易性を優先する。

3. 依存の最小化  
ランタイムは外部ライブラリ非依存（Vanilla JS / Canvas API）。

4. 決定論的挙動の維持  
AI・戦闘ロジックは再現しやすい実装を優先する。

---

## 現行ディレクトリ構成

```text
starship-sim/
├── index-src.html            # 開発用テンプレート（手編集対象）
├── index.html                # 配布用生成物（手編集しない）
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
│   └── js/                   # TS変換後の中間生成物
├── scripts/
│   ├── build.mjs
│   └── build-utils.mjs
└── test/
    └── build-utils.test.mjs
```

---

## モジュール責務

### `src/ts/main.ts`

- Canvas初期化
- world/screen 変換
- UI配置（正方形戦場に寄せるレイアウト）
- 入力イベント（マウス/タッチ）
- ZOOMステッパー制御

### `src/ts/components.ts`

- 船体・エンジン・レーダー・武装の定義

### `src/ts/projectiles-effects.ts`

- 弾、パーティクル、ビーコンの定義と更新

### `src/ts/starship.ts`

- 艦船本体の状態管理
- 旋回・推進・索敵・射撃・被弾処理
- 艦船描画

### `src/ts/scenes.ts`

- `initializeGame(config)` によるシーン初期配置
- 初期コスト/艦数のセットアップ

### `src/ts/game-loop.ts`

- フレーム更新（チーム更新、弾衝突、描画）
- 情報パネル更新

---

## 表示・座標アーキテクチャ

### 1. world座標（論理空間）

- `WORLD_SIZE = 720` の正方形
- 物理、AI、当たり判定、索敵は world 基準

### 2. screen座標（表示空間）

- 画面サイズに応じてレターボックス表示
- `renderState` に zoom, offset, dpr を保持
- 入力は `screen -> world` 逆変換で処理

### 3. ZOOM

- 段階値 `ZOOM_STEPS` を採用
- UIは `[-] 100% [+]` ステッパー方式

---

## ビルド方式

`npm run build`（`scripts/build.mjs`）で以下を実行:

1. `index-src.html` 読み込み
2. `src/ts/*.ts` を `src/js/*.js` に変換
3. CSS/JSを連結
4. `index-src.html` の `link/script` をインライン化
5. `index.html` を出力

補助:
- スクリプト順序を検証して依存崩れを検知
- 順序検証ロジックはテストで担保（Vitest）

---

## 品質ゲート

- `npm run typecheck`
- `npm test`
- `npm run build`

最低でも、変更時は `build` を実行して生成物を更新する。

---

## 運用ルール

1. 手編集対象は `index-src.html` と `src/`（およびドキュメント）。
2. `index.html` は生成物として扱い、直接修正しない。
3. UI仕様変更時は `SCREEN.md`、シーン変更時は `SCENES.md` を更新する。
4. タイトルは `starship-sim : Starship Simulation` を固定値として扱う。

---

## 今後の方針

- 単一HTML配布は維持
- 開発ソース分割は維持
- 画面・入力・シーン周辺はモバイル実機での確認を重視
- 設計変更時は、実装とドキュメントの同期を優先する

---

**最終更新**: 2026-02-11
