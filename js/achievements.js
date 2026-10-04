export function createAchievements() {
    return [
        { id: "first", name: "System Boot", desc: "Beat Level 1", unlocked: false },
        { id: "maze", name: "Maze Navigator", desc: "Escape the Winding Cyber Labyrinth", unlocked: false },
        { id: "master", name: "Master Escapist", desc: "Conquer all levels!", unlocked: false },
        { id: "flip", name: "Acrobatic Gel", desc: "Perform 20 double jump flips", unlocked: false },
        { id: "pancake", name: "Pancake Bob", desc: "Squish flat 20 times", unlocked: false },
        { id: "runner", name: "Cyber Sprinter", desc: "Reach 1000m in Endless Mode", unlocked: false },
        { id: "clumsy", name: "Glitchy Drops", desc: "Die 5 times", unlocked: false },
        { id: "hoarder", name: "Byte Collector", desc: "Collect 10 energy bits", unlocked: false }
    ];
}

export function unlockAchievement(state, id) {
    let ach = state.achievements.find(a => a.id === id);
    if (ach && !ach.unlocked) {
        ach.unlocked = true;
        state.toasts.push({
            text: "🏆 UNLOCKED: " + ach.name,
            timer: 220,
            maxTimer: 220,
            animY: -50,
            targetY: 0,
            alpha: 0
        });
    }
}

export function updateToasts(toasts) {
    for (let i = toasts.length - 1; i >= 0; i--) {
        let t = toasts[i];
        t.timer--;
        let targetY = i * 48;
        if (t.timer > t.maxTimer - 25) {
            t.alpha += (1 - t.alpha) * 0.2;
            t.animY += (targetY - t.animY) * 0.2;
        } else if (t.timer < 30) {
            t.alpha += (0 - t.alpha) * 0.2;
            t.animY -= 1.5;
        } else {
            t.alpha = 1;
            t.animY += (targetY - t.animY) * 0.2;
        }
        if (t.timer <= 0) toasts.splice(i, 1);
    }
}
