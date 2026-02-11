// @ts-nocheck
        // ========================================
        // 艦船クラス（モジュラー構成）
        // ========================================

        class Starship {
            constructor(
                x,
                y,
                weaponCount,
                engineCount,
                color = TEAM_COLORS.A,
                hullType = 'hullA',
                weaponClass = IndependentTurretB
            ) {
                this.x = x;
                this.y = y;
                this.vx = 0;
                this.vy = 0;
                this.angle = 0;
                this.color = color;
                this.targetX = x;
                this.targetY = y;
                this.targetVx = 0;  // 目標の速度X（偏差撃ち用）
                this.targetVy = 0;  // 目標の速度Y（偏差撃ち用）
                this.maxSpeed = 2;
                // 初期状態ではスラスターOFF（索敇範囲内に入ったらON）
                this.thrustersActive = false;
                // 相手を検出しているか（索敇範囲内にいるか）
                this.detectedTarget = false;

                // コンポーネント構成
                if (hullType === 'hullC') {
                    this.hull = new HullC();
                } else if (hullType === 'hullB') {
                    this.hull = new HullB();
                } else {
                    this.hull = new HullA();
                }
                this.weapons = [];
                this.engines = [];
                this.radar = null;
                this.radarCount = 0;

                for (let i = 0; i < weaponCount; i++) {
                    this.weapons.push(new weaponClass());
                }
                for (let i = 0; i < engineCount; i++) {
                    this.engines.push(new ThrusterEngine());
                }

                // 船体タイプごとにレーダーを搭載
                if (hullType === 'hullB') {
                    this.radar = new RadarB();
                    this.radarCount = 1;
                } else if (hullType === 'hullC') {
                    this.radar = new RadarC();
                    this.radarCount = 1;
                } else {
                    this.radar = new RadarA();
                    this.radarCount = 1;
                }

                // 射撃ユニット数の上限チェック
                if (this.engines.length > this.weapons.length) {
                    this.engines = this.engines.slice(0, this.weapons.length);
                }

                this.hullExposed = false;  // 船体HPが露出しているか
                this.hasBeenDamaged = false;  // ダメージを受けたかどうか
            }

            getTurretOffsetY(index) {
                const count = this.weapons.length;
                if (count <= 1) return 0;
                if (count === 2) {
                    return index === 0 ? -this.hull.size * 0.6 : this.hull.size * 0.6;
                }
                if (index === 0) return -this.hull.size * 0.6;
                if (index === 1) return 0;
                return this.hull.size * 0.6;
            }

            // 総質量を計算
            getTotalMass() {
                let mass = this.hull.mass;
                mass += this.weapons.reduce((sum, w) => sum + w.mass, 0);
                mass += this.engines.reduce((sum, e) => sum + e.mass, 0);
                if (this.radar) mass += this.radar.mass * this.radarCount;
                return mass;
            }

            // 船体見た目に寄せた当たり判定半径
            getCollisionRadius() {
                if (this.hull.size === 47) return 31;  // HullC
                if (this.hull.size === 28) return 20;  // HullB
                return 11;  // HullA
            }

            // コストを計算（重量と一致）
            getCost() {
                return this.getTotalMass();
            }

            // 総推進力を計算
            getTotalThrust() {
                return this.engines.reduce((sum, e) => sum + e.thrust, 0);
            }

            // 総旋回速度を計算（質量で割る）
            getTotalRotationSpeed() {
                const totalRotationForce = this.engines.reduce((sum, e) => sum + e.rotationSpeed, 0);
                const totalMass = this.getTotalMass();
                return totalRotationForce / totalMass;
            }

            // 総HPを計算（表示用）
            getTotalHP() {
                if (this.weapons.length === 0) {
                    return this.hull.hp;
                }
                return this.weapons.reduce((sum, w) => sum + w.hp, 0);
            }

            getMaxHP() {
                if (this.weapons.length === 0) {
                    return this.hull.maxHp;
                }
                return this.weapons.reduce((sum, w) => sum + w.maxHp, 0);
            }

            // 索敵距離はレーダー基準。互換のため未搭載時のみ武装値へフォールバック。
            getDetectionRange() {
                return this.radar.detectionRange;
            }

            update(targetX, targetY, skipDetectionCheck = false) {
                // 認識距離チェック（目標が指定された場合）
                if (this.weapons.length > 0 && !skipDetectionCheck) {
                    const dx = targetX - this.x;
                    const dy = targetY - this.y;
                    const distanceToTarget = Math.hypot(dx, dy);
                    const detectionRange = this.getDetectionRange();

                    // 索敵範囲内なら目標を設定
                    if (distanceToTarget < detectionRange) {
                        // 索敇範囲内に入ったらスラスターONと検出フラグをON
                        this.thrustersActive = true;
                        this.detectedTarget = true;

                        this.targetX = targetX;
                        this.targetY = targetY;

                        const centerX = WORLD_SIZE / 2;
                        const centerY = WORLD_SIZE / 2;
                        const margin = 100;
                        const correction = 0.6;

                        if (this.x < margin) this.targetX += (centerX - this.targetX) * correction;
                        else if (this.x > WORLD_SIZE - margin) this.targetX += (centerX - this.targetX) * correction;
                        if (this.y < margin) this.targetY += (centerY - this.targetY) * correction;
                        else if (this.y > WORLD_SIZE - margin) this.targetY += (centerY - this.targetY) * correction;
                    } else {
                        // 索敇範囲外：移動しない、検出フラグもOFF
                        this.thrustersActive = false;
                        this.detectedTarget = false;
                        this.targetX = this.x;
                        this.targetY = this.y;
                    }
                } else if (this.weapons.length > 0 && skipDetectionCheck) {
                    // skipDetectionCheck=true の場合：検出距離制限をバイパス（チームAがマウス追従時に使用）
                    this.targetX = targetX;
                    this.targetY = targetY;
                    // thrustersActive と detectedTarget は呼び出し元で既に設定済み
                } else {
                    this.targetX = targetX;
                    this.targetY = targetY;
                }

                // 砲塔を目標に向けて旋回（大型船体の場合のみ独立砲塔）
                if (this.hull.size > 12) {
                    this.weapons.forEach((weapon, index) => {
                        // 砲塔の実際の位置を計算
                        const offsetY = this.getTurretOffsetY(index);
                        const rotatedAngle = this.angle - Math.PI / 2;
                        const rotatedX = Math.cos(rotatedAngle) * 0 - Math.sin(rotatedAngle) * offsetY;
                        const rotatedY = Math.sin(rotatedAngle) * 0 + Math.cos(rotatedAngle) * offsetY;
                        const weaponX = this.x + rotatedX;
                        const weaponY = this.y + rotatedY;

                        // 旋回速度0の砲塔は固定砲として船体角に同期させる
                        if (weapon.rotationSpeed === 0) {
                            weapon.angle = this.angle;
                        } else {
                            // 砲塔の位置から共通の目標への角度を計算（偏差撃ち対応）
                            // 敵が索敇範囲外の場合、this.targetは自身の位置のため砲塔は旋回しない
                            weapon.updateAngle(this.targetX, this.targetY, weaponX, weaponY, this.targetVx, this.targetVy);
                        }
                    });
                } else {
                    // 標準船体の場合、射撃ユニットの角度を船体の角度に同期
                    this.weapons.forEach(weapon => {
                        weapon.angle = this.angle;
                    });
                }

                // 船体の旋回
                if (this.engines.length > 0) {
                    let targetAngle;

                    // 標準船体の場合、偏差撃ちを考慮
                    if (this.hull.size <= 12 && this.weapons.length > 0) {
                        const dx = this.targetX - this.x;
                        const dy = this.targetY - this.y;
                        const distance = Math.hypot(dx, dy);

                        // 弾の飛行時間を計算
                        const bulletSpeed = this.weapons[0].bulletSpeed;
                        const flightTime = distance / bulletSpeed;

                        // 目標の予測位置を計算（偏差撃ち）
                        const predictedX = this.targetX + this.targetVx * flightTime;
                        const predictedY = this.targetY + this.targetVy * flightTime;

                        // 予測位置に向けての角度を計算
                        const predDx = predictedX - this.x;
                        const predDy = predictedY - this.y;
                        targetAngle = Math.atan2(predDy, predDx);
                    } else {
                        // 大型船体の場合、単純に目標方向に向く
                        const dx = this.targetX - this.x;
                        const dy = this.targetY - this.y;
                        targetAngle = Math.atan2(dy, dx);
                    }

                    let angleDiff = targetAngle - this.angle;
                    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                    const rotSpeed = this.getTotalRotationSpeed();
                    this.angle += angleDiff * rotSpeed;
                }

                // 推進
                if (this.thrustersActive && this.engines.length > 0) {
                    const dx = this.targetX - this.x;
                    const dy = this.targetY - this.y;
                    const targetAngle = Math.atan2(dy, dx);
                    
                    let angleDiff = targetAngle - this.angle;
                    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                    const thrustFactor = Math.max(0, Math.cos(angleDiff));
                    const totalThrust = this.getTotalThrust();
                    const totalMass = this.getTotalMass();
                    const acceleration = totalThrust / totalMass;

                    this.vx += Math.cos(this.angle) * acceleration * thrustFactor;
                    this.vy += Math.sin(this.angle) * acceleration * thrustFactor;
                }

                // 画面端の斥力
                const margin = 80;
                const maxRepelStrength = 0.05;
                
                if (this.x < margin) {
                    const distRatio = 1 - (this.x / margin);
                    this.vx += maxRepelStrength * distRatio;
                }
                if (this.x > WORLD_SIZE - margin) {
                    const distRatio = 1 - ((WORLD_SIZE - this.x) / margin);
                    this.vx -= maxRepelStrength * distRatio;
                }
                if (this.y < margin) {
                    const distRatio = 1 - (this.y / margin);
                    this.vy += maxRepelStrength * distRatio;
                }
                if (this.y > WORLD_SIZE - margin) {
                    const distRatio = 1 - ((WORLD_SIZE - this.y) / margin);
                    this.vy -= maxRepelStrength * distRatio;
                }

                // 最高速度制限
                const speed = Math.hypot(this.vx, this.vy);
                if (speed > this.maxSpeed) {
                    this.vx = (this.vx / speed) * this.maxSpeed;
                    this.vy = (this.vy / speed) * this.maxSpeed;
                }

                // 移動
                this.x += this.vx;
                this.y += this.vy;

                // 画面端での反射
                if (this.x < 0 || this.x > WORLD_SIZE) {
                    this.vx *= -1;
                    this.x = Math.max(0, Math.min(WORLD_SIZE, this.x));
                }
                if (this.y < 0 || this.y > WORLD_SIZE) {
                    this.vy *= -1;
                    this.y = Math.max(0, Math.min(WORLD_SIZE, this.y));
                }

                // 摩擦
                this.vx *= 0.98;
                this.vy *= 0.98;

                // 射撃カウンター更新
                this.weapons.forEach(w => w.fireCounter++);
            }

            draw() {
                // 大型船体（船種D）の場合
                if (this.hull.size > 12) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    // 90度回転を追加（横向き基準 → 縦向き）
                    ctx.rotate(this.angle - Math.PI / 2);
                    
                    // 船体の色：射撃ユニットがあればグレー、なければ本来の色
                    const hullColor = this.weapons.length > 0 ? 'rgba(136, 136, 136, 0.7)' : this.color;
                    
                    // カプセル型の船体（角丸長方形）
                    let bodyWidth = this.hull.size * 0.38;
                    let bodyHeight = this.hull.size * 1.35;

                    if (this.engines.length === 0 && this.weapons.length === 0) {
                        // 破壊状態：正常時より小さく（但し現在よりは大きく）
                        bodyWidth *= 0.9;
                        bodyHeight *= 0.9;
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = 1;
                    } else {
                        // 通常状態：塗りつぶしあり
                        ctx.fillStyle = hullColor;
                        ctx.beginPath();
                        const radius = bodyWidth / 2;
                        ctx.arc(0, -bodyHeight/2 + radius, radius, Math.PI, 0, false);
                        ctx.lineTo(bodyWidth/2, bodyHeight/2 - radius);
                        ctx.arc(0, bodyHeight/2 - radius, radius, 0, Math.PI, false);
                        ctx.lineTo(-bodyWidth/2, -bodyHeight/2 + radius);
                        ctx.closePath();
                        ctx.fill();

                        // 船体輪郭
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                        ctx.lineWidth = 1.5;
                    }

                    const radius = bodyWidth / 2;
                    ctx.beginPath();
                    ctx.arc(0, -bodyHeight/2 + radius, radius, Math.PI, 0, false);
                    ctx.lineTo(bodyWidth/2, bodyHeight/2 - radius);
                    ctx.arc(0, bodyHeight/2 - radius, radius, 0, Math.PI, false);
                    ctx.lineTo(-bodyWidth/2, -bodyHeight/2 + radius);
                    ctx.closePath();
                    ctx.stroke();
                    
                    // エンジンを後端に描画（小さい長方形）
                    if (this.engines.length > 0) {
                        ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
                        ctx.fillRect(-6, bodyHeight/2 + 6, 12, 6);
                        ctx.strokeStyle = 'rgba(60, 60, 60, 0.8)';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(-6, bodyHeight/2 + 6, 12, 6);
                    }

                    ctx.restore();

                    // エンジン炎（グローバル座標系で船体後方に描画）
                    if (this.thrustersActive && this.engines.length > 0 && Math.random() > 0.3) {
                        const flameSize = 10 + Math.random() * 6;
                        const flameX = this.x + Math.cos(this.angle + Math.PI) * (this.hull.size * 0.9);
                        const flameY = this.y + Math.sin(this.angle + Math.PI) * (this.hull.size * 0.9);

                        ctx.save();
                        ctx.translate(flameX, flameY);
                        ctx.rotate(this.angle + Math.PI);

                        ctx.fillStyle = 'rgba(255, 50, 0, 0.9)';
                        ctx.beginPath();
                        ctx.moveTo(0, -4);
                        ctx.lineTo(flameSize, 0);
                        ctx.lineTo(0, 4);
                        ctx.closePath();
                        ctx.fill();

                        ctx.restore();
                    }
                    
                    // 独立砲塔を船体の上に描画
                    this.weapons.forEach((weapon, index) => {
                        ctx.save();
                        ctx.translate(this.x, this.y);

                        const offsetY = this.getTurretOffsetY(index);
                        const rotatedAngle = this.angle - Math.PI / 2;
                        const rotatedX = Math.cos(rotatedAngle) * 0 - Math.sin(rotatedAngle) * offsetY;
                        const rotatedY = Math.sin(rotatedAngle) * 0 + Math.cos(rotatedAngle) * offsetY;

                        ctx.translate(rotatedX, rotatedY);
                        ctx.rotate(weapon.angle);

                        ctx.fillStyle = this.color;
                        ctx.beginPath();
                        ctx.moveTo(12, 0);
                        ctx.lineTo(-8.4, -7.2);
                        ctx.lineTo(-6, 0);
                        ctx.lineTo(-8.4, 7.2);
                        ctx.closePath();
                        ctx.fill();

                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                        ctx.lineWidth = 1;
                        ctx.stroke();

                        ctx.restore();
                    });
                    
                    
                } else {
                    // 標準船体（小型艦）
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.angle);

                    let scale = 1;
                    if (this.engines.length === 0 && this.weapons.length === 0) {
                        // 破壊状態：塗りつぶしなし、線のみ、さらに小さい外枠
                        scale = 0.75;
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = 1;
                    } else {
                        // 通常状態：塗りつぶしあり
                        ctx.fillStyle = this.color;
                        ctx.beginPath();
                        ctx.moveTo(this.hull.size, 0);
                        ctx.lineTo(-this.hull.size * 0.7, -this.hull.size * 0.6);
                        ctx.lineTo(-this.hull.size * 0.5, 0);
                        ctx.lineTo(-this.hull.size * 0.7, this.hull.size * 0.6);
                        ctx.closePath();
                        ctx.fill();
                    }

                    ctx.beginPath();
                    ctx.moveTo(this.hull.size * scale, 0);
                    ctx.lineTo(-this.hull.size * 0.7 * scale, -this.hull.size * 0.6 * scale);
                    ctx.lineTo(-this.hull.size * 0.5 * scale, 0);
                    ctx.lineTo(-this.hull.size * 0.7 * scale, this.hull.size * 0.6 * scale);
                    ctx.closePath();

                    // 破壊状態のみ縁取りを描画
                    if (this.engines.length === 0 && this.weapons.length === 0) {
                        ctx.stroke();
                    }
                    
                    // エンジン炎
                    if (this.thrustersActive && this.engines.length > 0 && Math.random() > 0.3) {
                        ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
                        const flameLength = 10 + Math.random() * 10;
                        ctx.beginPath();
                        ctx.moveTo(-this.hull.size * 0.9 - flameLength, -5);
                        ctx.lineTo(-this.hull.size * 0.9 - flameLength, 5);
                        ctx.lineTo(-this.hull.size * 0.9, 0);
                        ctx.closePath();
                        ctx.fill();
                    }
                    
                    ctx.restore();
                }

                // HPバー（ダメージ受け時のみ表示）
                if (this.hasBeenDamaged) {
                    const hpBarWidth = 30;
                    const hpBarHeight = 3;
                    const hpBarSpacing = 5;  // バー間のスペース
                    const hpBarBaseY = this.y - this.getCollisionRadius() - 15;

                    if (this.weapons.length > 0) {
                        // 射撃ユニットが存在する場合：各ユニットごとにHPバーを表示
                        this.weapons.forEach((weapon, index) => {
                            const hpBarX = this.x - hpBarWidth / 2;
                            const hpBarY = hpBarBaseY - (index * (hpBarHeight + hpBarSpacing));

                            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                            ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

                            const hpRatio = weapon.hp / weapon.maxHp;
                            ctx.fillStyle = hpRatio > 0.3 ? '#0f0' : '#f00';
                            ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpRatio, hpBarHeight);

                            ctx.strokeStyle = TEAM_COLORS.A;
                            ctx.lineWidth = 1;
                            ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
                        });
                    } else {
                        // 射撃ユニットが破壊された場合：船体HPを表示
                        const hpBarX = this.x - hpBarWidth / 2;
                        const hpBarY = hpBarBaseY;

                        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                        ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

                        const hpRatio = this.hull.hp / this.hull.maxHp;
                        ctx.fillStyle = '#888888';
                        ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpRatio, hpBarHeight);

                        ctx.strokeStyle = TEAM_COLORS.A;
                        ctx.lineWidth = 1;
                        ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
                    }
                }

                // 索敵範囲
                if (this.weapons.length > 0) {
                    ctx.strokeStyle = 'rgba(0, 255, 0, 0.15)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.getDetectionRange(), 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // 残骸円（常に表示）
                if (this.engines.length === 0 && this.isAlive()) {
                    ctx.strokeStyle = 'rgba(255, 170, 0, 0.4)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    // 当たり判定半径と表示を一致させる
                    const wreckageRadius = this.getCollisionRadius();
                    ctx.arc(this.x, this.y, wreckageRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }

            shouldFire() {
                if (this.weapons.length === 0) return false;

                // 目標を検出していない場合は射撃しない
                if (!this.detectedTarget) return false;

                this.nextFireWeaponIndex = -1;
                for (let i = 0; i < this.weapons.length; i++) {
                    const weapon = this.weapons[i];
                    if (weapon.fireCounter >= weapon.fireInterval) {
                        // 大型船体の場合、砲塔の実際の位置を基準にcanFire判定
                        let weaponX = this.x;
                        let weaponY = this.y;
                        if (this.hull.size > 12) {
                            const offsetY = this.getTurretOffsetY(i);
                            const rotatedAngle = this.angle - Math.PI / 2;
                            const rotatedX = Math.cos(rotatedAngle) * 0 - Math.sin(rotatedAngle) * offsetY;
                            const rotatedY = Math.sin(rotatedAngle) * 0 + Math.cos(rotatedAngle) * offsetY;
                            weaponX += rotatedX;
                            weaponY += rotatedY;
                        }

                        // 全ての砲塔が共通の目標を使用
                        if (weapon.canFire(this.targetX, this.targetY, weaponX, weaponY, this.getDetectionRange())) {
                            weapon.fireCounter = 0;
                            this.nextFireWeaponIndex = i;
                            return true;
                        }
                    }
                }
                return false;
            }

            fire() {
                if (this.weapons.length === 0 || this.nextFireWeaponIndex < 0) return null;

                const weapon = this.weapons[this.nextFireWeaponIndex];
                let fireFromX = this.x;
                let fireFromY = this.y;

                // 大型船体の場合、砲塔の位置から発射
                if (this.hull.size > 12) {
                    const offsetY = this.getTurretOffsetY(this.nextFireWeaponIndex);
                    const rotatedAngle = this.angle - Math.PI / 2;
                    const rotatedX = Math.cos(rotatedAngle) * 0 - Math.sin(rotatedAngle) * offsetY;
                    const rotatedY = Math.sin(rotatedAngle) * 0 + Math.cos(rotatedAngle) * offsetY;
                    fireFromX += rotatedX;
                    fireFromY += rotatedY;
                }

                const bullet = weapon.fire(fireFromX, fireFromY);
                // 弾の色を船の色から設定（チームA/B/C対応）
                bullet.color = this.color;
                return bullet;
            }

            takeDamage(amount) {
                this.hasBeenDamaged = true;
                let destroyedCost = 0;
                let particles = [];

                if (this.weapons.length > 0) {
                    // 射撃ユニットにダメージ
                    const weapon = this.weapons[0];
                    weapon.hp -= amount;

                    if (weapon.hp <= 0) {
                        // 射撃ユニット破壊 - コストを記録
                        destroyedCost += weapon.getCost();
                        this.weapons.shift();

                        // エンジン数が射撃ユニット数を超えたらエンジン喪失 - コストを記録
                        while (this.engines.length > this.weapons.length) {
                            const engine = this.engines.pop();
                            destroyedCost += engine.getCost();
                        }

                        // 残骸状態に遷移した場合、HPバーを表示するため hasBeenDamaged を確実に true に設定
                        if (this.weapons.length === 0) {
                            this.hasBeenDamaged = true;
                        }

                        particles = this.createSmallExplosion();
                    }
                } else {
                    // 船体にダメージ
                    this.hull.hp -= amount;
                }
                return { particles, cost: destroyedCost };
            }

            isAlive() {
                if (this.weapons.length > 0) return true;
                return this.hull.hp > 0;
            }

            collidesWith(otherShip) {
                const dx = this.x - otherShip.x;
                const dy = this.y - otherShip.y;
                const distance = Math.hypot(dx, dy);
                return distance < this.getCollisionRadius() + otherShip.getCollisionRadius();
            }

            createExplosion() {
                const explosionParticles = [];
                const particleCount = 15;
                const colors = ['rgb(255, 100, 0)', 'rgb(255, 200, 0)', 'rgb(255, 150, 0)', 'rgb(200, 100, 0)'];
                
                for (let i = 0; i < particleCount; i++) {
                    const angle = (i / particleCount) * Math.PI * 2;
                    const speed = 2 + Math.random() * 3;
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const size = 3 + Math.random() * 4;
                    
                    explosionParticles.push(new Particle(this.x, this.y, vx, vy, color, size));
                }
                
                return explosionParticles;
            }

            createSmallExplosion() {
                const explosionParticles = [];
                const particleCount = 8;
                const colors = ['rgb(255, 100, 0)', 'rgb(255, 200, 0)'];
                
                for (let i = 0; i < particleCount; i++) {
                    const angle = (i / particleCount) * Math.PI * 2;
                    const speed = 1 + Math.random() * 2;
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const size = 2 + Math.random() * 2;
                    
                    explosionParticles.push(new Particle(this.x, this.y, vx, vy, color, size));
                }
                
                return explosionParticles;
            }

            // ========================================
            // 共通ロジックメソッド
            // ========================================

            selectTarget(opponents, attackWrecks) {
                let closestActive = null;
                let closestActiveDistance = Infinity;
                let closestDebris = null;
                let closestDebrisDistance = Infinity;

                if (this.weapons.length > 0) {
                    const detectionRange = this.getDetectionRange();
                    opponents.forEach(opponent => {
                        const isWreck = opponent.weapons.length === 0;
                        const dx = opponent.x - this.x;
                        const dy = opponent.y - this.y;
                        const distance = Math.hypot(dx, dy);

                        if (distance < detectionRange) {
                            if (isWreck) {
                                // 残骸：attackWrecks 設定に従う
                                if (attackWrecks && distance < closestDebrisDistance) {
                                    closestDebris = opponent;
                                    closestDebrisDistance = distance;
                                }
                            } else {
                                // 通常状態：最も近い相手を記録
                                if (distance < closestActiveDistance) {
                                    closestActive = opponent;
                                    closestActiveDistance = distance;
                                }
                            }
                        }
                    });
                }

                // 優先順位：通常状態 > 残骸
                return closestActive || (closestDebris && attackWrecks ? closestDebris : null);
            }

        }
