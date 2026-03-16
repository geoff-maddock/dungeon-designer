import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RandomBoardSettings from '../components/RandomBoardSettings';
import { CellType, ColorRequirement } from '../types';

describe('RandomBoardSettings Component', () => {
  const mockSettings = {
    [CellType.Key]: 3,
    [CellType.Lock]: 3,
    [CellType.Supplies]: 3,
    [CellType.Mana]: 3,
    [CellType.Encounter]: 4,
    [CellType.Treasure]: 4,
    [CellType.Relic]: 6,
    [ColorRequirement.Red]: 2,
    [ColorRequirement.Orange]: 2,
    [ColorRequirement.Yellow]: 2,
    [ColorRequirement.Green]: 2,
    [ColorRequirement.Blue]: 2,
    [ColorRequirement.Purple]: 2,
  };

  const mockOnSettingChange = jest.fn();
  const mockOnWallCountChange = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnGenerate = jest.fn();
  const mockOnTrueRandom = jest.fn();

  test('renders RandomBoardSettings component', () => {
    render(
      <RandomBoardSettings
        settings={mockSettings}
        wallCount={15}
        onSettingChange={mockOnSettingChange}
        onWallCountChange={mockOnWallCountChange}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
        onTrueRandom={mockOnTrueRandom}
      />
    );
    const headingElement = screen.getByText(/Board Settings/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('changes cell type settings', () => {
    render(
      <RandomBoardSettings
        settings={mockSettings}
        wallCount={15}
        onSettingChange={mockOnSettingChange}
        onWallCountChange={mockOnWallCountChange}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
        onTrueRandom={mockOnTrueRandom}
      />
    );

    const keyInput = screen.getByLabelText(/Key/i);
    fireEvent.change(keyInput, { target: { value: '5' } });
    expect(mockOnSettingChange).toHaveBeenCalledWith(CellType.Key, 5);
  });

  test('changes wall count', () => {
    render(
      <RandomBoardSettings
        settings={mockSettings}
        wallCount={15}
        onSettingChange={mockOnSettingChange}
        onWallCountChange={mockOnWallCountChange}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
        onTrueRandom={mockOnTrueRandom}
      />
    );

    const wallInput = screen.getByLabelText(/Wall Cells/i);
    fireEvent.change(wallInput, { target: { value: '20' } });
    expect(mockOnWallCountChange).toHaveBeenCalledWith(20);
  });

  test('closes the settings modal', () => {
    render(
      <RandomBoardSettings
        settings={mockSettings}
        wallCount={15}
        onSettingChange={mockOnSettingChange}
        onWallCountChange={mockOnWallCountChange}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
        onTrueRandom={mockOnTrueRandom}
      />
    );

    const closeButton = screen.getByText(/✕/i);
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('generates a board', () => {
    render(
      <RandomBoardSettings
        settings={mockSettings}
        wallCount={15}
        onSettingChange={mockOnSettingChange}
        onWallCountChange={mockOnWallCountChange}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
        onTrueRandom={mockOnTrueRandom}
      />
    );

    const generateButton = screen.getByText(/Generate Board/i);
    fireEvent.click(generateButton);
    expect(mockOnGenerate).toHaveBeenCalled();
  });

  test('generates a true random board', () => {
    render(
      <RandomBoardSettings
        settings={mockSettings}
        wallCount={15}
        onSettingChange={mockOnSettingChange}
        onWallCountChange={mockOnWallCountChange}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
        onTrueRandom={mockOnTrueRandom}
      />
    );

    const trueRandomButton = screen.getByText(/True Random/i);
    fireEvent.click(trueRandomButton);
    expect(mockOnTrueRandom).toHaveBeenCalled();
  });
});
