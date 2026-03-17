import { Board, Cell, CellType, ColorRequirement, MazeSettings } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyCell(): Cell {
    return {
        type: CellType.Empty,
        colorRequirement: ColorRequirement.None,
        walls: { top: true, right: true, bottom: true, left: true },
    };
}

const DIRS: Array<{ dr: number; dc: number; wall: 'top' | 'right' | 'bottom' | 'left'; opposite: 'top' | 'right' | 'bottom' | 'left' }> = [
    { dr: -1, dc: 0, wall: 'top', opposite: 'bottom' },
    { dr: 0, dc: 1, wall: 'right', opposite: 'left' },
    { dr: 1, dc: 0, wall: 'bottom', opposite: 'top' },
    { dr: 0, dc: -1, wall: 'left', opposite: 'right' },
];

function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ---------------------------------------------------------------------------
// Recursive-backtracker DFS maze carver
// Starts at (startRow, startCol) and removes walls to carve passages.
// ---------------------------------------------------------------------------
function carveMaze(board: Board, visited: boolean[][], row: number, col: number): void {
    visited[row][col] = true;
    const size = board.length;

    for (const dir of shuffle([...DIRS])) {
        const nr = row + dir.dr;
        const nc = col + dir.dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (visited[nr][nc]) continue;

        // Remove the wall between current cell and neighbour
        board[row][col].walls[dir.wall] = false;
        board[nr][nc].walls[dir.opposite] = false;

        carveMaze(board, visited, nr, nc);
    }
}

// ---------------------------------------------------------------------------
// BFS from a source cell — returns distance map (Infinity = unreachable)
// Passages are determined by the wall flags between cells.
// ---------------------------------------------------------------------------
function bfsDistances(board: Board, startRow: number, startCol: number): number[][] {
    const size = board.length;
    const dist: number[][] = Array.from({ length: size }, () => Array(size).fill(Infinity));
    dist[startRow][startCol] = 0;
    const queue: [number, number][] = [[startRow, startCol]];

    while (queue.length > 0) {
        const [r, c] = queue.shift()!;
        for (const dir of DIRS) {
            // Can we pass through this wall?
            if (board[r][c].walls[dir.wall]) continue;
            const nr = r + dir.dr;
            const nc = c + dir.dc;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
            if (dist[nr][nc] !== Infinity) continue;
            dist[nr][nc] = dist[r][c] + 1;
            queue.push([nr, nc]);
        }
    }

    return dist;
}

// ---------------------------------------------------------------------------
// Place Goals at cells whose BFS distance is closest to targetDist,
// distributing them across board quadrants so they are spread out.
// ---------------------------------------------------------------------------
function placeGoals(
    board: Board,
    dist: number[][],
    goalCount: number,
    targetDist: number,
): void {
    const size = board.length;

    // Divide board into quadrants (or more zones for larger goal counts)
    const zones = Math.max(goalCount, 4);
    const zoneSize = Math.ceil(size / Math.ceil(Math.sqrt(zones)));
    const buckets: Array<Array<[number, number]>> = Array.from({ length: zones }, () => []);

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c].type !== CellType.Empty) continue;
            if (dist[r][c] === Infinity) continue;
            const zr = Math.floor(r / zoneSize);
            const zc = Math.floor(c / zoneSize);
            const cols = Math.ceil(size / zoneSize);
            const zoneIdx = Math.min(zr * cols + zc, zones - 1);
            buckets[zoneIdx].push([r, c]);
        }
    }

    // From each zone, pick the cell whose distance is closest to targetDist
    const placed: Array<[number, number]> = [];
    const usedZones = new Set<number>();

    // Sort zones by their best candidate distance so we spread across them
    const zoneCandidates = buckets.map((cells, idx) => {
        if (cells.length === 0) return null;
        cells.sort((a, b) => Math.abs(dist[a[0]][a[1]] - targetDist) - Math.abs(dist[b[0]][b[1]] - targetDist));
        return { idx, best: cells[0], delta: Math.abs(dist[cells[0][0]][cells[0][1]] - targetDist) };
    }).filter(Boolean) as Array<{ idx: number; best: [number, number]; delta: number }>;

    zoneCandidates.sort((a, b) => a.delta - b.delta);

    for (const { idx, best } of zoneCandidates) {
        if (placed.length >= goalCount) break;
        if (usedZones.has(idx)) continue;
        board[best[0]][best[1]].type = CellType.Goal;
        placed.push(best);
        usedZones.add(idx);
    }

    // Fallback: if we still haven't placed all goals, pick best remaining cells globally
    if (placed.length < goalCount) {
        const allCandidates: Array<[number, number]> = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c].type === CellType.Empty && dist[r][c] !== Infinity) {
                    allCandidates.push([r, c]);
                }
            }
        }
        allCandidates.sort((a, b) => Math.abs(dist[a[0]][a[1]] - targetDist) - Math.abs(dist[b[0]][b[1]] - targetDist));
        for (const [r, c] of allCandidates) {
            if (placed.length >= goalCount) break;
            board[r][c].type = CellType.Goal;
            placed.push([r, c]);
        }
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * BFS shortest path between two cells — returns list of [row, col] pairs
 * from source to destination, or [] if no path exists.
 * Passages are determined by wall flags.
 */
export function getShortestPath(
    board: Board,
    fromRow: number, fromCol: number,
    toRow: number, toCol: number,
): [number, number][] {
    const size = board.length;
    const key = (r: number, c: number) => `${r},${c}`;
    const parent = new Map<string, [number, number] | null>();
    parent.set(key(fromRow, fromCol), null);
    const queue: [number, number][] = [[fromRow, fromCol]];

    outer: while (queue.length > 0) {
        const [r, c] = queue.shift()!;
        if (r === toRow && c === toCol) break outer;
        for (const dir of DIRS) {
            if (board[r][c].walls[dir.wall]) continue;
            const nr = r + dir.dr;
            const nc = c + dir.dc;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
            const nk = key(nr, nc);
            if (parent.has(nk)) continue;
            parent.set(nk, [r, c]);
            queue.push([nr, nc]);
        }
    }

    const destKey = key(toRow, toCol);
    if (!parent.has(destKey)) return [];
    const path: [number, number][] = [];
    let curr: [number, number] | null = [toRow, toCol];
    while (curr !== null) {
        path.unshift(curr);
        curr = parent.get(key(curr[0], curr[1])) ?? null;
    }
    return path;
}

/**
 * Generate a full maze board.
 * - All cells start fully walled.
 * - DFS carves passages (walls removed between adjacent cells).
 * - Entrance placed at bottom-center.
 * - Goals placed at cells whose BFS path length from Entrance ≈ goalPathLength.
 */
export function generateMazeBoard(size: number, settings: MazeSettings): Board {
    // Build board with all walls closed
    const board: Board = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => emptyCell())
    );

    const entranceRow = size - 1;
    const entranceCol = Math.floor(size / 2);
    board[entranceRow][entranceCol].type = CellType.Entrance;

    // Carve maze starting from entrance
    const visited: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    carveMaze(board, visited, entranceRow, entranceCol);

    // BFS from entrance to get path distances
    const dist = bfsDistances(board, entranceRow, entranceCol);

    // Place goals
    placeGoals(board, dist, settings.goalCount, settings.goalPathLength);

    return board;
}

/**
 * Populate an existing maze (preserving its wall/passage structure) with
 * dungeon contents placed randomly within reachable (non-wall, non-entrance) cells.
 *
 * cellTypeCounts: map of CellType → how many to place
 * colorRequirementCounts: map of ColorRequirement → how many to assign to empty passage cells
 * strategy: 'random' | 'depth-aware' | 'dead-ends'
 * coloredItemPercentage: 0–100. Percentage of placed item cells that receive a random color.
 *   Energy cells always receive a color regardless of this value.
 */
export function populateMaze(
    board: Board,
    cellTypeCounts: Partial<Record<CellType, number>>,
    colorRequirementCounts: Partial<Record<ColorRequirement, number>>,
    strategy: 'random' | 'depth-aware' | 'dead-ends' = 'random',
    coloredItemPercentage: number = 0,
): Board {
    // Deep-clone the board, preserving walls
    const newBoard: Board = board.map(row =>
        row.map(cell => ({
            ...cell,
            walls: { ...cell.walls },
            colorRequirement: ColorRequirement.None,
        }))
    );

    // Reset non-structural cell types (keep Entrance and Goal)
    for (const row of newBoard) {
        for (const cell of row) {
            if (cell.type !== CellType.Entrance && cell.type !== CellType.Goal) {
                cell.type = CellType.Empty;
            }
        }
    }

    const eligible = (r: number, c: number) => newBoard[r][c].type === CellType.Empty;
    const size = newBoard.length;

    // Compute BFS distances for depth-aware and dead-ends strategies
    let dist: number[][] | null = null;
    let maxDist = 0;
    if (strategy === 'depth-aware' || strategy === 'dead-ends') {
        let eRow = -1, eCol = -1;
        for (let r = 0; r < size; r++)
            for (let c = 0; c < size; c++)
                if (newBoard[r][c].type === CellType.Entrance) { eRow = r; eCol = c; }
        if (eRow >= 0) {
            dist = bfsDistances(newBoard, eRow, eCol);
            for (let r = 0; r < size; r++)
                for (let c = 0; c < size; c++)
                    if (dist[r][c] !== Infinity) maxDist = Math.max(maxDist, dist[r][c]);
        }
    }

    const LOW_VALUE = new Set<CellType>([CellType.Key, CellType.Lock, CellType.Supplies, CellType.Mana]);
    const HIGH_VALUE = new Set<CellType>([CellType.Encounter, CellType.Treasure, CellType.Relic]);
    // Items placed at dead ends first in the dead-ends strategy
    const DEAD_END_PRIORITY = new Set<CellType>([CellType.Treasure, CellType.Relic]);

    const getEmptyCells = (): [number, number][] => {
        const cells: [number, number][] = [];
        for (let r = 0; r < size; r++)
            for (let c = 0; c < size; c++)
                if (eligible(r, c)) cells.push([r, c]);
        return cells;
    };

    // Returns true if a cell has exactly one open passage (dead end in the maze)
    const isDeadEnd = (r: number, c: number): boolean => {
        let open = 0;
        for (const dir of DIRS) if (!newBoard[r][c].walls[dir.wall]) open++;
        return open === 1;
    };

    const placeType = (type: CellType, count: number) => {
        let pool = getEmptyCells();

        if (dist && strategy === 'depth-aware' && maxDist > 0) {
            if (LOW_VALUE.has(type)) {
                const preferred = pool.filter(([r, c]) => dist![r][c] <= maxDist * 0.5);
                if (preferred.length >= count) pool = preferred;
            } else if (HIGH_VALUE.has(type)) {
                const preferred = pool.filter(([r, c]) => dist![r][c] > maxDist * 0.4);
                if (preferred.length >= count) pool = preferred;
            }
        } else if (dist && strategy === 'dead-ends' && maxDist > 0) {
            const deadEnds = pool.filter(([r, c]) => isDeadEnd(r, c));

            if (DEAD_END_PRIORITY.has(type)) {
                // Place priority items at dead ends; fall back to deepest remaining cells
                if (deadEnds.length >= count) {
                    pool = shuffle(deadEnds);
                } else {
                    const deadEndSet = new Set(deadEnds.map(([r, c]) => `${r},${c}`));
                    const rest = pool
                        .filter(([r, c]) => !deadEndSet.has(`${r},${c}`))
                        .sort((a, b) => dist![b[0]][b[1]] - dist![a[0]][a[1]]);
                    pool = [...shuffle(deadEnds), ...rest];
                }
            } else {
                // Other types: even split between near-entrance and dead-end zones
                const half = Math.ceil(count / 2);
                const nearEntrance = shuffle(pool.filter(([r, c]) => dist![r][c] <= maxDist * 0.35));
                const fromEntrance = nearEntrance.slice(0, half);
                const fromDeadEnds = shuffle(deadEnds).slice(0, count - fromEntrance.length);
                const usedSet = new Set([...fromEntrance, ...fromDeadEnds].map(([r, c]) => `${r},${c}`));
                const fallback = shuffle(pool.filter(([r, c]) => !usedSet.has(`${r},${c}`)));
                pool = [...fromEntrance, ...fromDeadEnds, ...fallback];
            }
        }

        const candidates = strategy === 'dead-ends' ? pool : shuffle(pool);
        let placed = 0;
        for (const [r, c] of candidates) {
            if (placed >= count) break;
            newBoard[r][c].type = type;
            placed++;
        }
    };

    const placeColor = (color: ColorRequirement, count: number) => {
        const candidates = shuffle(
            getEmptyCells().filter(([r, c]) => newBoard[r][c].colorRequirement === ColorRequirement.None)
        );
        let placed = 0;
        for (const [r, c] of candidates) {
            if (placed >= count) break;
            newBoard[r][c].colorRequirement = color;
            placed++;
        }
    };

    for (const [type, count] of Object.entries(cellTypeCounts) as [CellType, number][]) {
        if (type === CellType.Empty || type === CellType.Entrance || type === CellType.Goal) continue;
        placeType(type, count ?? 0);
    }

    // Assign colors to passage/empty cells based on colorRequirementCounts
    for (const [color, count] of Object.entries(colorRequirementCounts) as [ColorRequirement, number][]) {
        if (color === ColorRequirement.None) continue;
        placeColor(color, count ?? 0);
    }

    // Assign colors to placed item cells:
    // - Energy always gets a random color
    // - Other item cells: colored with probability = coloredItemPercentage / 100
    const ALL_COLORS: ColorRequirement[] = [
        ColorRequirement.Red, ColorRequirement.Orange, ColorRequirement.Yellow,
        ColorRequirement.Green, ColorRequirement.Blue, ColorRequirement.Purple,
    ];
    const randomColor = () => ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
    const SKIP_TYPES = new Set<CellType>([CellType.Empty, CellType.Wall, CellType.Entrance, CellType.Goal]);

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = newBoard[r][c];
            if (SKIP_TYPES.has(cell.type)) continue;
            if (cell.type === CellType.Energy) {
                // Energy is always paired with a color
                cell.colorRequirement = randomColor();
            } else if (coloredItemPercentage > 0 && Math.random() * 100 < coloredItemPercentage) {
                cell.colorRequirement = randomColor();
            }
        }
    }

    return newBoard;
}
