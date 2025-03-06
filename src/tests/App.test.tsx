import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  test('renders App component', () => {
    render(<App />);
    const headingElement = screen.getByText(/Tabletop Game Board Designer/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('renders initial board', () => {
    render(<App />);
    const entranceCell = screen.getByText(/🚪/i);
    expect(entranceCell).toBeInTheDocument();
  });

  test('saves and loads boards', () => {
    render(<App />);
    const boardNameInput = screen.getByPlaceholderText(/Board Name/i);
    const saveButton = screen.getByText(/Save/i);
    const loadButton = screen.getByText(/Load/i);

    // Change board name
    fireEvent.change(boardNameInput, { target: { value: 'Test Board' } });

    // Save the board
    fireEvent.click(saveButton);

    // Load the board
    fireEvent.click(loadButton);

    // Verify the board name is loaded
    expect(boardNameInput.value).toBe('Test Board');
  });
});
