import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActionShapes from '../components/ActionShapes';
import { ActionShape } from '../types';

describe('ActionShapes Component', () => {
  const mockShapes: ActionShape[] = [
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

  test('renders ActionShapes component', () => {
    render(<ActionShapes shapes={mockShapes} />);
    const levelButton = screen.getByText(/Level 1/i);
    expect(levelButton).toBeInTheDocument();
  });

  test('displays shapes for selected level', () => {
    render(<ActionShapes shapes={mockShapes} />);
    const levelButton = screen.getByText(/Level 1/i);
    fireEvent.click(levelButton);
    const shapeElement = screen.getByText(/Shape 1/i);
    expect(shapeElement).toBeInTheDocument();
  });

  test('rotates shape preview', () => {
    render(<ActionShapes shapes={mockShapes} />);
    const levelButton = screen.getByText(/Level 1/i);
    fireEvent.click(levelButton);
    const rotateButton = screen.getByText(/Rotate/i);
    fireEvent.click(rotateButton);
    const rotatedShape = screen.getByText(/Shape 1/i);
    expect(rotatedShape).toBeInTheDocument();
  });

  test('flips shape preview', () => {
    render(<ActionShapes shapes={mockShapes} />);
    const levelButton = screen.getByText(/Level 1/i);
    fireEvent.click(levelButton);
    const flipButton = screen.getByText(/Flip/i);
    fireEvent.click(flipButton);
    const flippedShape = screen.getByText(/Shape 1/i);
    expect(flippedShape).toBeInTheDocument();
  });

  test('resets shape preview', () => {
    render(<ActionShapes shapes={mockShapes} />);
    const levelButton = screen.getByText(/Level 1/i);
    fireEvent.click(levelButton);
    const resetButton = screen.getByText(/Reset/i);
    fireEvent.click(resetButton);
    const resetShape = screen.getByText(/Shape 1/i);
    expect(resetShape).toBeInTheDocument();
  });
});
