# Ship Types / シップタイプ

このドキュメントは、現行実装における艦種仕様をまとめたものです。

実装参照:
- `src/ts/components.ts`
- `src/ts/starship.ts`
- `src/ts/scenes.ts`

## モジュラー構成

各艦は次のコンポーネントで構成されます。

1. 船体（Hull）
2. 推進エンジン（Thruster Engine）
3. 射撃ユニット（Weapon Unit）
4. レーダー（Radar: 艦種により搭載）

基本ルール:
- 各コンポーネントは `mass` を持つ
- 加速度 = 総推進力 ÷ 総質量
- 旋回速度 = （エンジン旋回力合計）÷ 総質量
- 初期化時および損傷時に `engines.length <= weapons.length` を維持
- コスト = 総質量（`Starship#getCost()`）

## コンポーネント定義（実装値）

### 船体
- Standard Hull (`Hull`)
  - mass: 1
  - hp/maxHp: 100/100
  - size: 12
- Large Hull (`LargeHull`)
  - mass: 3
  - hp/maxHp: 300/300
  - size: 28
- Hull5 (`Hull5`)
  - mass: 5
  - hp/maxHp: 500/500
  - size: 47

### 推進エンジン
- Standard Thruster (`ThrusterEngine`)
  - mass: 1
  - thrust: 0.15
  - rotationSpeed: 0.1

### レーダー
- RadarA
  - mass: 1
  - detectionBonus: 30
- RadarB
  - mass: 2
  - detectionBonus: 45

注記:
- 現行実装では、レーダーの `detectionBonus` は索敵ロジックに未反映です。
- レーダーは主に艦種差分の質量（=コスト）として効いています。

### 射撃ユニット
- Standard Weapon (`WeaponUnit`)
  - mass: 1
  - hp/maxHp: 150/150
  - fireInterval: 60
  - detectionRange: 150
  - bulletDamage: 10
  - bulletSpeed: 5
  - maxRange: 225
- Independent Turret B (`IndependentTurretB`)
  - mass: 4
  - hp/maxHp: 200/200
  - fireInterval: 90
  - detectionRange: 225
  - bulletDamage: 20
  - bulletSpeed: 5
  - maxRange: 338

## 艦種仕様（現行実装）

### 船種C（Corvette）

構成:
- Standard Hull x1
- Standard Thruster x1
- Standard Weapon x1
- Radarなし

統合値:
- 総質量: `1 + 1 + 1 = 3`
- 総推進力: `0.15`
- 加速度: `0.15 / 3 = 0.05`
- 旋回速度: `0.1 / 3 = 0.0333...`
- 最高速度: 2
- 表示HP:
  - 武装あり: 150
  - 武装全損後（残骸）: 船体100
- 索敵範囲: 150
- コスト: 3

### 船種D（Destroyer）

構成:
- Large Hull x1
- Standard Thruster x2
- 独立砲塔A相当 x2（`WeaponUnit`をシーン初期化時に上書き）
- RadarA x1

独立砲塔A相当の実体:
- ベース: `WeaponUnit`
- 上書き: `mass = 2`, `detectionRange = 180`, `maxRange = 270`
- それ以外（hp=150, fireInterval=60, bulletDamage=10 など）は標準準拠

統合値:
- 総質量: `3 + 2 + 2 + 2 + 1 = 10`
- 総推進力: `0.15 x 2 = 0.3`
- 加速度: `0.3 / 10 = 0.03`
- 旋回速度: `(0.1 x 2) / 10 = 0.02`
- 最高速度: 2
- 表示HP:
  - 武装2基: 300
  - 武装1基: 150
  - 武装全損後（残骸）: 船体300
- 索敵範囲: 180
- コスト: 10

### 船種L（Light Cruiser）

構成:
- Hull5 x1
- Standard Thruster x3
- Independent Turret B x3
- RadarB x1

統合値:
- 総質量: `5 + 3 + 12 + 2 = 22`
- 総推進力: `0.15 x 3 = 0.45`
- 加速度: `0.45 / 22 = 0.02045...`
- 旋回速度: `(0.1 x 3) / 22 = 0.01363...`
- 最高速度: 2
- 表示HP:
  - 武装3基: 600
  - 武装2基: 400
  - 武装1基: 200
  - 武装全損後（残骸）: 船体500
- 索敵範囲: 225
- コスト: 22

## HP・損傷・残骸

### HP表示ロジック

- `hasBeenDamaged === true` のときだけHPバーを描画
- 武装が残っている間は、武装ごとのHPバーを表示
- 武装が0になった後は、船体HPバー（グレー）を表示

### 段階的破壊

- ダメージはまず `weapons[0]` に入る
- 武装破壊時:
  - 破壊武装を `shift()` で除去
  - `engines.length > weapons.length` の間、エンジンを `pop()` して除去
- 武装0で残骸状態になる
  - 推進不能（慣性ドリフトのみ）
  - 射撃不可
  - 船体HPが有効になる

### 残骸判定

- 残骸判定は `ship.weapons.length === 0`
- 残骸への攻撃は `attackWrecks` で切替
- 残骸の破線円は生存中に表示（`engines.length === 0 && ship.isAlive()`）

## コスト一覧（実装値）

- Hull: 1
- LargeHull: 3
- Hull5: 5
- ThrusterEngine: 1
- WeaponUnit: 1
- 独立砲塔A相当（上書きWeaponUnit）: 2
- IndependentTurretB: 4
- RadarA: 1
- RadarB: 2
