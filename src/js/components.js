// @ts-nocheck
// ========================================
// コンポーネント定義
// ========================================
// 標準船体（Standard Hull）
class Hull {
    constructor() {
        this.mass = 1;
        this.hp = 100;
        this.maxHp = 100;
        this.size = 12;
    }
    getCost() {
        return this.mass;
    }
}
// 大型船体（Large Hull）
class LargeHull {
    constructor() {
        this.mass = 3;
        this.hp = 300;
        this.maxHp = 300;
        this.size = 28;
    }
    getCost() {
        return this.mass;
    }
}
// 船体5（Light Cruiser Hull）
class Hull5 {
    constructor() {
        this.mass = 5;
        this.hp = 500;
        this.maxHp = 500;
        this.size = 47;
    }
    getCost() {
        return this.mass;
    }
}
// 標準推進エンジン（Standard Thruster）
class ThrusterEngine {
    constructor() {
        this.mass = 1;
        this.thrust = 0.15; // 推進力
        this.rotationSpeed = 0.1; // 旋回速度（2倍速）
    }
    getCost() {
        return this.mass;
    }
}
// 高性能レーダー（Advanced Radar）
// レーダーA（Radar A）
class RadarA {
    constructor() {
        this.mass = 1;
        this.detectionBonus = 30; // 索敵範囲ボーナス（ピクセル）
    }
    getCost() {
        return this.mass;
    }
}
// レーダーB（Radar B）
class RadarB {
    constructor() {
        this.mass = 2;
        this.detectionBonus = 45; // 索敵範囲ボーナス（ピクセル）
    }
    getCost() {
        return this.mass;
    }
}
// 標準射撃ユニット（Standard Weapon System）
class WeaponUnit {
    constructor() {
        this.mass = 1;
        this.hp = 150;
        this.maxHp = 150;
        this.fireInterval = 60;
        this.fireCounter = 0;
        this.fireAngle = Math.PI / 12; // 前方15度
        this.detectionRange = 150;
        this.bulletSpeed = 5;
        this.bulletDamage = 10;
        this.maxRange = 225; // 索敇範囲の1.5倍
        this.rotationSpeed = 0.1; // 砲塔の旋回速度（2倍速）
        this.angle = 0; // 砲塔独自の角度
        this.targetX = 0; // 砲塔独自の目標X
        this.targetY = 0; // 砲塔独自の目標Y
    }
    // 砲塔を目標に向けて旋回（偏差撃ちに対応）
    updateAngle(targetX, targetY, currentX, currentY, targetVx = 0, targetVy = 0) {
        // 現在の距離を計算
        const dx = targetX - currentX;
        const dy = targetY - currentY;
        const distance = Math.hypot(dx, dy);
        // 弾の飛行時間を計算
        const flightTime = distance / this.bulletSpeed;
        // 目標の予測位置を計算（偏差撃ち）
        const predictedX = targetX + targetVx * flightTime;
        const predictedY = targetY + targetVy * flightTime;
        // 予測位置に向けての角度を計算
        const predDx = predictedX - currentX;
        const predDy = predictedY - currentY;
        const targetAngle = Math.atan2(predDy, predDx);
        let angleDiff = targetAngle - this.angle;
        if (angleDiff > Math.PI)
            angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI)
            angleDiff += 2 * Math.PI;
        this.angle += angleDiff * this.rotationSpeed;
    }
    canFire(targetX, targetY, shipX, shipY) {
        // 索敵範囲チェックのみ（敵がいれば角度関係なく射撃）
        const dx = targetX - shipX;
        const dy = targetY - shipY;
        const distance = Math.hypot(dx, dy);
        return distance <= this.detectionRange;
    }
    fire(x, y) {
        const bulletVx = Math.cos(this.angle) * this.bulletSpeed;
        const bulletVy = Math.sin(this.angle) * this.bulletSpeed;
        const fireX = x + Math.cos(this.angle) * 12;
        const fireY = y + Math.sin(this.angle) * 12;
        return new Bullet(fireX, fireY, bulletVx, bulletVy, x, y, this.bulletDamage, this.maxRange);
    }
    getCost() {
        return this.mass;
    }
}
// 独立砲塔射撃ユニットB（Independent Turret Weapon System B）
class IndependentTurretB extends WeaponUnit {
    constructor() {
        super();
        this.mass = 4;
        this.hp = 200;
        this.maxHp = 200;
        this.fireInterval = 90;
        this.detectionRange = 225; // 船種C150の1.5倍
        this.maxRange = 338; // 索敵範囲の1.5倍
        this.bulletDamage = 20;
    }
}
