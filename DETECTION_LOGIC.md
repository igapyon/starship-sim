# 索敵（Detection）ロジック

このドキュメントは、現行実装における索敵・目標選択・ビーコン連携の仕様をまとめたものです。

対象実装:
- `src/ts/game-loop.ts`
- `src/ts/starship.ts`
- `src/ts/projectiles-effects.ts`

---

## 概要

各チーム（A/B/C）は毎フレーム `updateTeam()` で更新されます。  
目標決定は次の2系統を組み合わせます。

1. 通常索敵 (`selectTarget`)
2. ビーコン索敵 (`getBeaconDetectedEnemies`)

最終的に、候補が両方ある場合は「自艦から近い方」を採用します。

---

## チーム関係

- チームAは B/C を敵とみなす
- チームBは A/C を敵とみなす
- チームCは A/B を敵とみなす

全チームとも決定論的ロジックで同じ流れを使います。

---

## 通常索敵（`Starship.selectTarget`）

`selectTarget(opponents, attackWrecks)` は次の優先順位で目標を返します。

1. 索敵範囲内の「通常艦（weaponsあり）」の最短距離
2. 上記がいない場合、`attackWrecks=true` のときのみ「残骸（weaponsなし）」の最短距離
3. 見つからなければ `null`

索敵範囲判定は `this.weapons[0].detectionRange` を使用します。

---

## ビーコン索敵（`game-loop.ts`）

### ビーコン仕様（`DetectionBeacon`）

- 範囲: `150`
- 持続: `180` フレーム
- チーム属性あり（A/B/C）

### ビーコン検出

`getBeaconDetectedEnemies(teamId, opponents)` の挙動:

- 自チームのビーコンのみ使用
- ビーコン内に入った敵を検出対象に追加
- `attackWrecks=false` の場合は残骸を除外

### 通常索敵との統合

`updateTeam()` で:

- `normalTarget`（通常索敵）と `beaconTarget`（ビーコン索敵）を比較
- 両方ある場合、距離が近い方を採用
- `beaconTarget` 採用時は `ship.update(targetX, targetY, true)` を呼び、
  索敵距離制限チェックをバイパス（`skipDetectionCheck=true`）

---

## 追跡・停止の状態遷移

### 目標あり

- `ship.targetVx/targetVy` を目標速度で更新
- `ship.update(...)` で旋回・推進・射撃判定へ進む

### 目標なし

- 停止状態へ移行
  - `ship.thrustersActive = false`
  - `ship.detectedTarget = false`
  - `vx/vy` 減衰（`*0.95` と `*0.98`）
- 位置更新、境界反射、摩擦を適用

---

## `attackWrecks` の影響

- `false`（デフォルト）:
  - 通常索敵でもビーコン索敵でも残骸を目標にしない
- `true`:
  - 通常索敵で「通常艦がいないときのみ」残骸を目標化
  - ビーコン索敵でも残骸を検出対象に含める

---

## 射撃対象の扱い

弾の当たり判定はチーム別ターゲットマップで決まり、`attackWrecks` とは独立です。  
（`attackWrecks` は目標選択のみを制御）

---

## 注意点（現状の設計）

1. レーダークラスの `detectionBonus` は未統合
- `RadarA/RadarB` は質量コストには反映されるが、索敵距離計算には未使用
- 実際の索敵は `weapon.detectionRange` ベース

2. ビーコン優先ではなく「近い方優先」
- ビーコン候補が常に優先されるわけではない
- 通常索敵候補が近ければそちらを選ぶ

---

## 変更時の確認ポイント

索敵ロジックを変更した場合は、以下の挙動を最低限確認します。

1. `attackWrecks=false` で残骸追従しないこと
2. `attackWrecks=true` で通常艦不在時に残骸追従すること
3. ビーコン配置時に索敵圏外目標へ追従できること
4. 3チームすべてで同等ルールが適用されること
