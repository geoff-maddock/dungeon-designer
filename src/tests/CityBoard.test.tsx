import React from 'react';
import { render, screen } from '@testing-library/react';
import CityBoard from '../components/CityBoard';

describe('CityBoard Component', () => {
  test('renders CityBoard component', () => {
    render(<CityBoard />);
    const headingElement = screen.getByText(/City Adventure Board/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('displays welcome message', () => {
    render(<CityBoard />);
    const welcomeMessage = screen.getByText(/Welcome to the City!/i);
    expect(welcomeMessage).toBeInTheDocument();
  });

  test('renders example cells', () => {
    render(<CityBoard />);
    const cellElements = screen.getAllByText(/Cell \d+/i);
    expect(cellElements.length).toBe(4);
  });
});
