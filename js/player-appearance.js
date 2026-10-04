export function updatePlayerAppearance(player) {
    let wiggle = 0;
    if (Math.abs(player.vx) > 0.5 && !player.isSquishingFlat && player.grounded) {
        wiggle = Math.sin(Date.now() / 60) * (Math.abs(player.vx) * 0.4);
    }
    if (player.isSquishingFlat) {
        player.renderW = 38 + Math.abs(player.vx) * 0.5;
        player.renderH = 12;
    } else {
        player.renderW = player.w - (Math.abs(player.vy) * 0.3) + (Math.abs(player.vx) * 0.4) + wiggle;
        player.renderH = player.h + (Math.abs(player.vy) * 0.5) - (Math.abs(player.vx) * 0.2) - wiggle;
    }
    player.blinkTimer--;
    if (player.blinkTimer <= 0) {
        player.isBlinking = true;
        if (player.blinkTimer < -8) {
            player.isBlinking = false;
            player.blinkTimer = Math.random() * 150 + 60;
        }
    }
}
