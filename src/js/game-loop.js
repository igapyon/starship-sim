// @ts-nocheck
// ========================================
// ビーコン検出ロジック
// ========================================
function isShipInFriendlyBeacon(ship, teamId) {
    // 船がこのチームのビーコン内にいるかチェック
    for (let beacon of detectionBeacons) {
        if (beacon.teamId === teamId && beacon.contains(ship)) {
            return true;
        }
    }
    return false;
}
function getBeaconDetectedEnemies(teamId, opponents) {
    // このチームのビーコン内に敵がいるかチェック
    const detected = [];
    for (let beacon of detectionBeacons) {
        if (beacon.teamId !== teamId)
            continue;
        for (let opponent of opponents) {
            const isWreck = opponent.weapons.length === 0;
            if (isWreck && !attackWrecks)
                continue;
            if (beacon.contains(opponent))
                detected.push(opponent);
        }
    }
    return detected;
}
// ========================================
// 統一されたチーム更新関数
// ========================================
function updateTeam(ships, teamId, opponents) {
    const isControlledByMouse = teamId === mouseControlTeam;
    const metadata = teamMetadata[teamId];
    const enemyShips = opponents.filter(opponent => opponent.color !== metadata.color);
    const beaconDetectedEnemies = getBeaconDetectedEnemies(teamId, enemyShips);
    const enemyInBeacon = beaconDetectedEnemies.length > 0;
    ships.forEach((ship, index) => {
        let target = null;
        let isBeaconTarget = false;
        if (ship.weapons.length > 0) {
            const normalTarget = ship.selectTarget(enemyShips, attackWrecks);
            let beaconTarget = null;
            let beaconClosestDistance = Infinity;
            if (enemyInBeacon) {
                // ビーコン内に敵がいる場合：ビーコン検出範囲も索敵候補に追加
                for (let opponent of beaconDetectedEnemies) {
                    const dx = opponent.x - ship.x;
                    const dy = opponent.y - ship.y;
                    const distance = Math.hypot(dx, dy);
                    if (distance < beaconClosestDistance) {
                        beaconClosestDistance = distance;
                        beaconTarget = opponent;
                    }
                }
            }
            if (normalTarget && beaconTarget) {
                const dx = normalTarget.x - ship.x;
                const dy = normalTarget.y - ship.y;
                const normalDistance = Math.hypot(dx, dy);
                if (normalDistance <= beaconClosestDistance) {
                    target = normalTarget;
                }
                else {
                    target = beaconTarget;
                    isBeaconTarget = true;
                }
            }
            else if (normalTarget) {
                target = normalTarget;
            }
            else if (beaconTarget) {
                target = beaconTarget;
                isBeaconTarget = true;
            }
        }
        if (target) {
            // 目標がある場合：追跡・攻撃
            ship.targetVx = target.vx;
            ship.targetVy = target.vy;
            if (isBeaconTarget) {
                // ビーコン検出のターゲットは索敵距離制限をバイパス
                ship.thrustersActive = true;
                ship.detectedTarget = true;
                ship.update(target.x, target.y, true);
            }
            else {
                ship.update(target.x, target.y);
            }
        }
        else {
            // 目標がない場合：停止状態（全チーム共通）
            ship.targetVx = 0;
            ship.targetVy = 0;
            // 停止状態（位置のみ更新、update()は呼ばない）
            ship.thrustersActive = false;
            ship.vx *= 0.95;
            ship.vy *= 0.95;
            ship.detectedTarget = false;
            const canvasWidth = canvas.width / window.devicePixelRatio;
            const canvasHeight = canvas.height / window.devicePixelRatio;
            // 移動
            ship.x += ship.vx;
            ship.y += ship.vy;
            // 画面端での反射
            if (ship.x < 0 || ship.x > canvasWidth) {
                ship.vx *= -1;
                ship.x = Math.max(0, Math.min(canvasWidth, ship.x));
            }
            if (ship.y < 0 || ship.y > canvasHeight) {
                ship.vy *= -1;
                ship.y = Math.max(0, Math.min(canvasHeight, ship.y));
            }
            // 摩擦
            ship.vx *= 0.98;
            ship.vy *= 0.98;
        }
        if (target && ship.shouldFire()) {
            const bullet = ship.fire();
            if (bullet)
                bullets.push(bullet);
        }
        ship.draw();
    });
}
// ========================================
// メインループ
// ========================================
function animate() {
    const canvasWidth = canvas.width / window.devicePixelRatio;
    const canvasHeight = canvas.height / window.devicePixelRatio;
    // 背景
    ctx.fillStyle = '#001a33';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    // 星
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    // ビーコン更新と描画
    for (let i = detectionBeacons.length - 1; i >= 0; i--) {
        detectionBeacons[i].update();
        if (detectionBeacons[i].isAlive()) {
            detectionBeacons[i].draw();
        }
        else {
            detectionBeacons.splice(i, 1);
        }
    }
    // 統一されたチーム更新
    updateTeam(playerFleet, 'A', [...enemies, ...teamC]);
    updateTeam(enemies, 'B', [...playerFleet, ...teamC]);
    updateTeam(teamC, 'C', [...playerFleet, ...enemies]);
    // 衝突判定（相互作用）- すべての船と残骸に対して統一的に斥力を適用
    const allShips = [...playerFleet, ...enemies, ...teamC];
    for (let i = 0; i < allShips.length; i++) {
        for (let j = i + 1; j < allShips.length; j++) {
            if (allShips[i].collidesWith(allShips[j])) {
                const dx = allShips[i].x - allShips[j].x;
                const dy = allShips[i].y - allShips[j].y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0) {
                    const pushForce = 0.5;
                    // 相互に反対方向の斥力を与える
                    allShips[i].vx += (dx / dist) * pushForce;
                    allShips[i].vy += (dy / dist) * pushForce;
                    allShips[j].vx -= (dx / dist) * pushForce;
                    allShips[j].vy -= (dy / dist) * pushForce;
                }
            }
        }
    }
    // 弾の対象チーム選定マップ（各チームの弾が何を攻撃できるか）
    const bulletTargetMap = {
        '#99ddff': [{ ships: enemies, costVar: 'lostEnemyCost' }, { ships: teamC, costVar: 'lostTeamCCost' }], // チームAの弾
        '#ffccdd': [{ ships: playerFleet, costVar: 'lostPlayerCost' }, { ships: teamC, costVar: 'lostTeamCCost' }], // チームBの弾
        '#ffd24d': [{ ships: playerFleet, costVar: 'lostPlayerCost' }, { ships: enemies, costVar: 'lostEnemyCost' }] // チームCの弾
    };
    // 弾更新
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (bullets[i].isAlive()) {
            let bulletHit = false;
            const targets = bulletTargetMap[bullets[i].color];
            if (targets) {
                for (let targetGroup of targets) {
                    if (bulletHit)
                        break;
                    const ships = targetGroup.ships;
                    const costVarName = targetGroup.costVar;
                    for (let j = ships.length - 1; j >= 0; j--) {
                        if (bullets[i].collidesWith(ships[j])) {
                            const damageResult = ships[j].takeDamage(bullets[i].damage);
                            particles.push(...damageResult.particles);
                            // コスト更新
                            if (costVarName === 'lostPlayerCost')
                                lostPlayerCost += damageResult.cost;
                            else if (costVarName === 'lostEnemyCost')
                                lostEnemyCost += damageResult.cost;
                            else if (costVarName === 'lostTeamCCost')
                                lostTeamCCost += damageResult.cost;
                            if (!ships[j].isAlive()) {
                                particles.push(...ships[j].createExplosion());
                                if (costVarName === 'lostPlayerCost')
                                    lostPlayerCost += ships[j].getCost();
                                else if (costVarName === 'lostEnemyCost')
                                    lostEnemyCost += ships[j].getCost();
                                else if (costVarName === 'lostTeamCCost')
                                    lostTeamCCost += ships[j].getCost();
                                ships.splice(j, 1);
                            }
                            bulletHit = true;
                            break;
                        }
                    }
                }
            }
            if (bulletHit) {
                bullets.splice(i, 1);
            }
            else if (i >= 0 && i < bullets.length) {
                bullets[i].draw();
            }
        }
        else {
            bullets.splice(i, 1);
        }
    }
    // パーティクル更新
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].isAlive()) {
            particles[i].draw();
        }
        else {
            particles.splice(i, 1);
        }
    }
    // 情報表示：コスト情報
    const currentPlayerCost = initialPlayerCost - lostPlayerCost;
    const currentEnemyCost = initialEnemyCost - lostEnemyCost;
    const currentTeamCCost = initialTeamCCost - lostTeamCCost;
    // 破壊されたシップ（射撃ユニットなし）は除外
    const currentPlayerShipCount = playerFleet.filter(ship => ship.weapons.length > 0).length;
    const currentEnemyShipCount = enemies.filter(ship => ship.weapons.length > 0).length;
    const currentTeamCShipCount = teamC.filter(ship => ship.weapons.length > 0).length;
    infoDiv.innerHTML = `
<strong>チームA（水色）</strong><br>
船体 ${currentPlayerShipCount}/${initialPlayerShipCount}${currentPlayerShipCount === 0 ? ' 全滅' : ''}<br>
コスト ${currentPlayerCost}/${initialPlayerCost}<br>
<br>
<strong>チームB（桃色）</strong><br>
船体 ${currentEnemyShipCount}/${initialEnemyShipCount}${currentEnemyShipCount === 0 ? ' 全滅' : ''}<br>
コスト ${currentEnemyCost}/${initialEnemyCost}<br>
<br>
<strong>チームC（黄色）</strong><br>
船体 ${currentTeamCShipCount}/${initialTeamCShipCount}${currentTeamCShipCount === 0 ? ' 全滅' : ''}<br>
コスト ${currentTeamCCost}/${initialTeamCCost}<br>
            `;
    requestAnimationFrame(animate);
}
animate();
window.addEventListener('resize', () => {
    resizeCanvas();
});
