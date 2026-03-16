import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BoardDesigner from '../components/BoardDesigner';
import { CellType, ColorRequirement, Board } from '../types';

describe('BoardDesigner Component', () => {
  const mockBoard: Board = Array(8).fill(null).map(() =>
    Array(8).fill(null).map(() => ({
      type: CellType.Empty,
      colorRequirement: ColorRequirement.None,
      walls: { top: false, right: false, bottom: false, left: false }
    }))
  );

  const mockOnCellClick = jest.fn();

  test('renders BoardDesigner component', () => {
    render(<BoardDesigner board={mockBoard} onCellClick={mockOnCellClick} />);
    const boardElement = screen.getByRole('grid');
    expect(boardElement).toBeInTheDocument();
  });

  test('renders initial cells', () => {
    render(<BoardDesigner board={mockBoard} onCellClick={mockOnCellClick} />);
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBe(64); // 8x8 grid
  });

  test('handles cell clicks', () => {
    render(<BoardDesigner board={mockBoard} onCellClick={mockOnCellClick} />);
    const cell = screen.getAllByRole('cell')[0];
    fireEvent.click(cell);
    expect(mockOnCellClick).toHaveBeenCalledWith(0, 0);
  });

  test('displays cell descriptions on hover', () => {
    render(<BoardDesigner board={mockBoard} onCellClick={mockOnCellClick} />);
    const cell = screen.getAllByRole('cell')[0];
    fireEvent.mouseEnter(cell);
    const tooltip = screen.getByText(/Empty Space/i);
    expect(tooltip).toBeInTheDocument();
  });
});
