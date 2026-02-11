# Ship Types / シップタイプ

このドキュメントは、現行実装における艦種仕様をまとめたものです。

実装参照:
- `src/ts/catalog.ts`
- `src/ts/components.ts`
- `src/ts/starship.ts`
- `src/ts/scenes.ts`

## モジュラー構成

各艦は次のコンポーネントで構成されます。

1. 船体（Hull）
2. 推進エンジン（Thruster Engine）
3. 射撃ユニット（Turret）
4. レーダー（Radar）

基本ルール:
- 各コンポーネントは `mass` を持つ
- 加速度 = 総推進力 ÷ 総質量
- 旋回速度 = （エンジン旋回力合計）÷ 総質量
- 初期化時および損傷時に `engines.length <= weapons.length` を維持
- コスト = 総質量（`Starship#getCost()`）

## コンポーネント定義（実装値）

### 船体
- HullA (`HullA`)
  - mass: 1
  - hp/maxHp: 100/100
  - size: 12
- HullB (`HullB`)
  - mass: 3
  - hp/maxHp: 300/300
  - size: 28
- HullC (`HullC`)
  - mass: 5
  - hp/maxHp: 500/500
  - size: 47

### 推進エンジン
- ThrusterA (`ThrusterEngine`)
  - mass: 1
  - thrust: 0.15
  - rotationSpeed: 0.1

### レーダー
- RadarA
  - mass: 0
  - detectionRange: 120
- RadarB
  - mass: 1
  - detectionRange: 160
- RadarC
  - mass: 2
  - detectionRange: 200

注記:
- レーダーの `detectionRange` は索敵ロジックに反映済み（`Starship#getDetectionRange()` 経由）

### 砲塔
- TurretA (`IndependentTurretA`)
  - mass: 1
  - hp/maxHp: 100/100
  - fireInterval: 60
  - bulletDamage: 10
  - bulletSpeed: 5
  - maxRange: 160
  - rotationSpeed: 0
- TurretB (`IndependentTurretB`)
  - mass: 2
  - hp/maxHp: 150/150
  - fireInterval: 60
  - bulletDamage: 10
  - bulletSpeed: 5
  - maxRange: 200
  - rotationSpeed: 0.1
- TurretC (`IndependentTurretC`)
  - mass: 4
  - hp/maxHp: 200/200
  - fireInterval: 90
  - bulletDamage: 20
  - bulletSpeed: 5
  - maxRange: 260
  - rotationSpeed: 0.1

## 艦種仕様（現行実装）

`src/ts/starship.ts` の `SHIP_PRESETS` と `src/ts/scenes.ts` の配置定義に基づく。

### 船種C（Corvette）

構成:
- HullA x1
- ThrusterA x1
- TurretB x1
- RadarA x1

注記:
- `SHIP_PRESETS.corvette` に `weaponClass` 指定がないため、`Starship` デフォルトの `IndependentTurretB` を使用

統合値:
- 総質量: `1 + 1 + 2 + 0 = 4`
- 総推進力: `0.15`
- 加速度: `0.15 / 4 = 0.0375`
- 旋回速度: `0.1 / 4 = 0.025`
- 索敵範囲: 120
- コスト: 4

### 船種D（Destroyer）

構成:
- HullB x1
- ThrusterA x2
- TurretB x2
- RadarB x1

注記:
- `SHIP_PRESETS.destroyer` で `weaponMaxRange: 270` を上書き

統合値:
- 総質量: `3 + 2 + 4 + 1 = 10`
- 総推進力: `0.15 x 2 = 0.3`
- 加速度: `0.3 / 10 = 0.03`
- 旋回速度: `(0.1 x 2) / 10 = 0.02`
- 索敵範囲: 160
- コスト: 10

### 船種L（Light Cruiser）

構成:
- HullC x1
- ThrusterA x3
- TurretC x3
- RadarC x1

統合値:
- 総質量: `5 + 3 + 12 + 2 = 22`
- 総推進力: `0.15 x 3 = 0.45`
- 加速度: `0.45 / 22 = 0.02045...`
- 旋回速度: `(0.1 x 3) / 22 = 0.01363...`
- 索敵範囲: 200
- コスト: 22

## HP・損傷・残骸

### HP表示ロジック
- `hasBeenDamaged === true` のときだけHPバーを描画
- 武装が残っている間は武装ごとのHPバーを表示
- 武装が0になった後は船体HPバーを表示

### 段階的破壊
- ダメージはまず `weapons[0]` に入る
- 武装破壊時:
  - 破壊武装を `shift()` で除去
  - `engines.length > weapons.length` の間、エンジンを `pop()` して除去
- 武装0で残骸状態に遷移

### 残骸判定
- 残骸判定: `ship.weapons.length === 0`
- 残骸への攻撃は `attackWrecks` で切替

## コスト一覧（実装値）

- HullA: 1
- HullB: 3
- HullC: 5
- ThrusterA: 1
- TurretA: 1
- TurretB: 2
- TurretC: 4
- RadarA: 0
- RadarB: 1
- RadarC: 2
