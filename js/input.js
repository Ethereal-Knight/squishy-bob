function setKey(keys, event, pressed) {
    let k = event.key.toLowerCase();
    if (k === "w") keys.w = pressed;
    if (k === "a") keys.a = pressed;
    if (k === "s") keys.s = pressed;
    if (k === "d") keys.d = pressed;
    if (event.key === " ") keys.space = pressed;
    if (event.key === "ArrowUp") keys.ArrowUp = pressed;
    if (event.key === "ArrowDown") keys.ArrowDown = pressed;
    if (event.key === "ArrowLeft") keys.ArrowLeft = pressed;
    if (event.key === "ArrowRight") keys.ArrowRight = pressed;
}

export function bindInput(target, state, onMenu) {
    target.addEventListener("keydown", (e) => {
        setKey(state.keys, e, true);
        if (e.key === " ") e.preventDefault();
        if (e.key.toLowerCase() === "m") onMenu(true);
        if (state.gameState === "ACHIEVEMENTS" || state.gameState === "CAMPAIGN_WIN" || state.gameState === "ENDLESS_OVER") {
            if (e.key === " ") onMenu(false);
        }
    });
    target.addEventListener("keyup", (e) => setKey(state.keys, e, false));
}
