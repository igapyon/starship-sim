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
        radarA: { mass: 0, detectionRange: 120 },
        radarB: { mass: 1, detectionRange: 160 },
        radarC: { mass: 2, detectionRange: 200 }
    },
    turrets: {
        turretA: {
            mass: 1,
            hp: 100,
            maxHp: 100,
            fireInterval: 60,
            bulletSpeed: 5,
            bulletDamage: 10,
            maxRange: 160,
            rotationSpeed: 0
        },
        turretB: {
            mass: 2,
            hp: 150,
            maxHp: 150,
            fireInterval: 60,
            bulletSpeed: 5,
            bulletDamage: 10,
            maxRange: 200,
            rotationSpeed: 0.1
        },
        turretC: {
            mass: 4,
            hp: 200,
            maxHp: 200,
            fireInterval: 90,
            bulletSpeed: 5,
            bulletDamage: 20,
            maxRange: 260,
            rotationSpeed: 0.1
        }
    }
};
