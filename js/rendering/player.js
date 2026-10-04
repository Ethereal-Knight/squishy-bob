export function drawSquishyBob(ctx, player) {
    ctx.save();
    let centerX = player.x + player.w / 2;
    let centerY = player.y + player.h / 2;
    ctx.translate(centerX, centerY);
    if (player.isFlipping) {
        player.flipAngle += 0.32;
        if (player.flipAngle >= Math.PI * 2) {
            player.flipAngle = 0;
            player.isFlipping = false;
        }
        ctx.rotate(player.flipAngle);
    }
    let rx = player.renderW / 2;
    let ry = player.renderH / 2;
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 22;
    let bodyGrad = ctx.createLinearGradient(-rx, -ry, rx, ry);
    bodyGrad.addColorStop(0, "#70ffff");
    bodyGrad.addColorStop(0.5, "#00f0ff");
    bodyGrad.addColorStop(1, "#0077ff");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-rx, -ry, player.renderW, player.renderH, [Math.min(rx, ry) * 0.85]);
    ctx.fill();
    let corePulse = Math.sin(Date.now() / 150) * 1.5;
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, ry * 0.2, Math.max(1, Math.min(rx, ry) * 0.22 + corePulse), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(-rx * 0.35, -ry * 0.4, rx * 0.35, ry * 0.2, -0.2, 0, Math.PI * 2);
    ctx.fill();
    if (!player.isFlipping) {
        let lookX = (player.vx / player.speed) * 3;
        let lookY = (player.vy / player.jumpPower) * 2;
        let eyeOffset = rx * 0.38;
        let eyeY = -ry * 0.15 + lookY;
        ctx.strokeStyle = "#030814";
        ctx.fillStyle = "#030814";
        ctx.lineWidth = 2.5;
        if (player.isSquishingFlat || player.isBlinking) {
            ctx.beginPath();
            ctx.moveTo(-eyeOffset + lookX - 4, eyeY);
            ctx.lineTo(-eyeOffset + lookX + 4, eyeY);
            ctx.moveTo(eyeOffset + lookX - 4, eyeY);
            ctx.lineTo(eyeOffset + lookX + 4, eyeY);
            ctx.stroke();
        } else if (player.vy < -3) {
            ctx.beginPath();
            ctx.arc(-eyeOffset + lookX, eyeY - 2, 4.5, 0, Math.PI * 2);
            ctx.arc(eyeOffset + lookX, eyeY - 2, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#00f0ff";
            ctx.beginPath();
            ctx.arc(-eyeOffset + lookX + 1, eyeY - 3, 1.8, 0, Math.PI * 2);
            ctx.arc(eyeOffset + lookX + 1, eyeY - 3, 1.8, 0, Math.PI * 2);
            ctx.fill();
        } else if (player.vy > 4) {
            ctx.beginPath();
            ctx.arc(-eyeOffset + lookX, eyeY, 3.5, Math.PI, 0);
            ctx.arc(eyeOffset + lookX, eyeY, 3.5, Math.PI, 0);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(-eyeOffset + lookX, eyeY, 3.5, 0, Math.PI * 2);
            ctx.arc(eyeOffset + lookX, eyeY, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(-eyeOffset + lookX - 1, eyeY - 1, 1.2, 0, Math.PI * 2);
            ctx.arc(-eyeOffset + lookX - 1, eyeY - 1, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}
