// @ts-nocheck
// ========================================
// コンポーネントカタログ（データ定義）
// ========================================
const COMPONENT_CATALOG = {
    // 船体パーツ定義
    hulls: {
        // 軽量・低耐久の小型船体
        hullA: { mass: 1, hp: 100, maxHp: 100, size: 12 },
        // 中量・中耐久の中型船体
        hullB: { mass: 3, hp: 300, maxHp: 300, size: 28 },
        // 重量・高耐久の大型船体
        hullC: { mass: 5, hp: 500, maxHp: 500, size: 47 }
    },
    // 推進器パーツ定義
    thrusters: {
        // 推進力と旋回性能を与える標準スラスター
        thrusterA: { mass: 1, thrust: 0.15, rotationSpeed: 0.1 }
    },
    // 索敵レーダーパーツ定義
    radars: {
        // 軽量・短射程レーダー
        radarA: { mass: 0, detectionRange: 120 },
        // 標準射程レーダー
        radarB: { mass: 1, detectionRange: 160 },
        // 重量・長射程レーダー
        radarC: { mass: 2, detectionRange: 200 }
    },
    // 砲塔パーツ定義
    turrets: {
        // 固定砲塔（旋回なし）
        turretA: {
            // 砲塔の重量
            mass: 1,
            // 現在耐久値
            hp: 100,
            // 最大耐久値
            maxHp: 100,
            // 発射間隔（フレーム）
            fireInterval: 60,
            // 弾速
            bulletSpeed: 5,
            // 1発あたりダメージ
            bulletDamage: 10,
            // 最大射程
            maxRange: 160,
            // 旋回速度（0 で固定）
            rotationSpeed: 0
        },
        // 旋回可能な標準砲塔
        turretB: {
            // 砲塔の重量
            mass: 2,
            // 現在耐久値
            hp: 150,
            // 最大耐久値
            maxHp: 150,
            // 発射間隔（フレーム）
            fireInterval: 60,
            // 弾速
            bulletSpeed: 5,
            // 1発あたりダメージ
            bulletDamage: 10,
            // 最大射程
            maxRange: 200,
            // 旋回速度
            rotationSpeed: 0.1
        },
        // 高威力・長射程の重砲塔
        turretC: {
            // 砲塔の重量
            mass: 4,
            // 現在耐久値
            hp: 200,
            // 最大耐久値
            maxHp: 200,
            // 発射間隔（フレーム）
            fireInterval: 90,
            // 弾速
            bulletSpeed: 5,
            // 1発あたりダメージ
            bulletDamage: 20,
            // 最大射程
            maxRange: 260,
            // 旋回速度
            rotationSpeed: 0.1
        }
    }
};
const SIMULATION_SETTINGS = {
    // 物理シミュレーション設定
    physics: {
        // 移動速度の上限
        maxSpeed: 2,
        // 慣性減衰（小さいほど減速しやすい）
        friction: 0.98,
        // 画面端から反発を開始する距離
        edgeRepulsionMargin: 50,
        // 画面端からの反発力
        edgeRepulsionStrength: 0.05
    },
    // AI の行動設定
    ai: {
        // 画面端付近で目標補正を始める距離
        edgeTargetCorrectionMargin: 100,
        // 目標補正の強さ
        edgeTargetCorrectionFactor: 0.6,
        // デフォルトで残骸を攻撃対象に含めるか
        attackWrecksDefault: false,
        // ビーコン検知のデフォルト有効範囲
        beaconRangeDefault: 160
    }
};
