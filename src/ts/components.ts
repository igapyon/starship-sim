// @ts-nocheck
        // ========================================
        // コンポーネント定義
        // ========================================

        // 船体A（HullA / Standard Hull）
        class HullA {
            constructor() {
                const spec = COMPONENT_CATALOG.hulls.hullA;
                this.mass = spec.mass;
                this.hp = spec.hp;
                this.maxHp = spec.maxHp;
                this.size = spec.size;
            }

            getCost() {
                return this.mass;
            }
        }

        // 船体B（HullB / Large Hull）
        class HullB {
            constructor() {
                const spec = COMPONENT_CATALOG.hulls.hullB;
                this.mass = spec.mass;
                this.hp = spec.hp;
                this.maxHp = spec.maxHp;
                this.size = spec.size;
            }

            getCost() {
                return this.mass;
            }
        }

        // 船体C（HullC / Light Cruiser Hull）
        class HullC {
            constructor() {
                const spec = COMPONENT_CATALOG.hulls.hullC;
                this.mass = spec.mass;
                this.hp = spec.hp;
                this.maxHp = spec.maxHp;
                this.size = spec.size;
            }

            getCost() {
                return this.mass;
            }
        }

        // 標準推進エンジン（Standard Thruster）
        class ThrusterEngine {
            constructor() {
                const spec = COMPONENT_CATALOG.thrusters.thrusterA;
                this.mass = spec.mass;
                this.thrust = spec.thrust;  // 推進力
                this.rotationSpeed = spec.rotationSpeed;  // 旋回速度（2倍速）
            }

            getCost() {
                return this.mass;
            }
        }

        // 標準レーダー（Standard Radar）
        // レーダーA（Radar A）
        class RadarA {
            constructor() {
                const spec = COMPONENT_CATALOG.radars.radarA;
                this.mass = spec.mass;
                this.detectionBonus = spec.detectionBonus;  // 基準値（ボーナスなし）
            }

            getCost() {
                return this.mass;
            }
        }

        // レーダーB（Radar B）
        class RadarB {
            constructor() {
                const spec = COMPONENT_CATALOG.radars.radarB;
                this.mass = spec.mass;
                this.detectionBonus = spec.detectionBonus;  // 索敵範囲ボーナス（ピクセル）
            }

            getCost() {
                return this.mass;
            }
        }

        // レーダーC（Radar C）
        class RadarC {
            constructor() {
                const spec = COMPONENT_CATALOG.radars.radarC;
                this.mass = spec.mass;
                this.detectionBonus = spec.detectionBonus;  // 索敵範囲ボーナス（ピクセル）
            }

            getCost() {
                return this.mass;
            }
        }

        // 独立砲塔射撃ユニットA（Independent Turret Weapon System A）
        class IndependentTurretA {
            constructor() {
                const spec = COMPONENT_CATALOG.turrets.turretA;
                this.mass = spec.mass;
                this.hp = spec.hp;
                this.maxHp = spec.maxHp;
                this.fireInterval = spec.fireInterval;
                this.fireCounter = 0;
                this.fireAngle = spec.fireAngle;  // 前方15度
                this.detectionRange = spec.detectionRange;
                this.bulletSpeed = spec.bulletSpeed;
                this.bulletDamage = spec.bulletDamage;
                this.maxRange = spec.maxRange;  // 索敇範囲の1.5倍
                this.rotationSpeed = spec.rotationSpeed;  // 砲塔の旋回速度（2倍速）
                this.angle = 0;  // 砲塔独自の角度
                this.targetX = 0;  // 砲塔独自の目標X
                this.targetY = 0;  // 砲塔独自の目標Y
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
                if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

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
        class IndependentTurretB extends IndependentTurretA {
            constructor() {
                super();
                const spec = COMPONENT_CATALOG.turrets.turretB;
                this.mass = spec.mass;
                this.hp = spec.hp;
                this.maxHp = spec.maxHp;
                this.fireInterval = spec.fireInterval;
                this.detectionRange = spec.detectionRange;  // 船種C150の1.5倍
                this.maxRange = spec.maxRange;  // 索敵範囲の1.5倍
                this.bulletDamage = spec.bulletDamage;
            }
        }
