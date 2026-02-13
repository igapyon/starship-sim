# TODO リスト

このドキュメントでは、Starship Sim の今後の拡張予定や改善項目をまとめています。

## 完了したタスク

## 進行中のタスク

### README.mdの更新

[ ] まだまだ古い実装に由来する記述が残っている
[ ] mdと実装上のクラス名が乖離しているところがある。概念に合わせて適宜実装も更新していきたい。
[x] GitHubアイコンの配置（PC/モバイルでUIと重ならない位置に設置）

### レーダーシステムの実装乖離を修正

[x] RadarA/RadarB/RadarC の detectionRange を索敇ロジックに統合する
  - 実装：`getDetectionRange()` を経由して索敵判定・射撃判定・索敵円描画で使用

[x] selectTarget() メソッドを修正して、weapon.detectionRange ではなく radar.detectionRange を使用
  - 実装：`distance < detectionRange`（`getDetectionRange()` の値）に置換済み

[x] 全シーンの detectionRange 後付け設定を改善
  - 実装：`scenes.ts` で `weapon.detectionRange` / `weapon.mass` の直接上書きを撤去
  - 方針：`scenes.ts` で `weapon.mass / detectionRange / maxRange` を直接上書きしない（カタログ/クラス定義側に寄せる）

[x] SHIP_TYPES.md のドキュメントを修正：レーダーコンポーネントが索敇範囲を決定することを明記

### コンポーネント抽象化と命名統一

[x] レーダーの `detectionRange` は索敵ロジックに反映済み。
[x] レーダーは艦種差分の質量（=コスト）に加え、索敵性能差分としても機能する。
[x] 上記を抽象化・一般化し、コンポーネント定義の横並びを揃える。

[x] `Standard Hull (Hull)` を `HullA` に名称変更する。
[x] `Large Hull (LargeHull)` を `HullB` に名称変更する。

[x] `独立砲塔A相当（上書きIndependentTurretA）: 2` を抽象化・一般化し、他コンポーネントと同様に横並びを揃える。

### シーン定義のデータ化

[ ] `src/ts/scenes.ts` の内容の大部分を静的化し、JSONに切り出して管理する。
[ ] `SCENE_DEFS` の純データ化を完了する（`buildMassD1C8Groups()` 依存を解消）
[ ] 位置指定DSLを導入する（`anchor` などで `WORLD_SIZE` 直書きを削減）
[ ] シーン定義のバリデーション層を追加する（未知unit/欠損/負数など）
[ ] `@ts-nocheck` を段階的に撤去し、まず `scenes.ts` の型定義を導入する

### catalog拡張の検討

[ ] `catalog.ts` の値が実装へ期待通り反映されているか、項目ごとの参照先マップを作成する（仕様確認用）

[x] `SIMULATION_SETTINGS`（仮）を追加し、コンポーネント値以外の調整値を集約する
  - 例: `edgeRepulsionMargin`, `edgeRepulsionStrength`, `friction`, `maxSpeed`
  - 例: `edgeTargetCorrectionMargin`, `edgeTargetCorrectionFactor`, `attackWrecksDefault`

[x] `projectiles` 系設定を `catalog.ts` へ寄せるか検討する
  - 結論（現時点）: 優先度低のため対象外。バランス調整の主軸ではないため現状維持
  - 例: `bulletLife`, `bulletSize`, `outOfBoundsPadding`

[x] `effects` 系設定を `catalog.ts` へ寄せるか検討する
  - 結論（現時点）: 優先度低のため対象外。演出定数はバランス設定と分離して扱う
  - 例: 爆発パーティクル数、寿命、色セット

[x] `ui/debug` 系設定の集約可否を検討する
  - 結論（現時点）: 優先度低のため対象外。必要になれば将来 `VISUAL_SETTINGS` などへ分離検討
  - 例: 索敵円の色・太さ、残骸破線スタイル

[X] `COMPONENT_CATALOG` と `SIMULATION_SETTINGS` を分離する設計方針を検討する
  - 目的: `catalog.ts` 肥大化防止、責務の明確化
  - 方針: 「頻繁に調整する値」から段階的に移行（まず `physics` と `ai`）
  - 一旦スコープ外

## 今後の拡張予定

### シミュレーション機能の強化

[ ] **壁際離脱時の射撃停止仕様を検証する**
  - 現状：索敵ロスト時（`detectedTarget=false`）は、壁際からの離脱中でも射撃停止する
  - 観点A（妥当性）：目標を見失ったら撃たない挙動はシミュレーションとして自然
  - 観点B（バランス）：壁際補正と索敵ロストが重なると一方陣営が過度に不利になる可能性
  - 対応案：索敵ロスト直後の短時間射撃継続、または壁際補正中のみ射撃条件を緩和する実験を追加

[ ] **ゲーム開始前の艦隊設定画面**
  - 艦隊構成（艦数、船種）の設定
  - 初期配置位置の指定
  - 作戦パターンの選択（保留）

[ ] **シミュレーション制御パネル**
  - 一時停止/再開機能
  - 速度調整（1倍速、2倍速、4倍速など）
  - スキップ機能（結果を素早く確認）

[ ] **結果分析画面**
  - 戦闘結果のサマリー
  - 撃墜数、ダメージ統計
  - リプレイ機能

### 物理シミュレーションの改善

[ ] 衝突判定の高度化（フレームスキップ対応）
[ ] 推進エンジンの詳細シミュレーション
[ ] 索敇範囲外での艦の挙動改善
