# Unit Catalog / ユニット一覧

このドキュメントは、シミュレーションで使う基礎コンポーネントを一覧化したものです。

実装参照:
- `src/ts/catalog.ts`
- `src/ts/components.ts`
- `src/ts/starship.ts`

## 船体（Hull）

### HullA
- class: `HullA`
- mass: 1
- hp/maxHp: 100/100
- size: 12

### HullB
- class: `HullB`
- mass: 3
- hp/maxHp: 300/300
- size: 28

### HullC
- class: `HullC`
- mass: 5
- hp/maxHp: 500/500
- size: 47

## 推進ユニット（Thruster）

### ThrusterA
- class: `ThrusterEngine`
- mass: 1
- thrust: 0.15
- rotationSpeed: 0.1

## レーダー（Radar）

### RadarA
- class: `RadarA`
- mass: 0
- detectionRange: 120

### RadarB
- class: `RadarB`
- mass: 1
- detectionRange: 160

### RadarC
- class: `RadarC`
- mass: 2
- detectionRange: 200

注記:
- `detectionRange` は索敵判定・射撃判定・索敵円描画に反映済み

## 砲塔（Turret）

### TurretA
- class: `IndependentTurretA`
- mass: 1
- hp/maxHp: 100/100
- fireInterval: 60
- bulletSpeed: 5
- bulletDamage: 10
- maxRange: 160
- rotationSpeed: 0

### TurretB
- class: `IndependentTurretB`
- mass: 2
- hp/maxHp: 150/150
- fireInterval: 60
- bulletSpeed: 5
- bulletDamage: 10
- maxRange: 200
- rotationSpeed: 0.1

### TurretC
- class: `IndependentTurretC`
- mass: 4
- hp/maxHp: 200/200
- fireInterval: 90
- bulletSpeed: 5
- bulletDamage: 20
- maxRange: 260
- rotationSpeed: 0.1

注記:
- 砲塔の `canFire()` は砲塔固有の索敵値ではなく、艦のレーダー距離（`getDetectionRange()`）を使う

## 艦プリセット（SHIP_PRESETS）

`src/ts/starship.ts` の `SHIP_PRESETS`:

### corvette
- hullType: `hullA`
- weaponCount: 1
- engineCount: 1
- weaponClass: 未指定（`Starship` デフォルト `IndependentTurretB`）

### destroyer
- hullType: `hullB`
- weaponCount: 2
- engineCount: 2
- weaponClass: `turretB`
- weaponMaxRange: 270（上書き）

### lightCruiser
- hullType: `hullC`
- weaponCount: 3
- engineCount: 3
- weaponClass: `turretC`
