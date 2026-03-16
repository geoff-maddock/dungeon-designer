import React from 'react';
import { render, screen } from '@testing-library/react';
import TowerBoard from '../components/TowerBoard';

describe('TowerBoard Component', () => {
  test('renders TowerBoard component', () => {
    render(<TowerBoard />);
    const headingElement = screen.getByText(/Tower Adventure Board/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('displays welcome message', () => {
    render(<TowerBoard />);
    const welcomeMessage = screen.getByText(/Welcome to the Tower!/i);
    expect(welcomeMessage).toBeInTheDocument();
  });

  test('renders example cells', () => {
    render(<TowerBoard />);
    const cellElements = screen.getAllByText(/Cell \d+/i);
    expect(cellElements.length).toBe(4);
  });
});
