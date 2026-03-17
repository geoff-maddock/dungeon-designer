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
 * colorRequirementCounts: map of ColorRequirement → how many to assign
 */
export function populateMaze(
    board: Board,
    cellTypeCounts: Partial<Record<CellType, number>>,
    colorRequirementCounts: Partial<Record<ColorRequirement, number>>,
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

    // Collect eligible cells (empty, reachable — walls are CellType.Empty with all walls closed in this model)
    const eligible = (r: number, c: number) => newBoard[r][c].type === CellType.Empty;

    const size = newBoard.length;
    const getEmptyCells = () => {
        const cells: [number, number][] = [];
        for (let r = 0; r < size; r++)
            for (let c = 0; c < size; c++)
                if (eligible(r, c)) cells.push([r, c]);
        return cells;
    };

    const placeType = (type: CellType, count: number) => {
        const candidates = shuffle(getEmptyCells());
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

    for (const [color, count] of Object.entries(colorRequirementCounts) as [ColorRequirement, number][]) {
        if (color === ColorRequirement.None) continue;
        placeColor(color, count ?? 0);
    }

    return newBoard;
}
