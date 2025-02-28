export enum CellType {
  Empty = 'empty',
  Wall = 'wall',
  Entrance = 'entrance',
  Key = 'key',
  Supplies = 'supplies',
  Mana = 'mana',
  Encounter = 'encounter',
  Treasure = 'treasure',
  Relic = 'relic'
}

export enum ColorRequirement {
  None = 'none',
  Red = 'red',
  Orange = 'orange',
  Yellow = 'yellow',
  Green = 'green',
  Blue = 'blue',
  Purple = 'purple'
}

// Add to src/types.ts
export interface PlacedShape {
  shape: number[][];
  startRow: number;
  startCol: number;
  cardValue: CardValue;
  cardSuit: string;
}

export interface Cell {
  type: CellType;
  colorRequirement: ColorRequirement;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  traversed?: boolean; // Add this property
}

export type Board = Cell[][];

export interface ActionShape {
  id: number;
  value: number;
  shape: number[][];
  cardValues: string[];
}

export type CardValue =
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | 'J' | 'Q' | 'K' | 'A';

export interface CardDraw {
  value: CardValue;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  isPlaced: boolean;
}