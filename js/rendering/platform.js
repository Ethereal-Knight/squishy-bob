export function drawPlatform(ctx, p) {
    ctx.fillStyle = "#111a2e";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 8;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    ctx.shadowBlur = 0;
}

export function drawMovingPlatform(ctx, mp) {
    ctx.save();
    let platGrad = ctx.createLinearGradient(mp.x, mp.y, mp.x, mp.y + mp.h);
    platGrad.addColorStop(0, "#ffe600");
    platGrad.addColorStop(0.3, "#ffaa00");
    platGrad.addColorStop(1, "#773a00");
    ctx.fillStyle = platGrad;
    ctx.fillRect(mp.x, mp.y, mp.w, mp.h);
    ctx.strokeStyle = "#ffe600";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#ffaa00";
    ctx.shadowBlur = 12;
    ctx.strokeRect(mp.x, mp.y, mp.w, mp.h);
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 6;
    ctx.fillRect(mp.x, mp.y, 4, mp.h);
    ctx.fillRect(mp.x + mp.w - 4, mp.y, 4, mp.h);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
    ctx.lineWidth = 2;
    let arrowOffset = (Date.now() / 30) % 16;
    let isMovingLeft = mp.vx < 0 || mp.vy < 0;
    for (let cx = mp.x + 8; cx < mp.x + mp.w - 8; cx += 16) {
        let drawX = isMovingLeft ? cx - arrowOffset : cx + arrowOffset;
        if (drawX >= mp.x + 6 && drawX <= mp.x + mp.w - 12) {
            ctx.beginPath();
            let dir = isMovingLeft ? -1 : 1;
            ctx.moveTo(drawX, mp.y + 4);
            ctx.lineTo(drawX + (4 * dir), mp.y + mp.h / 2);
            ctx.lineTo(drawX, mp.y + mp.h - 4);
            ctx.stroke();
        }
    }
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 4;
    ctx.fillRect(mp.x + 4, mp.y, mp.w - 8, 2);
    ctx.restore();
}
