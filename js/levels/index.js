import patrolIntrusion from "./patrol-intrusion.js";
import mandatoryDuctCrawl from "./mandatory-duct-crawl.js";
import movingCyberLedges from "./moving-cyber-ledges.js";
import verticalShaftTower from "./vertical-shaft-tower.js";
import cyberWindingMaze from "./cyber-winding-maze.js";
import movingSecurityGrid from "./moving-security-grid.js";
import doubleBackInfiltration from "./double-back-infiltration.js";
import masterCoreEscape from "./master-core-escape.js";

function freezeDefinition(value) {
    if (value && typeof value === "object") {
        Object.values(value).forEach(freezeDefinition);
        Object.freeze(value);
    }
    return value;
}

export const levels = freezeDefinition([
    patrolIntrusion,
    mandatoryDuctCrawl,
    movingCyberLedges,
    verticalShaftTower,
    cyberWindingMaze,
    movingSecurityGrid,
    doubleBackInfiltration,
    masterCoreEscape
]);
