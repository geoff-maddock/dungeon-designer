import React from 'react';
import { render, screen } from '@testing-library/react';
import ForestBoard from '../components/ForestBoard';

describe('ForestBoard Component', () => {
  test('renders ForestBoard component', () => {
    render(<ForestBoard />);
    const headingElement = screen.getByText(/Forest Adventure Board/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('displays welcome message', () => {
    render(<ForestBoard />);
    const welcomeMessage = screen.getByText(/Welcome to the Enchanted Forest!/i);
    expect(welcomeMessage).toBeInTheDocument();
  });

  test('renders example cells', () => {
    render(<ForestBoard />);
    const cellElements = screen.getAllByText(/Cell \d+/i);
    expect(cellElements.length).toBe(4);
  });
});
