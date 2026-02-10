// @ts-nocheck
        // ========================================
        // ゲーム初期化
        // ========================================

        // チームシステム：各チームは色と設定のメタデータを持つ
        const teamMetadata = {
            'A': { color: '#99ddff', reactsToMouse: true, name: 'チームA（水色）' },
            'B': { color: '#ffccdd', reactsToMouse: false, name: 'チームB（桃色）' },
            'C': { color: '#ffd24d', reactsToMouse: false, name: 'チームC（黄色）' }
        };

        let mouseControlTeam = 'A';  // マウス操作対象チーム（デフォルト：チームA）
        let playerFleet = [];
        let enemies = [];
        let teamC = [];
        const bullets = [];
        const particles = [];
        let mouseX = WORLD_SIZE / 2;
        let mouseY = WORLD_SIZE / 2;
        let attackWrecks = false;  // 残骸を攻撃するか（デフォルト：しない）
        const detectionBeacons = [];  // 検出ビーコン配列
        let selectedBeaconTeam = 'A';  // 現在選択されているビーコン配置チーム

        // コスト追跡
        let initialPlayerCost = 0;
        let initialEnemyCost = 0;
        let initialTeamCCost = 0;
        let lostPlayerCost = 0;
        let lostEnemyCost = 0;
        let lostTeamCCost = 0;
        let initialPlayerShipCount = 0;
        let initialEnemyShipCount = 0;
        let initialTeamCShipCount = 0;

        // ゲーム初期化関数
        function initializeGame(config = 'destroyer1') {
            // マウス操作対象をデフォルトでチームAに設定
            mouseControlTeam = 'A';

            // コストリセット
            initialPlayerCost = 0;
            initialEnemyCost = 0;
            initialTeamCCost = 0;
            lostPlayerCost = 0;
            lostEnemyCost = 0;
            lostTeamCCost = 0;
            initialPlayerShipCount = 0;
            initialEnemyShipCount = 0;
            initialTeamCShipCount = 0;

            // チームAを初期化
            playerFleet = [];

            // チームCを初期化
            teamC = [];

            if (config === 'weapon1') {
                // 船種C1つ：射撃ユニット1、標準船体
                playerFleet.push(new Starship(WORLD_SIZE / 2, WORLD_SIZE / 2, 1, 1, '#99ddff', 'standard'));
            } else if (config === 'weapon4') {
                // 船種C4つ：それぞれ射撃ユニット1、標準船体
                const spacing = 60;
                playerFleet.push(new Starship(WORLD_SIZE / 2 - spacing, WORLD_SIZE / 2 - spacing, 1, 1, '#99ddff', 'standard'));
                playerFleet.push(new Starship(WORLD_SIZE / 2 + spacing, WORLD_SIZE / 2 - spacing, 1, 1, '#99ddff', 'standard'));
                playerFleet.push(new Starship(WORLD_SIZE / 2 - spacing, WORLD_SIZE / 2 + spacing, 1, 1, '#99ddff', 'standard'));
                playerFleet.push(new Starship(WORLD_SIZE / 2 + spacing, WORLD_SIZE / 2 + spacing, 1, 1, '#99ddff', 'standard'));
            } else if (config === 'destroyer1') {
                // 船種D1つ：独立砲塔射撃ユニット2、大型船体、エンジン2
                const destroyer = new Starship(WORLD_SIZE / 2, WORLD_SIZE / 2, 2, 2, '#99ddff', 'large');
                // 船種Dの独立砲塔設定
                destroyer.weapons.forEach(weapon => {
                    weapon.detectionRange = 180;  // 船種C150の1.2倍
                    weapon.mass = 2;  // 独立砲塔は重量2
                });
                playerFleet.push(destroyer);
            } else if (config === 'destroyer1v6') {
                // 船種D1つ：独立砲塔射撃ユニット2、大型船体、エンジン2
                const destroyer = new Starship(WORLD_SIZE / 2, WORLD_SIZE / 2, 2, 2, '#99ddff', 'large');
                // 船種Dの独立砲塔設定
                destroyer.weapons.forEach(weapon => {
                    weapon.detectionRange = 180;  // 船種C150の1.2倍
                    weapon.mass = 2;  // 独立砲塔は重量2
                });
                playerFleet.push(destroyer);
            } else if (config === 'destroyervsdestroyer') {
                // 駆逐艦1つ（チームA）：独立砲塔射撃ユニット2、大型船体、エンジン2
                const destroyer = new Starship(WORLD_SIZE / 2, WORLD_SIZE - 80, 2, 2, '#99ddff', 'large');
                // 船種Dの独立砲塔設定
                destroyer.weapons.forEach(weapon => {
                    weapon.detectionRange = 180;  // 船種C150の1.2倍
                    weapon.mass = 2;  // 独立砲塔は重量2
                });
                playerFleet.push(destroyer);
            }

            // 敵：シーンに応じた配置
            if (config === 'destroyer1v6') {
                // 敵4機を画面上部に矩形配置（2x2）
                enemies = [];
                const startX = WORLD_SIZE / 2 - 80;
                const startY = 80;
                const spacing = 120;
                for (let row = 0; row < 2; row++) {
                    for (let col = 0; col < 2; col++) {
                        const x = startX + col * spacing;
                        const y = startY + row * spacing;
                        enemies.push(new Starship(x, y, 1, 1, '#ffccdd', true));
                    }
                }
            } else if (config === 'destroyervsdestroyer') {
                // 敵陣営：船種D1機を画面上部中央に配置
                enemies = [];
                const x = WORLD_SIZE / 2;
                const y = 80;
                const destroyer = new Starship(x, y, 2, 2, '#ffccdd', 'large');
                destroyer.weapons.forEach(weapon => {
                    weapon.detectionRange = 180;  // 船種C150の1.2倍
                    weapon.mass = 2;  // 独立砲塔は重量2
                });
                enemies.push(destroyer);
            } else if (config === 'lightcruiser1vsdestroyer2') {
                // 軽巡洋艦 1隻 vs 駆逐艦 2隻
                playerFleet = [];
                enemies = [];

                const playerCruiser = new Starship(
                    WORLD_SIZE / 2,
                    WORLD_SIZE - 120,
                    3,
                    3,
                    '#99ddff',
                    'hull5',
                    IndependentTurretB
                );
                playerFleet.push(playerCruiser);

                const enemyStartX = WORLD_SIZE / 2 - 60;
                const enemyStartY = 80;
                const enemySpacing = 120;
                for (let i = 0; i < 2; i++) {
                    const x = enemyStartX + i * enemySpacing;
                    const destroyer = new Starship(x, enemyStartY, 2, 2, '#ffccdd', 'large');
                    destroyer.weapons.forEach(weapon => {
                        weapon.detectionRange = 180;  // 船種C150の1.2倍
                        weapon.mass = 2;  // 独立砲塔は重量2
                    });
                    enemies.push(destroyer);
                }
            } else if (config === 'corvette8vsdestroyer2') {
                // プレイヤー陣営：船種C 8隻を画面下部に密集配置（4x2）
                playerFleet = [];
                const playerStartX = WORLD_SIZE / 2 - 60;  // 中央からオフセット
                const playerStartY = WORLD_SIZE - 100;
                const playerSpacing = 40;  // 密集配置
                for (let row = 0; row < 2; row++) {
                    for (let col = 0; col < 4; col++) {
                        const x = playerStartX + col * playerSpacing;
                        const y = playerStartY + row * playerSpacing;
                        playerFleet.push(new Starship(x, y, 1, 1, '#99ddff', 'standard'));
                    }
                }
                // 敵陣営：船種D 2隻を画面上部中央に横並び配置
                enemies = [];
                const enemyStartX = WORLD_SIZE / 2 - 60;  // 中央からオフセット
                const enemyStartY = 80;
                const enemySpacing = 120;  // 横並び
                for (let i = 0; i < 2; i++) {
                    const x = enemyStartX + i * enemySpacing;
                    const y = enemyStartY;
                    const destroyer = new Starship(x, y, 2, 2, '#ffccdd', 'large');
                    destroyer.weapons.forEach(weapon => {
                        weapon.detectionRange = 180;  // 船種C150の1.2倍
                        weapon.mass = 2;  // 独立砲塔は重量2
                    });
                    enemies.push(destroyer);
                }
            } else if (config === 'mixed1c8vsmixed1c8') {
                // 3チーム混合艦隊戦（L1D2C8構成）
                // チームA：画面下側（L1D2C8構成）
                playerFleet = [];
                // ライトクルーザー1隻
                const playerLCX = WORLD_SIZE / 2;
                const playerLCY = WORLD_SIZE - 100;
                const playerLC = new Starship(playerLCX, playerLCY, 3, 3, '#99ddff', 'hull5', IndependentTurretB);
                playerFleet.push(playerLC);

                // デストロイヤー2隻
                const playerDStartX = WORLD_SIZE / 2 - 60;
                const playerDStartY = WORLD_SIZE - 200;
                const playerDSpacing = 80;
                for (let i = 0; i < 2; i++) {
                    const x = playerDStartX + i * playerDSpacing;
                    const y = playerDStartY;
                    const destroyer = new Starship(x, y, 2, 2, '#99ddff', 'large');
                    destroyer.weapons.forEach(weapon => {
                        weapon.detectionRange = 180;
                        weapon.mass = 2;
                    });
                    playerFleet.push(destroyer);
                }

                // コルベット8隻（4x2グリッド）
                const playerCStartX = WORLD_SIZE / 2 - 60;
                const playerCStartY = WORLD_SIZE - 280;
                const playerCSpacing = 40;
                for (let row = 0; row < 2; row++) {
                    for (let col = 0; col < 4; col++) {
                        const x = playerCStartX + col * playerCSpacing;
                        const y = playerCStartY + row * playerCSpacing;
                        playerFleet.push(new Starship(x, y, 1, 1, '#99ddff', 'standard'));
                    }
                }

                // チームB：画面左上（L1D2C8構成）
                enemies = [];
                // ライトクルーザー1隻
                const enemyLCX = 100;
                const enemyLCY = 100;
                const enemyLC = new Starship(enemyLCX, enemyLCY, 3, 3, '#ffccdd', 'hull5', IndependentTurretB);
                enemies.push(enemyLC);

                // デストロイヤー2隻
                const enemyDStartX = 80;
                const enemyDStartY = 180;
                const enemyDSpacing = 80;
                for (let i = 0; i < 2; i++) {
                    const x = enemyDStartX;
                    const y = enemyDStartY + i * enemyDSpacing;
                    const destroyer = new Starship(x, y, 2, 2, '#ffccdd', 'large');
                    destroyer.weapons.forEach(weapon => {
                        weapon.detectionRange = 180;
                        weapon.mass = 2;
                    });
                    enemies.push(destroyer);
                }

                // コルベット8隻（4x2グリッド）
                const enemyCStartX = 150;
                const enemyCStartY = 180;
                const enemyCSpacing = 40;
                for (let row = 0; row < 2; row++) {
                    for (let col = 0; col < 4; col++) {
                        const x = enemyCStartX + col * enemyCSpacing;
                        const y = enemyCStartY + row * enemyCSpacing;
                        enemies.push(new Starship(x, y, 1, 1, '#ffccdd', 'standard'));
                    }
                }

                // チームC：画面右上（L1D2C8構成）
                teamC = [];
                // ライトクルーザー1隻
                const teamCLCX = WORLD_SIZE - 100;
                const teamCLCY = 100;
                const teamCLC = new Starship(teamCLCX, teamCLCY, 3, 3, '#ffd24d', 'hull5', IndependentTurretB);
                teamC.push(teamCLC);

                // デストロイヤー2隻
                const teamCDStartX = WORLD_SIZE - 80;
                const teamCDStartY = 180;
                const teamCDSpacing = 80;
                for (let i = 0; i < 2; i++) {
                    const x = teamCDStartX;
                    const y = teamCDStartY + i * teamCDSpacing;
                    const destroyer = new Starship(x, y, 2, 2, '#ffd24d', 'large');
                    destroyer.weapons.forEach(weapon => {
                        weapon.detectionRange = 180;
                        weapon.mass = 2;
                    });
                    teamC.push(destroyer);
                }

                // コルベット8隻（4x2グリッド）
                const teamCCorvetteStartX = WORLD_SIZE - 250;
                const teamCCorvetteStartY = 180;
                const teamCCorvetteSpacing = 40;
                for (let row = 0; row < 2; row++) {
                    for (let col = 0; col < 4; col++) {
                        const x = teamCCorvetteStartX + col * teamCCorvetteSpacing;
                        const y = teamCCorvetteStartY + row * teamCCorvetteSpacing;
                        teamC.push(new Starship(x, y, 1, 1, '#ffd24d', 'standard'));
                    }
                }
            } else if (config === 'mass_d1c8') {
                // 大量テスト：L1D1C8編成を上下に多数配置
                playerFleet = [];
                enemies = [];

                const groupsPerSide = 4;
                const columns = groupsPerSide;
                const rows = 1;
                const maxSpanX = WORLD_SIZE * 0.8;
                const groupSpacingX = columns > 1 ? Math.min(260, maxSpanX / (columns - 1)) : 0;
                const groupSpacingY = 120;

                const topStartX = WORLD_SIZE / 2 - ((columns - 1) * groupSpacingX) / 2;
                const topStartY = 70;
                const bottomStartX = topStartX;
                const bottomStartY = WORLD_SIZE - (rows - 1) * groupSpacingY - 260;

                // チームA（下側）- ライトクルーザー1隻を追加
                const playerLC = new Starship(WORLD_SIZE / 2, WORLD_SIZE - 100, 3, 3, '#99ddff', 'hull5', IndependentTurretB);
                playerFleet.push(playerLC);

                for (let i = 0; i < groupsPerSide; i++) {
                    const col = i % columns;
                    const row = Math.floor(i / columns);
                    const centerX = bottomStartX + col * groupSpacingX;
                    const centerY = bottomStartY + row * groupSpacingY;

                    const destroyer = new Starship(centerX, centerY + 90, 2, 2, '#99ddff', 'large');
                    destroyer.weapons.forEach(weapon => {
                        weapon.detectionRange = 180;
                        weapon.mass = 2;
                    });
                    playerFleet.push(destroyer);

                    const corvetteStartX = centerX - 60;
                    const corvetteStartY = centerY;
                    const corvetteSpacing = 40;
                    for (let r = 0; r < 2; r++) {
                        for (let c = 0; c < 4; c++) {
                            const x = corvetteStartX + c * corvetteSpacing;
                            const y = corvetteStartY + r * corvetteSpacing;
                            playerFleet.push(new Starship(x, y, 1, 1, '#99ddff', 'standard'));
                        }
                    }
                }

                // チームB（上側）- ライトクルーザー1隻を追加
                const enemyLC = new Starship(WORLD_SIZE / 2, 100, 3, 3, '#ffccdd', 'hull5', IndependentTurretB);
                enemies.push(enemyLC);

                for (let i = 0; i < groupsPerSide; i++) {
                    const col = i % columns;
                    const row = Math.floor(i / columns);
                    const centerX = topStartX + col * groupSpacingX;
                    const centerY = topStartY + row * groupSpacingY;

                    const destroyer = new Starship(centerX, centerY, 2, 2, '#ffccdd', 'large');
                    destroyer.weapons.forEach(weapon => {
                        weapon.detectionRange = 180;
                        weapon.mass = 2;
                    });
                    enemies.push(destroyer);

                    const corvetteStartX = centerX - 60;
                    const corvetteStartY = centerY + 70;
                    const corvetteSpacing = 40;
                    for (let r = 0; r < 2; r++) {
                        for (let c = 0; c < 4; c++) {
                            const x = corvetteStartX + c * corvetteSpacing;
                            const y = corvetteStartY + r * corvetteSpacing;
                            enemies.push(new Starship(x, y, 1, 1, '#ffccdd', 'standard'));
                        }
                    }
                }
            } else {
                // 通常：敵4機を4隅配置
                enemies = [
                    new Starship(100, 100, 1, 1, '#ffccdd', true),
                    new Starship(WORLD_SIZE - 100, 100, 1, 1, '#ffccdd', true),
                    new Starship(100, WORLD_SIZE - 100, 1, 1, '#ffccdd', true),
                    new Starship(WORLD_SIZE - 100, WORLD_SIZE - 100, 1, 1, '#ffccdd', true)
                ];
            }

            // 3チーム混合艦隊戦（テストシーン）
            if (config === 'threeway_l1d4c32') {
                mouseControlTeam = 'A';  // マウス操作対象をチームAに設定

                // チームA：画面下側（L1D4C16構成）
                playerFleet = [];
                // ライトクルーザー1隻
                const playerLCX = WORLD_SIZE / 2 + 100;
                const playerLCY = WORLD_SIZE - 100;
                const playerLC = new Starship(playerLCX, playerLCY, 3, 3, '#99ddff', 'hull5', IndependentTurretB);
                playerFleet.push(playerLC);

                // デストロイヤー4隻
                const playerDStartX = WORLD_SIZE / 2 - 50;
                const playerDStartY = WORLD_SIZE - 200;
                const playerDSpacing = 60;
                for (let i = 0; i < 4; i++) {
                    const x = playerDStartX + i * playerDSpacing;
                    const y = playerDStartY;
                    const destroyer = new Starship(x, y, 2, 2, '#99ddff', 'large');
                    destroyer.weapons.forEach(weapon => {
                        weapon.detectionRange = 180;
                        weapon.mass = 2;
                    });
                    playerFleet.push(destroyer);
                }

                // コルベット16隻（4x4グリッド）
                const playerCStartX = WORLD_SIZE / 2 - 20;
                const playerCStartY = WORLD_SIZE - 280;
                const playerCSpacing = 40;
                for (let row = 0; row < 4; row++) {
                    for (let col = 0; col < 4; col++) {
                        const x = playerCStartX + col * playerCSpacing;
                        const y = playerCStartY + row * playerCSpacing;
                        playerFleet.push(new Starship(x, y, 1, 1, '#99ddff', 'standard'));
                    }
                }

                // チームB：画面左上（L1D4C16構成）
                enemies = [];
                // ライトクルーザー1隻
                const enemyLCX = 100;
                const enemyLCY = 100;
                const enemyLC = new Starship(enemyLCX, enemyLCY, 3, 3, '#ffccdd', 'hull5', IndependentTurretB);
                enemies.push(enemyLC);

                // デストロイヤー4隻
                const enemyDStartX = 80;
                const enemyDStartY = 180;
                const enemyDSpacing = 60;
                for (let i = 0; i < 4; i++) {
                    const x = enemyDStartX;
                    const y = enemyDStartY + i * enemyDSpacing;
                    const destroyer = new Starship(x, y, 2, 2, '#ffccdd', 'large');
                    destroyer.weapons.forEach(weapon => {
                        weapon.detectionRange = 180;
                        weapon.mass = 2;
                    });
                    enemies.push(destroyer);
                }

                // コルベット16隻（4x4グリッド）
                const enemyCStartX = 150;
                const enemyCStartY = 180;
                const enemyCSpacing = 40;
                for (let row = 0; row < 4; row++) {
                    for (let col = 0; col < 4; col++) {
                        const x = enemyCStartX + col * enemyCSpacing;
                        const y = enemyCStartY + row * enemyCSpacing;
                        enemies.push(new Starship(x, y, 1, 1, '#ffccdd', 'standard'));
                    }
                }

                // チームC：画面右上（L1D4C16構成）
                teamC = [];
                // ライトクルーザー1隻
                const teamCLCX = WORLD_SIZE - 100;
                const teamCLCY = 100;
                const teamCLC = new Starship(teamCLCX, teamCLCY, 3, 3, '#ffd24d', 'hull5', IndependentTurretB);
                teamC.push(teamCLC);

                // デストロイヤー4隻
                const teamCDStartX = WORLD_SIZE - 80;
                const teamCDStartY = 180;
                const teamCDSpacing = 60;
                for (let i = 0; i < 4; i++) {
                    const x = teamCDStartX;
                    const y = teamCDStartY + i * teamCDSpacing;
                    const destroyer = new Starship(x, y, 2, 2, '#ffd24d', 'large');
                    destroyer.weapons.forEach(weapon => {
                        weapon.detectionRange = 180;
                        weapon.mass = 2;
                    });
                    teamC.push(destroyer);
                }

                // コルベット16隻（4x4グリッド）
                const teamCCorvetteStartX = WORLD_SIZE - 250;
                const teamCCorvetteStartY = 180;
                const teamCCorvetteSpacing = 40;
                for (let row = 0; row < 4; row++) {
                    for (let col = 0; col < 4; col++) {
                        const x = teamCCorvetteStartX + col * teamCCorvetteSpacing;
                        const y = teamCCorvetteStartY + row * teamCCorvetteSpacing;
                        teamC.push(new Starship(x, y, 1, 1, '#ffd24d', 'standard'));
                    }
                }
            }

            // 初期コストと初期シップ数を計算
            initialPlayerCost = playerFleet.reduce((sum, ship) => sum + ship.getCost(), 0);
            initialEnemyCost = enemies.reduce((sum, ship) => sum + ship.getCost(), 0);
            initialTeamCCost = teamC.reduce((sum, ship) => sum + ship.getCost(), 0);
            initialPlayerShipCount = playerFleet.length;
            initialEnemyShipCount = enemies.length;
            initialTeamCShipCount = teamC.length;

            // 弾とパーティクルをリセット
            bullets.length = 0;
            particles.length = 0;

            // ビーコンをリセット
            detectionBeacons.length = 0;
        }

        // 初期化実行（デフォルトはD1C8vsD1C8）
        initializeGame('mixed1c8vsmixed1c8');

        // スター背景
        const stars = [];
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * WORLD_SIZE,
                y: Math.random() * WORLD_SIZE,
                size: Math.random() * 1.5,
                brightness: Math.random() * 0.5 + 0.5
            });
        }
