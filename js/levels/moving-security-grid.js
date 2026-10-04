export default {
    t: "6: Moving Security Grid",
    m: "Avoid vertically patrolling glitches and synchronized moving bridges.",
    p: [[0,450,150,50], [1050,450,200,50]],
    mp: [
        { x: 200, y: 450, w: 80, h: 20, vx: 0, vy: 2, minX: 0, maxX: 0, minY: 250, maxY: 450 },
        { x: 450, y: 250, w: 80, h: 20, vx: 0, vy: -2, minX: 0, maxX: 0, minY: 250, maxY: 450 },
        { x: 700, y: 450, w: 80, h: 20, vx: 0, vy: 2, minX: 0, maxX: 0, minY: 250, maxY: 450 }
    ],
    l: [[0,480,1250,20]],
    e: [
        { x: 350, y: 200, w: 26, h: 26, vx: 0, vy: 2.5, minX: 0, maxX: 0, minY: 150, maxY: 420 },
        { x: 600, y: 400, w: 26, h: 26, vx: 0, vy: -2.5, minX: 0, maxX: 0, minY: 150, maxY: 420 }
    ],
    g: [1120,400], s: [50,400]
};
