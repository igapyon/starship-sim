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
function spawnFormation(teamId, formation) {
    if (formation.kind === 'single') {
        teamShips[teamId].push(createShipFromPreset(teamId, formation.x, formation.y, formation.unit, formation.overrides));
        return;
    }
    if (formation.kind === 'line') {
        for (let i = 0; i < formation.count; i++) {
            const x = formation.startX + formation.stepX * i;
            const y = formation.startY + formation.stepY * i;
            teamShips[teamId].push(createShipFromPreset(teamId, x, y, formation.unit, formation.overrides));
        }
        return;
    }
    if (formation.kind === 'grid') {
        for (let row = 0; row < formation.rows; row++) {
            for (let col = 0; col < formation.cols; col++) {
                const x = formation.startX + formation.stepX * col;
                const y = formation.startY + formation.stepY * row;
                teamShips[teamId].push(createShipFromPreset(teamId, x, y, formation.unit, formation.overrides));
            }
        }
    }
}
function buildMassD1C8Groups(side) {
    const groupsPerSide = 4;
    const columns = groupsPerSide;
    const rows = 1;
    const maxSpanX = WORLD_SIZE * 0.8;
    const groupSpacingX = columns > 1 ? Math.min(260, maxSpanX / (columns - 1)) : 0;
    const groupSpacingY = 120;
    const startX = WORLD_SIZE / 2 - ((columns - 1) * groupSpacingX) / 2;
    const startY = side === 'top' ? 70 : WORLD_SIZE - (rows - 1) * groupSpacingY - 260;
    const groups = [];
    for (let i = 0; i < groupsPerSide; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const centerX = startX + col * groupSpacingX;
        const centerY = startY + row * groupSpacingY;
        const destroyerY = side === 'top' ? centerY : centerY + 90;
        const corvetteBaseY = side === 'top' ? centerY + 70 : centerY;
        groups.push({
            kind: 'single',
            unit: 'destroyer',
            x: centerX,
            y: destroyerY
        });
        groups.push({
            kind: 'grid',
            unit: 'corvette',
            startX: centerX - 60,
            startY: corvetteBaseY,
            rows: 2,
            cols: 4,
            stepX: 40,
            stepY: 40
        });
    }
    return groups;
}
function buildSceneDefs() {
    return {
        weapon1: {
            mouseControlTeam: 'A',
            teams: {
                A: [{ kind: 'single', unit: 'corvette', x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 }],
                B: [],
                C: []
            }
        },
        weapon4: {
            mouseControlTeam: 'A',
            teams: {
                A: [{
                        kind: 'grid',
                        unit: 'corvette',
                        startX: WORLD_SIZE / 2 - 60,
                        startY: WORLD_SIZE / 2 - 60,
                        rows: 2,
                        cols: 2,
                        stepX: 120,
                        stepY: 120
                    }],
                B: [],
                C: []
            }
        },
        destroyer1: {
            mouseControlTeam: 'A',
            teams: {
                A: [{ kind: 'single', unit: 'destroyer', x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 }],
                B: [],
                C: []
            }
        },
        destroyer1v6: {
            mouseControlTeam: 'A',
            teams: {
                A: [{ kind: 'single', unit: 'destroyer', x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 }],
                B: [{
                        kind: 'grid',
                        unit: 'corvette',
                        startX: WORLD_SIZE / 2 - 80,
                        startY: 80,
                        rows: 2,
                        cols: 2,
                        stepX: 120,
                        stepY: 120
                    }],
                C: []
            }
        },
        destroyervsdestroyer: {
            mouseControlTeam: 'A',
            teams: {
                A: [{ kind: 'single', unit: 'destroyer', x: WORLD_SIZE / 2, y: WORLD_SIZE - 80 }],
                B: [{ kind: 'single', unit: 'destroyer', x: WORLD_SIZE / 2, y: 80 }],
                C: []
            }
        },
        lightcruiser1vsdestroyer2: {
            mouseControlTeam: 'A',
            teams: {
                A: [{ kind: 'single', unit: 'lightCruiser', x: WORLD_SIZE / 2, y: WORLD_SIZE - 120 }],
                B: [{
                        kind: 'line',
                        unit: 'destroyer',
                        startX: WORLD_SIZE / 2 - 60,
                        startY: 80,
                        count: 2,
                        stepX: 120,
                        stepY: 0
                    }],
                C: []
            }
        },
        corvette8vsdestroyer2: {
            mouseControlTeam: 'A',
            teams: {
                A: [{
                        kind: 'grid',
                        unit: 'corvette',
                        startX: WORLD_SIZE / 2 - 60,
                        startY: WORLD_SIZE - 100,
                        rows: 2,
                        cols: 4,
                        stepX: 40,
                        stepY: 40
                    }],
                B: [{
                        kind: 'line',
                        unit: 'destroyer',
                        startX: WORLD_SIZE / 2 - 60,
                        startY: 80,
                        count: 2,
                        stepX: 120,
                        stepY: 0
                    }],
                C: []
            }
        },
        mixed1c8vsmixed1c8: {
            mouseControlTeam: 'A',
            teams: {
                A: [
                    { kind: 'single', unit: 'lightCruiser', x: WORLD_SIZE / 2, y: WORLD_SIZE - 80 },
                    { kind: 'line', unit: 'destroyer', startX: WORLD_SIZE / 2 - 60, startY: WORLD_SIZE - 180, count: 2, stepX: 80, stepY: 0 },
                    { kind: 'grid', unit: 'corvette', startX: WORLD_SIZE / 2 - 60, startY: WORLD_SIZE - 260, rows: 2, cols: 4, stepX: 40, stepY: 40 }
                ],
                B: [
                    { kind: 'single', unit: 'lightCruiser', x: 100, y: 100 },
                    { kind: 'line', unit: 'destroyer', startX: 80, startY: 180, count: 2, stepX: 0, stepY: 80 },
                    { kind: 'grid', unit: 'corvette', startX: 150, startY: 180, rows: 2, cols: 4, stepX: 40, stepY: 40 }
                ],
                C: [
                    { kind: 'single', unit: 'lightCruiser', x: WORLD_SIZE - 100, y: 100 },
                    { kind: 'line', unit: 'destroyer', startX: WORLD_SIZE - 80, startY: 180, count: 2, stepX: 0, stepY: 80 },
                    { kind: 'grid', unit: 'corvette', startX: WORLD_SIZE - 250, startY: 180, rows: 2, cols: 4, stepX: 40, stepY: 40 }
                ]
            }
        },
        mass_d1c8: {
            mouseControlTeam: 'A',
            teams: {
                A: [
                    { kind: 'single', unit: 'lightCruiser', x: WORLD_SIZE / 2, y: WORLD_SIZE - 100 },
                    ...buildMassD1C8Groups('bottom')
                ],
                B: [
                    { kind: 'single', unit: 'lightCruiser', x: WORLD_SIZE / 2, y: 100 },
                    ...buildMassD1C8Groups('top')
                ],
                C: []
            }
        },
        threeway_l1d4c32: {
            mouseControlTeam: 'A',
            teams: {
                A: [
                    { kind: 'single', unit: 'lightCruiser', x: WORLD_SIZE / 2 + 100, y: WORLD_SIZE - 100 },
                    { kind: 'line', unit: 'destroyer', startX: WORLD_SIZE / 2 - 50, startY: WORLD_SIZE - 200, count: 4, stepX: 60, stepY: 0 },
                    { kind: 'grid', unit: 'corvette', startX: WORLD_SIZE / 2 - 20, startY: WORLD_SIZE - 280, rows: 4, cols: 4, stepX: 40, stepY: 40 }
                ],
                B: [
                    { kind: 'single', unit: 'lightCruiser', x: 70, y: 80 },
                    { kind: 'line', unit: 'destroyer', startX: 55, startY: 140, count: 4, stepX: 0, stepY: 60 },
                    { kind: 'grid', unit: 'corvette', startX: 105, startY: 140, rows: 4, cols: 4, stepX: 40, stepY: 40 }
                ],
                C: [
                    { kind: 'single', unit: 'lightCruiser', x: WORLD_SIZE - 70, y: 80 },
                    { kind: 'line', unit: 'destroyer', startX: WORLD_SIZE - 55, startY: 140, count: 4, stepX: 0, stepY: 60 },
                    { kind: 'grid', unit: 'corvette', startX: WORLD_SIZE - 205, startY: 140, rows: 4, cols: 4, stepX: 40, stepY: 40 }
                ]
            }
        },
        default: {
            mouseControlTeam: 'A',
            teams: {
                A: [],
                B: [
                    { kind: 'single', unit: 'corvette', x: 100, y: 100 },
                    { kind: 'single', unit: 'corvette', x: WORLD_SIZE - 100, y: 100 },
                    { kind: 'single', unit: 'corvette', x: 100, y: WORLD_SIZE - 100 },
                    { kind: 'single', unit: 'corvette', x: WORLD_SIZE - 100, y: WORLD_SIZE - 100 }
                ],
                C: []
            }
        }
    };
}
// ゲーム初期化関数
function initializeGame(config = 'destroyer1') {
    // 統計リセット
    for (const teamId of TEAM_IDS) {
        initialCostByTeam[teamId] = 0;
        lostCostByTeam[teamId] = 0;
        initialShipCountByTeam[teamId] = 0;
    }
    // 各陣営を初期化
    for (const teamId of TEAM_IDS) {
        setTeamShips(teamId, []);
    }
    const sceneDefs = buildSceneDefs();
    const scene = sceneDefs[config] || sceneDefs.default;
    mouseControlTeam = scene.mouseControlTeam || 'A';
    for (const teamId of TEAM_IDS) {
        const formations = scene.teams[teamId] || [];
        formations.forEach((formation) => spawnFormation(teamId, formation));
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
