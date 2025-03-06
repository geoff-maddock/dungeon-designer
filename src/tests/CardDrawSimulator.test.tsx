import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CardDrawSimulator from '../components/CardDrawSimulator';
import { Board, CellType, ColorRequirement, ActionShape } from '../types';

describe('CardDrawSimulator Component', () => {
  const mockBoard: Board = Array(8).fill(null).map(() =>
    Array(8).fill(null).map(() => ({
      type: CellType.Empty,
      colorRequirement: ColorRequirement.None,
      walls: { top: false, right: false, bottom: false, left: false }
    }))
  );

  const mockActionShapes: ActionShape[] = [
    { id: 1, value: 1, shape: [[1]], cardValues: ['2', '3', '4'] },
    { id: 2, value: 1, shape: [[1], [1]], cardValues: ['2', '3', '4'] },
    { id: 4, value: 2, shape: [[1, 1, 1]], cardValues: ['5', '6'] },
    { id: 5, value: 2, shape: [[1, 1], [1, 0]], cardValues: ['5', '6'] },
    { id: 6, value: 2, shape: [[1, 1], [1, 1]], cardValues: ['5', '6'] },
    { id: 7, value: 3, shape: [[1, 1, 1], [1, 0]], cardValues: ['7', '8'] },
    { id: 8, value: 3, shape: [[1, 1, 1, 1]], cardValues: ['7', '8'] },
    { id: 9, value: 3, shape: [[0, 1], [1, 1], [1, 0]], cardValues: ['7', '8'] },
    { id: 10, value: 4, shape: [[1, 1, 1, 1, 1]], cardValues: ['9', '10'] },
    { id: 11, value: 4, shape: [[1, 1, 1, 1], [1, 0, 0, 0]], cardValues: ['9', '10'] },
    { id: 12, value: 4, shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], cardValues: ['9', '10'] },
    { id: 13, value: 4, shape: [[0, 1, 1], [0, 1, 0], [1, 1, 0]], cardValues: ['9', '10'] },
    { id: 14, value: 5, shape: [[1, 1, 1, 1, 1], [1, 0, 0, 0, 0]], cardValues: ['A'] },
    { id: 15, value: 5, shape: [[1, 1, 1, 1, 1, 1]], cardValues: ['A'] },
    { id: 16, value: 5, shape: [[1, 1, 1], [1, 1, 1]], cardValues: ['A'] },
    { id: 17, value: 5, shape: [[1, 1], [1, 1], [1, 1]], cardValues: ['A'] },
  ];

  const mockOnPlaceShape = jest.fn();
  const mockOnResetDeck = jest.fn();

  test('renders CardDrawSimulator component', () => {
    render(
      <CardDrawSimulator
        board={mockBoard}
        actionShapes={mockActionShapes}
        onPlaceShape={mockOnPlaceShape}
        onResetDeck={mockOnResetDeck}
      />
    );
    const headingElement = screen.getByText(/Card Draw Simulator/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('draws a card and places a shape', () => {
    render(
      <CardDrawSimulator
        board={mockBoard}
        actionShapes={mockActionShapes}
        onPlaceShape={mockOnPlaceShape}
        onResetDeck={mockOnResetDeck}
      />
    );

    const drawButton = screen.getByText(/Draw Card/i);
    fireEvent.click(drawButton);

    const cardElement = screen.getByText(/2/i);
    expect(cardElement).toBeInTheDocument();

    expect(mockOnPlaceShape).toHaveBeenCalled();
  });

  test('resets the deck', () => {
    render(
      <CardDrawSimulator
        board={mockBoard}
        actionShapes={mockOnPlaceShape}
        onPlaceShape={mockOnPlaceShape}
        onResetDeck={mockOnResetDeck}
      />
    );

    const resetButton = screen.getByText(/Reset Deck/i);
    fireEvent.click(resetButton);

    expect(mockOnResetDeck).toHaveBeenCalled();
  });
});
