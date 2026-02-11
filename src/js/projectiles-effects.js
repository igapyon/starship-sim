// @ts-nocheck
// ========================================
// 弾丸クラス
// ========================================
class Bullet {
    constructor(x, y, vx, vy, originX, originY, damage, maxRange, color = TEAM_COLORS.A) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.originX = originX;
        this.originY = originY;
        this.damage = damage;
        this.maxRange = maxRange;
        this.color = color;
        this.life = 300;
        this.size = 3;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.x < -50 || this.x > WORLD_SIZE + 50 ||
            this.y < -50 || this.y > WORLD_SIZE + 50) {
            this.life = 0;
        }
        const dx = this.x - this.originX;
        const dy = this.y - this.originY;
        const distance = Math.hypot(dx, dy);
        if (distance > this.maxRange) {
            this.life = 0;
        }
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
    isAlive() {
        return this.life > 0;
    }
    collidesWith(ship) {
        const dx = this.x - ship.x;
        const dy = this.y - ship.y;
        const distance = Math.hypot(dx, dy);
        return distance < this.size + ship.getCollisionRadius();
    }
}
// ========================================
// パーティクルクラス
// ========================================
class Particle {
    constructor(x, y, vx, vy, color, size = 3) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = 30;
        this.maxLife = 30;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // 重力
        this.life--;
    }
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
    isAlive() {
        return this.life > 0;
    }
}
// ========================================
// 検出ビーコンクラス
// ========================================
class DetectionBeacon {
    constructor(x, y, teamId, range = 150, duration = 180) {
        this.x = x;
        this.y = y;
        this.teamId = teamId;
        this.range = range; // 検出範囲（150px、船種C相当）
        this.life = duration; // フレーム数（約3秒）
        this.maxLife = duration;
    }
    contains(ship) {
        const dx = ship.x - this.x;
        const dy = ship.y - this.y;
        const distance = Math.hypot(dx, dy);
        return distance < this.range;
    }
    update() {
        this.life--;
        return this.life > 0;
    }
    draw() {
        const alpha = this.life / this.maxLife;
        const color = TEAM_DEFINITIONS[this.teamId].color;
        // 16進数カラーをrgbaに変換
        const r = parseInt(color.substr(1, 2), 16);
        const g = parseInt(color.substr(3, 2), 16);
        const b = parseInt(color.substr(5, 2), 16);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();
        // 中心マーク
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    isAlive() {
        return this.life > 0;
    }
}
