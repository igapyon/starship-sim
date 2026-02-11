// @ts-nocheck
// ========================================
// ゲーム初期化
// ========================================
let mouseControlTeam = 'A'; // マウス操作対象チーム（デフォルト：チームA）
const teamShips = {
    A: [],
    B: [],
    C: []
};
function setTeamShips(teamId, ships) {
    teamShips[teamId] = ships;
}
const bullets = [];
const particles = [];
let mouseX = WORLD_SIZE / 2;
let mouseY = WORLD_SIZE / 2;
let attackWrecks = false; // 残骸を攻撃するか（デフォルト：しない）
const detectionBeacons = []; // 検出ビーコン配列
let selectedBeaconTeam = 'A'; // 現在選択されているビーコン配置チーム
// チーム統計
const initialCostByTeam = { A: 0, B: 0, C: 0 };
const lostCostByTeam = { A: 0, B: 0, C: 0 };
const initialShipCountByTeam = { A: 0, B: 0, C: 0 };
// ゲーム初期化関数
function initializeGame(config = 'destroyer1') {
    // マウス操作対象をデフォルトでチームAに設定
    mouseControlTeam = 'A';
    // 統計リセット
    for (const teamId of TEAM_IDS) {
        initialCostByTeam[teamId] = 0;
        lostCostByTeam[teamId] = 0;
        initialShipCountByTeam[teamId] = 0;
    }
    // 各陣営を初期化
    setTeamShips('A', []);
    setTeamShips('B', []);
    setTeamShips('C', []);
    if (config === 'weapon1') {
        // 船種C1つ：射撃ユニット1、標準船体
        teamShips.A.push(new Starship(WORLD_SIZE / 2, WORLD_SIZE / 2, 1, 1, TEAM_COLORS.A, 'hullA'));
    }
    else if (config === 'weapon4') {
        // 船種C4つ：それぞれ射撃ユニット1、標準船体
        const spacing = 60;
        teamShips.A.push(new Starship(WORLD_SIZE / 2 - spacing, WORLD_SIZE / 2 - spacing, 1, 1, TEAM_COLORS.A, 'hullA'));
        teamShips.A.push(new Starship(WORLD_SIZE / 2 + spacing, WORLD_SIZE / 2 - spacing, 1, 1, TEAM_COLORS.A, 'hullA'));
        teamShips.A.push(new Starship(WORLD_SIZE / 2 - spacing, WORLD_SIZE / 2 + spacing, 1, 1, TEAM_COLORS.A, 'hullA'));
        teamShips.A.push(new Starship(WORLD_SIZE / 2 + spacing, WORLD_SIZE / 2 + spacing, 1, 1, TEAM_COLORS.A, 'hullA'));
    }
    else if (config === 'destroyer1') {
        // 船種D1つ：独立砲塔射撃ユニット2、大型船体、エンジン2
        const destroyer = new Starship(WORLD_SIZE / 2, WORLD_SIZE / 2, 2, 2, TEAM_COLORS.A, 'hullB');
        // 船種Dの独立砲塔設定
        destroyer.weapons.forEach(weapon => {
            weapon.maxRange = 270; // 独立砲塔Aの設計射程
        });
        teamShips.A.push(destroyer);
    }
    else if (config === 'destroyer1v6') {
        // 船種D1つ：独立砲塔射撃ユニット2、大型船体、エンジン2
        const destroyer = new Starship(WORLD_SIZE / 2, WORLD_SIZE / 2, 2, 2, TEAM_COLORS.A, 'hullB');
        // 船種Dの独立砲塔設定
        destroyer.weapons.forEach(weapon => {
            weapon.maxRange = 270; // 独立砲塔Aの設計射程
        });
        teamShips.A.push(destroyer);
    }
    else if (config === 'destroyervsdestroyer') {
        // 駆逐艦1つ（チームA）：独立砲塔射撃ユニット2、大型船体、エンジン2
        const destroyer = new Starship(WORLD_SIZE / 2, WORLD_SIZE - 80, 2, 2, TEAM_COLORS.A, 'hullB');
        // 船種Dの独立砲塔設定
        destroyer.weapons.forEach(weapon => {
            weapon.maxRange = 270; // 独立砲塔Aの設計射程
        });
        teamShips.A.push(destroyer);
    }
    // 敵：シーンに応じた配置
    if (config === 'destroyer1v6') {
        // 敵4機を画面上部に矩形配置（2x2）
        setTeamShips('B', []);
        const startX = WORLD_SIZE / 2 - 80;
        const startY = 80;
        const spacing = 120;
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                const x = startX + col * spacing;
                const y = startY + row * spacing;
                teamShips.B.push(new Starship(x, y, 1, 1, TEAM_COLORS.B, true));
            }
        }
    }
    else if (config === 'destroyervsdestroyer') {
        // 敵陣営：船種D1機を画面上部中央に配置
        setTeamShips('B', []);
        const x = WORLD_SIZE / 2;
        const y = 80;
        const destroyer = new Starship(x, y, 2, 2, TEAM_COLORS.B, 'hullB');
        destroyer.weapons.forEach(weapon => {
            weapon.maxRange = 270; // 独立砲塔Aの設計射程
        });
        teamShips.B.push(destroyer);
    }
    else if (config === 'lightcruiser1vsdestroyer2') {
        // 軽巡洋艦 1隻 vs 駆逐艦 2隻
        setTeamShips('A', []);
        setTeamShips('B', []);
        const playerCruiser = new Starship(WORLD_SIZE / 2, WORLD_SIZE - 120, 3, 3, TEAM_COLORS.A, 'hullC', IndependentTurretC);
        teamShips.A.push(playerCruiser);
        const enemyStartX = WORLD_SIZE / 2 - 60;
        const enemyStartY = 80;
        const enemySpacing = 120;
        for (let i = 0; i < 2; i++) {
            const x = enemyStartX + i * enemySpacing;
            const destroyer = new Starship(x, enemyStartY, 2, 2, TEAM_COLORS.B, 'hullB');
            destroyer.weapons.forEach(weapon => {
                weapon.maxRange = 270; // 独立砲塔Aの設計射程
            });
            teamShips.B.push(destroyer);
        }
    }
    else if (config === 'corvette8vsdestroyer2') {
        // プレイヤー陣営：船種C 8隻を画面下部に密集配置（4x2）
        setTeamShips('A', []);
        const playerStartX = WORLD_SIZE / 2 - 60; // 中央からオフセット
        const playerStartY = WORLD_SIZE - 100;
        const playerSpacing = 40; // 密集配置
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
                const x = playerStartX + col * playerSpacing;
                const y = playerStartY + row * playerSpacing;
                teamShips.A.push(new Starship(x, y, 1, 1, TEAM_COLORS.A, 'hullA'));
            }
        }
        // 敵陣営：船種D 2隻を画面上部中央に横並び配置
        setTeamShips('B', []);
        const enemyStartX = WORLD_SIZE / 2 - 60; // 中央からオフセット
        const enemyStartY = 80;
        const enemySpacing = 120; // 横並び
        for (let i = 0; i < 2; i++) {
            const x = enemyStartX + i * enemySpacing;
            const y = enemyStartY;
            const destroyer = new Starship(x, y, 2, 2, TEAM_COLORS.B, 'hullB');
            destroyer.weapons.forEach(weapon => {
                weapon.maxRange = 270; // 独立砲塔Aの設計射程
            });
            teamShips.B.push(destroyer);
        }
    }
    else if (config === 'mixed1c8vsmixed1c8') {
        // 3チーム混合艦隊戦（L1D2C8構成）
        // チームA：画面下側（L1D2C8構成）
        setTeamShips('A', []);
        // ライトクルーザー1隻
        const playerLCX = WORLD_SIZE / 2;
        const playerLCY = WORLD_SIZE - 80;
        const playerLC = new Starship(playerLCX, playerLCY, 3, 3, TEAM_COLORS.A, 'hullC', IndependentTurretC);
        teamShips.A.push(playerLC);
        // デストロイヤー2隻
        const playerDStartX = WORLD_SIZE / 2 - 60;
        const playerDStartY = WORLD_SIZE - 180;
        const playerDSpacing = 80;
        for (let i = 0; i < 2; i++) {
            const x = playerDStartX + i * playerDSpacing;
            const y = playerDStartY;
            const destroyer = new Starship(x, y, 2, 2, TEAM_COLORS.A, 'hullB');
            destroyer.weapons.forEach(weapon => {
                weapon.maxRange = 270; // 独立砲塔Aの設計射程
            });
            teamShips.A.push(destroyer);
        }
        // コルベット8隻（4x2グリッド）
        const playerCStartX = WORLD_SIZE / 2 - 60;
        const playerCStartY = WORLD_SIZE - 260;
        const playerCSpacing = 40;
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
                const x = playerCStartX + col * playerCSpacing;
                const y = playerCStartY + row * playerCSpacing;
                teamShips.A.push(new Starship(x, y, 1, 1, TEAM_COLORS.A, 'hullA'));
            }
        }
        // チームB：画面左上（L1D2C8構成）
        setTeamShips('B', []);
        // ライトクルーザー1隻
        const enemyLCX = 100;
        const enemyLCY = 100;
        const enemyLC = new Starship(enemyLCX, enemyLCY, 3, 3, TEAM_COLORS.B, 'hullC', IndependentTurretC);
        teamShips.B.push(enemyLC);
        // デストロイヤー2隻
        const enemyDStartX = 80;
        const enemyDStartY = 180;
        const enemyDSpacing = 80;
        for (let i = 0; i < 2; i++) {
            const x = enemyDStartX;
            const y = enemyDStartY + i * enemyDSpacing;
            const destroyer = new Starship(x, y, 2, 2, TEAM_COLORS.B, 'hullB');
            destroyer.weapons.forEach(weapon => {
                weapon.maxRange = 270; // 独立砲塔Aの設計射程
            });
            teamShips.B.push(destroyer);
        }
        // コルベット8隻（4x2グリッド）
        const enemyCStartX = 150;
        const enemyCStartY = 180;
        const enemyCSpacing = 40;
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
                const x = enemyCStartX + col * enemyCSpacing;
                const y = enemyCStartY + row * enemyCSpacing;
                teamShips.B.push(new Starship(x, y, 1, 1, TEAM_COLORS.B, 'hullA'));
            }
        }
        // チームC：画面右上（L1D2C8構成）
        setTeamShips('C', []);
        // ライトクルーザー1隻
        const teamCLCX = WORLD_SIZE - 100;
        const teamCLCY = 100;
        const teamCLC = new Starship(teamCLCX, teamCLCY, 3, 3, TEAM_COLORS.C, 'hullC', IndependentTurretC);
        teamShips.C.push(teamCLC);
        // デストロイヤー2隻
        const teamCDStartX = WORLD_SIZE - 80;
        const teamCDStartY = 180;
        const teamCDSpacing = 80;
        for (let i = 0; i < 2; i++) {
            const x = teamCDStartX;
            const y = teamCDStartY + i * teamCDSpacing;
            const destroyer = new Starship(x, y, 2, 2, TEAM_COLORS.C, 'hullB');
            destroyer.weapons.forEach(weapon => {
                weapon.maxRange = 270; // 独立砲塔Aの設計射程
            });
            teamShips.C.push(destroyer);
        }
        // コルベット8隻（4x2グリッド）
        const teamCCorvetteStartX = WORLD_SIZE - 250;
        const teamCCorvetteStartY = 180;
        const teamCCorvetteSpacing = 40;
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
                const x = teamCCorvetteStartX + col * teamCCorvetteSpacing;
                const y = teamCCorvetteStartY + row * teamCCorvetteSpacing;
                teamShips.C.push(new Starship(x, y, 1, 1, TEAM_COLORS.C, 'hullA'));
            }
        }
    }
    else if (config === 'mass_d1c8') {
        // 大量テスト：L1D1C8編成を上下に多数配置
        setTeamShips('A', []);
        setTeamShips('B', []);
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
        const playerLC = new Starship(WORLD_SIZE / 2, WORLD_SIZE - 100, 3, 3, TEAM_COLORS.A, 'hullC', IndependentTurretC);
        teamShips.A.push(playerLC);
        for (let i = 0; i < groupsPerSide; i++) {
            const col = i % columns;
            const row = Math.floor(i / columns);
            const centerX = bottomStartX + col * groupSpacingX;
            const centerY = bottomStartY + row * groupSpacingY;
            const destroyer = new Starship(centerX, centerY + 90, 2, 2, TEAM_COLORS.A, 'hullB');
            destroyer.weapons.forEach(weapon => {
                weapon.maxRange = 270; // 独立砲塔Aの設計射程
            });
            teamShips.A.push(destroyer);
            const corvetteStartX = centerX - 60;
            const corvetteStartY = centerY;
            const corvetteSpacing = 40;
            for (let r = 0; r < 2; r++) {
                for (let c = 0; c < 4; c++) {
                    const x = corvetteStartX + c * corvetteSpacing;
                    const y = corvetteStartY + r * corvetteSpacing;
                    teamShips.A.push(new Starship(x, y, 1, 1, TEAM_COLORS.A, 'hullA'));
                }
            }
        }
        // チームB（上側）- ライトクルーザー1隻を追加
        const enemyLC = new Starship(WORLD_SIZE / 2, 100, 3, 3, TEAM_COLORS.B, 'hullC', IndependentTurretC);
        teamShips.B.push(enemyLC);
        for (let i = 0; i < groupsPerSide; i++) {
            const col = i % columns;
            const row = Math.floor(i / columns);
            const centerX = topStartX + col * groupSpacingX;
            const centerY = topStartY + row * groupSpacingY;
            const destroyer = new Starship(centerX, centerY, 2, 2, TEAM_COLORS.B, 'hullB');
            destroyer.weapons.forEach(weapon => {
                weapon.maxRange = 270; // 独立砲塔Aの設計射程
            });
            teamShips.B.push(destroyer);
            const corvetteStartX = centerX - 60;
            const corvetteStartY = centerY + 70;
            const corvetteSpacing = 40;
            for (let r = 0; r < 2; r++) {
                for (let c = 0; c < 4; c++) {
                    const x = corvetteStartX + c * corvetteSpacing;
                    const y = corvetteStartY + r * corvetteSpacing;
                    teamShips.B.push(new Starship(x, y, 1, 1, TEAM_COLORS.B, 'hullA'));
                }
            }
        }
    }
    else {
        // 通常：敵4機を4隅配置
        setTeamShips('B', [
            new Starship(100, 100, 1, 1, TEAM_COLORS.B, true),
            new Starship(WORLD_SIZE - 100, 100, 1, 1, TEAM_COLORS.B, true),
            new Starship(100, WORLD_SIZE - 100, 1, 1, TEAM_COLORS.B, true),
            new Starship(WORLD_SIZE - 100, WORLD_SIZE - 100, 1, 1, TEAM_COLORS.B, true)
        ]);
    }
    // 3チーム混合艦隊戦（テストシーン）
    if (config === 'threeway_l1d4c32') {
        mouseControlTeam = 'A'; // マウス操作対象をチームAに設定
        // チームA：画面下側（L1D4C16構成）
        setTeamShips('A', []);
        // ライトクルーザー1隻
        const playerLCX = WORLD_SIZE / 2 + 100;
        const playerLCY = WORLD_SIZE - 100;
        const playerLC = new Starship(playerLCX, playerLCY, 3, 3, TEAM_COLORS.A, 'hullC', IndependentTurretC);
        teamShips.A.push(playerLC);
        // デストロイヤー4隻
        const playerDStartX = WORLD_SIZE / 2 - 50;
        const playerDStartY = WORLD_SIZE - 200;
        const playerDSpacing = 60;
        for (let i = 0; i < 4; i++) {
            const x = playerDStartX + i * playerDSpacing;
            const y = playerDStartY;
            const destroyer = new Starship(x, y, 2, 2, TEAM_COLORS.A, 'hullB');
            destroyer.weapons.forEach(weapon => {
                weapon.maxRange = 270; // 独立砲塔Aの設計射程
            });
            teamShips.A.push(destroyer);
        }
        // コルベット16隻（4x4グリッド）
        const playerCStartX = WORLD_SIZE / 2 - 20;
        const playerCStartY = WORLD_SIZE - 280;
        const playerCSpacing = 40;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const x = playerCStartX + col * playerCSpacing;
                const y = playerCStartY + row * playerCSpacing;
                teamShips.A.push(new Starship(x, y, 1, 1, TEAM_COLORS.A, 'hullA'));
            }
        }
        // チームB：画面左上（L1D4C16構成）
        setTeamShips('B', []);
        // ライトクルーザー1隻
        const enemyLCX = 70;
        const enemyLCY = 80;
        const enemyLC = new Starship(enemyLCX, enemyLCY, 3, 3, TEAM_COLORS.B, 'hullC', IndependentTurretC);
        teamShips.B.push(enemyLC);
        // デストロイヤー4隻
        const enemyDStartX = 55;
        const enemyDStartY = 140;
        const enemyDSpacing = 60;
        for (let i = 0; i < 4; i++) {
            const x = enemyDStartX;
            const y = enemyDStartY + i * enemyDSpacing;
            const destroyer = new Starship(x, y, 2, 2, TEAM_COLORS.B, 'hullB');
            destroyer.weapons.forEach(weapon => {
                weapon.maxRange = 270; // 独立砲塔Aの設計射程
            });
            teamShips.B.push(destroyer);
        }
        // コルベット16隻（4x4グリッド）
        const enemyCStartX = 105;
        const enemyCStartY = 140;
        const enemyCSpacing = 40;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const x = enemyCStartX + col * enemyCSpacing;
                const y = enemyCStartY + row * enemyCSpacing;
                teamShips.B.push(new Starship(x, y, 1, 1, TEAM_COLORS.B, 'hullA'));
            }
        }
        // チームC：画面右上（L1D4C16構成）
        setTeamShips('C', []);
        // ライトクルーザー1隻
        const teamCLCX = WORLD_SIZE - 70;
        const teamCLCY = 80;
        const teamCLC = new Starship(teamCLCX, teamCLCY, 3, 3, TEAM_COLORS.C, 'hullC', IndependentTurretC);
        teamShips.C.push(teamCLC);
        // デストロイヤー4隻
        const teamCDStartX = WORLD_SIZE - 55;
        const teamCDStartY = 140;
        const teamCDSpacing = 60;
        for (let i = 0; i < 4; i++) {
            const x = teamCDStartX;
            const y = teamCDStartY + i * teamCDSpacing;
            const destroyer = new Starship(x, y, 2, 2, TEAM_COLORS.C, 'hullB');
            destroyer.weapons.forEach(weapon => {
                weapon.maxRange = 270; // 独立砲塔Aの設計射程
            });
            teamShips.C.push(destroyer);
        }
        // コルベット16隻（4x4グリッド）
        const teamCCorvetteStartX = WORLD_SIZE - 205;
        const teamCCorvetteStartY = 140;
        const teamCCorvetteSpacing = 40;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const x = teamCCorvetteStartX + col * teamCCorvetteSpacing;
                const y = teamCCorvetteStartY + row * teamCCorvetteSpacing;
                teamShips.C.push(new Starship(x, y, 1, 1, TEAM_COLORS.C, 'hullA'));
            }
        }
    }
    // 初期コストと初期シップ数を計算
    for (const teamId of TEAM_IDS) {
        initialCostByTeam[teamId] = teamShips[teamId].reduce((sum, ship) => sum + ship.getCost(), 0);
        initialShipCountByTeam[teamId] = teamShips[teamId].length;
    }
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
