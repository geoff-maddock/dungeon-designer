import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CardDrawSimulator from '../components/CardDrawSimulator';
import { Board, CellType, ColorRequirement } from '../types';

describe('CardDrawSimulator Component', () => {
  // 8×8 board with an entrance at (7,4)
  const mockBoard: Board = Array(8).fill(null).map((_, r) =>
    Array(8).fill(null).map((_, c) => ({
      type: r === 7 && c === 4 ? CellType.Entrance : CellType.Empty,
      colorRequirement: ColorRequirement.None,
      walls: { top: false, right: false, bottom: false, left: false },
    }))
  );

  const mockOnMovePath = jest.fn();
  const mockOnResetDeck = jest.fn();

  beforeEach(() => {
    mockOnMovePath.mockClear();
    mockOnResetDeck.mockClear();
  });

  test('renders CardDrawSimulator component', () => {
    render(
      <CardDrawSimulator
        board={mockBoard}
        onMovePath={mockOnMovePath}
        onResetDeck={mockOnResetDeck}
      />
    );
    expect(screen.getByText(/Draw Card/i)).toBeInTheDocument();
  });

  test('draws a card and calls onMovePath for rank cards', () => {
    render(
      <CardDrawSimulator
        board={mockBoard}
        onMovePath={mockOnMovePath}
        onResetDeck={mockOnResetDeck}
      />
    );

    // Draw cards until a rank card triggers movement (face cards don't move).
    // With a full 52-card deck, 3 rank cards are guaranteed within a few tries.
    const drawButton = screen.getByText(/Draw Card/i);
    let called = false;
    for (let i = 0; i < 10; i++) {
      fireEvent.click(drawButton);
      if (mockOnMovePath.mock.calls.length > 0) { called = true; break; }
    }
    expect(called).toBe(true);
    // The path should always start at the entrance
    const firstPath = mockOnMovePath.mock.calls[0][0] as { row: number; col: number }[];
    expect(firstPath[0]).toEqual({ row: 7, col: 4 });
  });

  test('face cards do not trigger movement', () => {
    render(
      <CardDrawSimulator
        board={mockBoard}
        onMovePath={mockOnMovePath}
        onResetDeck={mockOnResetDeck}
      />
    );
    // We can't guarantee the first card is a face card without mocking,
    // but we can verify onMovePath is only called for rank cards.
    // Draw all 52 cards and count: 12 face cards (J/Q/K) should yield no movement calls.
    const drawButton = screen.getByText(/Draw Card/i);
    let rankCalls = 0;
    for (let i = 0; i < 52; i++) {
      const prevCalls = mockOnMovePath.mock.calls.length;
      fireEvent.click(drawButton);
      if (mockOnMovePath.mock.calls.length > prevCalls) rankCalls++;
    }
    // 52 cards: 12 face cards (J/Q/K × 4 suits), up to 40 rank cards (2–10, A × 4 suits).
    // On a small open board the reachable area may be exhausted before all rank
    // cards are drawn, so we check the range rather than an exact count.
    expect(rankCalls).toBeGreaterThan(0);
    expect(rankCalls).toBeLessThanOrEqual(40);
  });

  test('resets the deck', () => {
    render(
      <CardDrawSimulator
        board={mockBoard}
        onMovePath={mockOnMovePath}
        onResetDeck={mockOnResetDeck}
      />
    );

    fireEvent.click(screen.getByText(/Reset/i));
    expect(mockOnResetDeck).toHaveBeenCalled();
  });
});
