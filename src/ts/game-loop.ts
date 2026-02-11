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
                if (beacon.teamId !== teamId) continue;
                for (let opponent of opponents) {
                    const isWreck = opponent.weapons.length === 0;
                    if (isWreck && !attackWrecks) continue;
                    if (beacon.contains(opponent)) detected.push(opponent);
                }
            }
            return detected;
        }

        // ========================================
        // 統一されたチーム更新関数
        // ========================================

        function updateTeam(ships, teamId, opponents) {
            const isControlledByMouse = teamId === mouseControlTeam;
            const metadata = TEAM_DEFINITIONS[teamId];
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
                        } else {
                            target = beaconTarget;
                            isBeaconTarget = true;
                        }
                    } else if (normalTarget) {
                        target = normalTarget;
                    } else if (beaconTarget) {
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
                    } else {
                        ship.update(target.x, target.y);
                    }
                } else {
                    // 目標がない場合：停止状態（全チーム共通）
                    ship.targetVx = 0;
                    ship.targetVy = 0;

                    // 停止状態（位置のみ更新、update()は呼ばない）
                    ship.thrustersActive = false;
                    ship.vx *= 0.95;
                    ship.vy *= 0.95;
                    ship.detectedTarget = false;

                    // 移動
                    ship.x += ship.vx;
                    ship.y += ship.vy;

                    // 画面端での反射
                    if (ship.x < 0 || ship.x > WORLD_SIZE) {
                        ship.vx *= -1;
                        ship.x = Math.max(0, Math.min(WORLD_SIZE, ship.x));
                    }
                    if (ship.y < 0 || ship.y > WORLD_SIZE) {
                        ship.vy *= -1;
                        ship.y = Math.max(0, Math.min(WORLD_SIZE, ship.y));
                    }

                    // 目標なし（残骸含む）でも、見た目半径ぶんは最終的に画面内へ戻す
                    const visualRadius = ship.getCollisionRadius();
                    const settleStrength = SIMULATION_SETTINGS.physics.edgeRepulsionStrength;
                    if (ship.x < visualRadius) {
                        const ratio = (visualRadius - ship.x) / Math.max(visualRadius, 1);
                        ship.vx += settleStrength * ratio;
                    } else if (ship.x > WORLD_SIZE - visualRadius) {
                        const ratio = (ship.x - (WORLD_SIZE - visualRadius)) / Math.max(visualRadius, 1);
                        ship.vx -= settleStrength * ratio;
                    }
                    if (ship.y < visualRadius) {
                        const ratio = (visualRadius - ship.y) / Math.max(visualRadius, 1);
                        ship.vy += settleStrength * ratio;
                    } else if (ship.y > WORLD_SIZE - visualRadius) {
                        const ratio = (ship.y - (WORLD_SIZE - visualRadius)) / Math.max(visualRadius, 1);
                        ship.vy -= settleStrength * ratio;
                    }

                    // 摩擦
                    ship.vx *= SIMULATION_SETTINGS.physics.friction;
                    ship.vy *= SIMULATION_SETTINGS.physics.friction;
                }

                if (target && ship.shouldFire()) {
                    const bullet = ship.fire();
                    if (bullet) bullets.push(bullet);
                }

                ship.draw();
            });
        }

        // ========================================
        // メインループ
        // ========================================

        function animate() {
            // 追従モード時は毎フレームの艦船座標に合わせて表示位置を再計算
            recomputeRenderState();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.imageSmoothingEnabled = false;

            // レターボックス背景
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // world空間を描画する変換を適用
            ctx.setTransform(
                renderState.dpr * renderState.worldScale,
                0,
                0,
                renderState.dpr * renderState.worldScale,
                renderState.offsetX * renderState.dpr,
                renderState.offsetY * renderState.dpr
            );

            // world背景
            ctx.fillStyle = '#001a33';
            ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

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
                } else {
                    detectionBeacons.splice(i, 1);
                }
            }

            // 統一されたチーム更新（チーム定義に基づく対称処理）
            for (const teamId of TEAM_IDS) {
                const opponents = TEAM_DEFINITIONS[teamId].enemies.flatMap((enemyTeamId) => teamShips[enemyTeamId]);
                updateTeam(teamShips[teamId], teamId, opponents);
            }

            // 衝突判定（相互作用）- すべての船と残骸に対して統一的に斥力を適用
            const allShips = TEAM_IDS.flatMap((teamId) => teamShips[teamId]);
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
            const bulletTargetMap = {};
            for (const teamId of TEAM_IDS) {
                bulletTargetMap[TEAM_COLORS[teamId]] = TEAM_DEFINITIONS[teamId].enemies.map((enemyTeamId) => ({
                    ships: teamShips[enemyTeamId],
                    targetTeamId: enemyTeamId
                }));
            }

            // 弾更新
            for (let i = bullets.length - 1; i >= 0; i--) {
                bullets[i].update();

                if (bullets[i].isAlive()) {
                    let bulletHit = false;
                    const targets = bulletTargetMap[bullets[i].color];

                    if (targets) {
                        for (let targetGroup of targets) {
                            if (bulletHit) break;
                            const ships = targetGroup.ships;
                            const targetTeamId = targetGroup.targetTeamId;

                            for (let j = ships.length - 1; j >= 0; j--) {
                                if (bullets[i].collidesWith(ships[j])) {
                                    const damageResult = ships[j].takeDamage(bullets[i].damage);
                                    particles.push(...damageResult.particles);

                                    // コスト更新
                                    lostCostByTeam[targetTeamId] += damageResult.cost;

                                    if (!ships[j].isAlive()) {
                                        particles.push(...ships[j].createExplosion());
                                        lostCostByTeam[targetTeamId] += ships[j].getCost();
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
                    } else if (i >= 0 && i < bullets.length) {
                        bullets[i].draw();
                    }
                } else {
                    bullets.splice(i, 1);
                }
            }

            // パーティクル更新
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                if (particles[i].isAlive()) {
                    particles[i].draw();
                } else {
                    particles.splice(i, 1);
                }
            }

            // 情報表示：コスト情報
            const currentCostByTeam = {};
            for (const teamId of TEAM_IDS) {
                currentCostByTeam[teamId] = initialCostByTeam[teamId] - lostCostByTeam[teamId];
            }
            // 破壊されたシップ（射撃ユニットなし）は除外
            const currentShipCountByTeam = {};
            for (const teamId of TEAM_IDS) {
                currentShipCountByTeam[teamId] = teamShips[teamId].filter((ship) => ship.weapons.length > 0).length;
            }

            infoDiv.innerHTML = TEAM_IDS.map((teamId) => {
                const currentShipCount = currentShipCountByTeam[teamId];
                const initialShipCount = initialShipCountByTeam[teamId];
                const currentCost = currentCostByTeam[teamId];
                const initialCost = initialCostByTeam[teamId];
                return `<strong>${formatTeamLabel(teamId)}</strong><br>
船体 ${currentShipCount}/${initialShipCount}${currentShipCount === 0 ? ' 全滅' : ''}<br>
コスト ${currentCost}/${initialCost}`;
            }).join('<br><br>');

            requestAnimationFrame(animate);
        }

        animate();
