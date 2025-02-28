import { Board, CellType, ColorRequirement } from '../types';

interface RandomBoardOptions {
  cellTypeCounts: {
    [key in CellType]?: number;
  };
  colorRequirementCounts: {
    [key in ColorRequirement]?: number;
  };
  wallPercentage: number;
}

// Modified function to add random cells of a specific type with a specific count
const addRandomCells = (board: Board, cellType: CellType, count: number) => {
  const size = board.length;
  let added = 0;
  let attempts = 0;
  const maxAttempts = size * size * 2; // Prevent infinite loop

  while (added < count && attempts < maxAttempts) {
    attempts++;
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    // Skip if this cell is already occupied or is the entrance
    if (board[row][col].type !== CellType.Empty) {
      continue;
    }

    board[row][col].type = cellType;
    added++;
  }

  return added; // Return how many were actually added
};

// Modified function to add random color requirements
const addRandomColorRequirements = (board: Board, colorRequirement: ColorRequirement, count: number) => {
  const size = board.length;
  let added = 0;
  let attempts = 0;
  const maxAttempts = size * size * 2; // Prevent infinite loop

  while (added < count && attempts < maxAttempts) {
    attempts++;
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    // Skip if this cell already has a color requirement
    if (board[row][col].colorRequirement !== ColorRequirement.None) {
      continue;
    }

    board[row][col].colorRequirement = colorRequirement;
    added++;
  }

  return added; // Return how many were actually added
};

export const generateRandomBoard = (size: number, options?: RandomBoardOptions): Board => {
  // Create an empty board
  const board: Board = Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => ({
      type: CellType.Empty,
      colorRequirement: ColorRequirement.None,
      walls: { top: false, right: false, bottom: false, left: false }
    }))
  );

  // Set entrance at the bottom middle
  board[size - 1][Math.floor(size / 2)].type = CellType.Entrance;

  if (options) {
    // Add specific cell types based on options
    Object.entries(options.cellTypeCounts).forEach(([cellType, count]) => {
      if (cellType !== CellType.Empty && cellType !== CellType.Entrance) {
        addRandomCells(board, cellType as CellType, count || 0);
      }
    });

    // Add color requirements based on options
    Object.entries(options.colorRequirementCounts).forEach(([colorReq, count]) => {
      if (colorReq !== ColorRequirement.None) {
        addRandomColorRequirements(board, colorReq as ColorRequirement, count || 0);
      }
    });

    // Add walls based on percentage
    if (options.wallPercentage > 0) {
      // First, count how many cells are already occupied
      const occupiedCount = board.flat().filter(cell => cell.type !== CellType.Empty).length;

      // Calculate how many walls to add based on percentage of remaining cells
      const remainingCells = size * size - occupiedCount;
      const wallCount = Math.floor(remainingCells * (options.wallPercentage / 100));

      addRandomCells(board, CellType.Wall, wallCount);

      // Add some random walls between cells
      const wallEdgeCount = Math.floor(size * size * (options.wallPercentage / 100) * 0.2);
      for (let i = 0; i < wallEdgeCount; i++) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        const wallSide = ['top', 'right', 'bottom', 'left'][Math.floor(Math.random() * 4)] as 'top' | 'right' | 'bottom' | 'left';

        board[row][col].walls[wallSide] = true;
      }
    }
  } else {
    // Default generation logic (original behavior)
    // Add walls (about 15% of the board)
    const wallCount = Math.floor(size * size * 0.15);
    addRandomCells(board, CellType.Wall, wallCount);

    // Add resource requirements
    addRandomCells(board, CellType.Key, 3);
    // Add locks
    addRandomCells(board, CellType.Lock, 3);
    addRandomCells(board, CellType.Supplies, 3);
    addRandomCells(board, CellType.Mana, 3);

    // Add color requirements
    addRandomColorRequirements(board, ColorRequirement.Red, 2);
    addRandomColorRequirements(board, ColorRequirement.Orange, 2);
    addRandomColorRequirements(board, ColorRequirement.Yellow, 2);
    addRandomColorRequirements(board, ColorRequirement.Green, 2);
    addRandomColorRequirements(board, ColorRequirement.Blue, 2);
    addRandomColorRequirements(board, ColorRequirement.Purple, 2);

    // Add encounters and treasures
    addRandomCells(board, CellType.Encounter, 4);
    addRandomCells(board, CellType.Treasure, 4);

    // Add relics (objectives)
    addRandomCells(board, CellType.Relic, 6);

    // Add some random walls between cells
    const wallEdgeCount = Math.floor(size * size * 0.2);
    for (let i = 0; i < wallEdgeCount; i++) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      const wallSide = ['top', 'right', 'bottom', 'left'][Math.floor(Math.random() * 4)] as 'top' | 'right' | 'bottom' | 'left';

      board[row][col].walls[wallSide] = true;
    }
  }

  return board;
};

// Add this new function to boardGenerator.ts
export const generateAdvancedBoard = (size: number, options?: RandomBoardOptions): Board => {
  // Create an empty board
  const board: Board = Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => ({
      type: CellType.Empty,
      colorRequirement: ColorRequirement.None,
      walls: { top: false, right: false, bottom: false, left: false }
    }))
  );

  // Set entrance at the bottom middle
  const entranceRow = size - 1;
  const entranceCol = Math.floor(size / 2);
  board[entranceRow][entranceCol].type = CellType.Entrance;

  // First, create a maze-like structure of walls that ensures all areas are accessible
  generateMaze(board, size);

  // Get cell counts from options or use defaults
  const cellCounts = {
    [CellType.Key]: options?.cellTypeCounts[CellType.Key] || 3,
    [CellType.Lock]: options?.cellTypeCounts[CellType.Lock] || 3,
    [CellType.Supplies]: options?.cellTypeCounts[CellType.Supplies] || 3,
    [CellType.Mana]: options?.cellTypeCounts[CellType.Mana] || 3,
    [CellType.Encounter]: options?.cellTypeCounts[CellType.Encounter] || 4,
    [CellType.Treasure]: options?.cellTypeCounts[CellType.Treasure] || 4,
    [CellType.Relic]: options?.cellTypeCounts[CellType.Relic] || 6
  };

  // Calculate distance map from entrance
  const distanceMap = calculateDistanceFromEntrance(board, entranceRow, entranceCol);
  const maxDistance = Math.max(...distanceMap.flat().filter(d => d < Infinity));

  // Place keys closer to the entrance (first third of max distance)
  placeSpecialCells(board, distanceMap, CellType.Key, cellCounts[CellType.Key], 0, Math.floor(maxDistance * 0.33));

  // Place locks in the middle areas (second third of max distance)
  placeSpecialCells(board, distanceMap, CellType.Lock, cellCounts[CellType.Lock], Math.floor(maxDistance * 0.25), Math.floor(maxDistance * 0.66));

  // Place relics far from entrance (last third of max distance)
  placeSpecialCells(board, distanceMap, CellType.Relic, cellCounts[CellType.Relic], Math.floor(maxDistance * 0.66), maxDistance);

  // Place treasures across the board, weighted toward farther distances
  placeTreasures(board, distanceMap, CellType.Treasure, cellCounts[CellType.Treasure], maxDistance);

  // Place other cell types more randomly but still accessible
  placeSpecialCells(board, distanceMap, CellType.Supplies, cellCounts[CellType.Supplies], 0, maxDistance);
  placeSpecialCells(board, distanceMap, CellType.Mana, cellCounts[CellType.Mana], 0, maxDistance);
  placeSpecialCells(board, distanceMap, CellType.Encounter, cellCounts[CellType.Encounter], 0, maxDistance);

  // Add color requirements based on options
  if (options?.colorRequirementCounts) {
    Object.entries(options.colorRequirementCounts).forEach(([colorReq, count]) => {
      if (colorReq !== ColorRequirement.None) {
        addRandomColorRequirements(board, colorReq as ColorRequirement, count || 0);
      }
    });
  }

  return board;
};

// Helper function to generate a maze using a modified Prim's algorithm
const generateMaze = (board: Board, size: number) => {
  // Start with all cells as walls
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c].type === CellType.Empty) {
        board[r][c].type = CellType.Wall;
      }
    }
  }

  // Keep entrance clear
  const entranceRow = size - 1;
  const entranceCol = Math.floor(size / 2);
  board[entranceRow][entranceCol].type = CellType.Entrance;

  // Define a function to check if a cell is within the board boundary
  const isValid = (r: number, c: number) => r >= 0 && r < size && c >= 0 && c < size;

  // Define directions: up, right, down, left
  const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];

  // Start from entrance
  const frontier: [number, number][] = [];
  const visited = new Set<string>();

  // Add entrance to visited
  visited.add(`${entranceRow},${entranceCol}`);

  // Add neighbors of entrance to frontier
  for (const [dr, dc] of directions) {
    const nr = entranceRow + dr;
    const nc = entranceCol + dc;
    if (isValid(nr, nc) && board[nr][nc].type === CellType.Wall) {
      frontier.push([nr, nc]);
    }
  }

  // Process cells until frontier is empty
  while (frontier.length > 0) {
    // Pick a random cell from frontier
    const randomIndex = Math.floor(Math.random() * frontier.length);
    const [currentRow, currentCol] = frontier[randomIndex];
    frontier.splice(randomIndex, 1);

    // Skip if already visited
    if (visited.has(`${currentRow},${currentCol}`)) continue;

    // Count visited neighbors
    const visitedNeighbors: [number, number][] = [];
    for (const [dr, dc] of directions) {
      const nr = currentRow + dr;
      const nc = currentCol + dc;
      if (isValid(nr, nc) && visited.has(`${nr},${nc}`)) {
        visitedNeighbors.push([nr, nc]);
      }
    }

    // If it has at least one visited neighbor, connect to one of them
    if (visitedNeighbors.length > 0) {
      // Make this cell a path
      board[currentRow][currentCol].type = CellType.Empty;

      // Add to visited
      visited.add(`${currentRow},${currentCol}`);

      // Add unvisited neighbors to frontier
      for (const [dr, dc] of directions) {
        const nr = currentRow + dr;
        const nc = currentCol + dc;
        if (isValid(nr, nc) && board[nr][nc].type === CellType.Wall && !visited.has(`${nr},${nc}`)) {
          frontier.push([nr, nc]);
        }
      }
    }
  }

  // Ensure the maze is not too dense by removing some walls
  const openRatio = 0.3; // Adjust for desired openness (higher = more open)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip entrance
      if (r === entranceRow && c === entranceCol) continue;

      // Randomly remove some walls
      if (board[r][c].type === CellType.Wall && Math.random() < openRatio) {
        // Only remove if it has at least one path neighbor
        let hasPathNeighbor = false;
        for (const [dr, dc] of directions) {
          const nr = r + dr;
          const nc = c + dc;
          if (isValid(nr, nc) && board[nr][nc].type === CellType.Empty) {
            hasPathNeighbor = true;
            break;
          }
        }

        if (hasPathNeighbor) {
          board[r][c].type = CellType.Empty;
        }
      }
    }
  }
};

// Helper function to calculate distances from the entrance using BFS
const calculateDistanceFromEntrance = (board: Board, entranceRow: number, entranceCol: number): number[][] => {
  const size = board.length;
  const distanceMap: number[][] = Array(size).fill(0).map(() => Array(size).fill(Infinity));
  distanceMap[entranceRow][entranceCol] = 0;

  const queue: [number, number][] = [[entranceRow, entranceCol]];
  const visited = new Set<string>();
  visited.add(`${entranceRow},${entranceCol}`);

  const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    const currentDistance = distanceMap[row][col];

    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;

      if (
        nr >= 0 && nr < size &&
        nc >= 0 && nc < size &&
        !visited.has(`${nr},${nc}`) &&
        board[nr][nc].type !== CellType.Wall
      ) {
        distanceMap[nr][nc] = currentDistance + 1;
        queue.push([nr, nc]);
        visited.add(`${nr},${nc}`);
      }
    }
  }

  return distanceMap;
};

// Helper function to place special cells based on distance range
const placeSpecialCells = (
  board: Board,
  distanceMap: number[][],
  cellType: CellType,
  count: number,
  minDistance: number,
  maxDistance: number
) => {
  const eligibleCells: [number, number][] = [];
  const size = board.length;

  // Find all cells within the specified distance range
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const distance = distanceMap[r][c];
      if (
        distance >= minDistance &&
        distance <= maxDistance &&
        board[r][c].type === CellType.Empty
      ) {
        eligibleCells.push([r, c]);
      }
    }
  }

  // Shuffle eligible cells for random selection
  shuffleArray(eligibleCells);

  // Place cells up to the count or as many as possible
  const placedCount = Math.min(count, eligibleCells.length);
  for (let i = 0; i < placedCount; i++) {
    const [r, c] = eligibleCells[i];
    board[r][c].type = cellType;
  }
};

// Helper function to place treasures with more at farther distances
const placeTreasures = (
  board: Board,
  distanceMap: number[][],
  cellType: CellType,
  count: number,
  maxDistance: number
) => {
  const size = board.length;
  const sectors = 3; // Divide the board into 3 distance sectors
  const sectorSize = maxDistance / sectors;

  // Allocate treasures with increasing counts for farther sectors
  const sectorCounts = [
    Math.floor(count * 0.2), // 20% in first sector (closest)
    Math.floor(count * 0.3), // 30% in middle sector
    Math.floor(count * 0.5)  // 50% in farthest sector
  ];

  // Adjust last sector count to ensure total equals count
  sectorCounts[2] += count - sectorCounts.reduce((sum, val) => sum + val, 0);

  // Place treasures in each sector
  for (let sector = 0; sector < sectors; sector++) {
    const sectorMin = sector * sectorSize;
    const sectorMax = (sector + 1) * sectorSize;

    const eligibleCells: [number, number][] = [];

    // Find all cells within the specified sector
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const distance = distanceMap[r][c];
        if (
          distance >= sectorMin &&
          distance < sectorMax &&
          board[r][c].type === CellType.Empty
        ) {
          eligibleCells.push([r, c]);
        }
      }
    }

    // Shuffle eligible cells for random selection
    shuffleArray(eligibleCells);

    // Place cells up to the sector count or as many as possible
    const placedCount = Math.min(sectorCounts[sector], eligibleCells.length);
    for (let i = 0; i < placedCount; i++) {
      const [r, c] = eligibleCells[i];
      board[r][c].type = cellType;
    }
  }
};

// Helper function to shuffle an array in-place
const shuffleArray = <T>(array: T[]): void => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};