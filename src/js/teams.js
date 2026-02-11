// @ts-nocheck
// ========================================
// チーム定義
// ========================================
const TEAM_DEFINITIONS = {
    A: {
        id: 'A',
        name: 'チームA',
        alias: '水色チーム',
        colorName: '水色',
        color: '#33b5ff',
        reactsToMouse: true,
        enemies: ['B', 'C']
    },
    B: {
        id: 'B',
        name: 'チームB',
        alias: '桃色チーム',
        colorName: '桃色',
        color: '#ff5fa2',
        reactsToMouse: false,
        enemies: ['A', 'C']
    },
    C: {
        id: 'C',
        name: 'チームC',
        alias: '黄色チーム',
        colorName: '黄色',
        color: '#ffb300',
        reactsToMouse: false,
        enemies: ['A', 'B']
    }
};
const TEAM_IDS = Object.keys(TEAM_DEFINITIONS);
const TEAM_COLORS = {
    A: TEAM_DEFINITIONS.A.color,
    B: TEAM_DEFINITIONS.B.color,
    C: TEAM_DEFINITIONS.C.color
};
function formatTeamLabel(teamId) {
    const team = TEAM_DEFINITIONS[teamId];
    return `${team.name}（${team.colorName}）`;
}
