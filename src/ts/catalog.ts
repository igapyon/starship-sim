// @ts-nocheck
// ========================================
// コンポーネントカタログ（データ定義）
// ========================================

const COMPONENT_CATALOG = {
    hulls: {
        hullA: { mass: 1, hp: 100, maxHp: 100, size: 12 },
        hullB: { mass: 3, hp: 300, maxHp: 300, size: 28 },
        hullC: { mass: 5, hp: 500, maxHp: 500, size: 47 }
    },
    thrusters: {
        thrusterA: { mass: 1, thrust: 0.15, rotationSpeed: 0.1 }
    },
    radars: {
        radarA: { mass: 0, detectionBonus: 0 },
        radarB: { mass: 1, detectionBonus: 30 },
        radarC: { mass: 2, detectionBonus: 45 }
    },
    turrets: {
        turretA: {
            mass: 1,
            hp: 150,
            maxHp: 150,
            fireInterval: 60,
            fireAngle: Math.PI / 12,
            detectionRange: 150,
            bulletSpeed: 5,
            bulletDamage: 10,
            maxRange: 225,
            rotationSpeed: 0.1
        },
        turretB: {
            mass: 4,
            hp: 200,
            maxHp: 200,
            fireInterval: 90,
            detectionRange: 225,
            bulletDamage: 20,
            maxRange: 338
        }
    }
};
