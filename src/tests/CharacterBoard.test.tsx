import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CharacterBoard from '../components/CharacterBoard';
import { DEFAULT_CHARACTER, CharacterState } from '../types';
import { generateRandomCharacter, getScoringMilestones } from '../utils/characterGenerator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderBoard(overrides?: Partial<CharacterState>) {
    const character: CharacterState = { ...DEFAULT_CHARACTER, ...overrides };
    const onChange = jest.fn();
    render(<CharacterBoard character={character} onChange={onChange} />);
    return { onChange };
}

// ---------------------------------------------------------------------------
// Render tests
// ---------------------------------------------------------------------------

describe('CharacterBoard – rendering', () => {
    test('renders with default character state', () => {
        renderBoard();
        expect(screen.getByText('Character Board')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Hero')).toBeInTheDocument();
    });

    test('displays all body location labels', () => {
        renderBoard();
        ['Head', 'Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'].forEach(name => {
            expect(screen.getByText(name)).toBeInTheDocument();
        });
    });

    test('displays all attribute labels', () => {
        renderBoard();
        ['Brawn', 'Agility', 'Mind', 'Spirit'].forEach(label => {
            expect(screen.getByText(label)).toBeInTheDocument();
        });
    });

    test('displays resource labels', () => {
        renderBoard();
        ['XP', 'Gold', 'Supplies', 'Mana'].forEach(label => {
            expect(screen.getByText(label)).toBeInTheDocument();
        });
    });

    test('displays energy color labels', () => {
        renderBoard();
        ['red', 'orange', 'yellow', 'green', 'blue', 'purple'].forEach(color => {
            expect(screen.getByText(new RegExp(color, 'i'))).toBeInTheDocument();
        });
    });

    test('displays scoring category labels', () => {
        renderBoard();
        ['Discovery', 'Champion', 'Arcana', 'Fortune'].forEach(cat => {
            expect(screen.getByText(cat)).toBeInTheDocument();
        });
    });

    test('displays all class names', () => {
        renderBoard();
        ['Alchemist', 'Bard', 'Druid', 'Knight', 'Necromancer', 'Ranger'].forEach(cls => {
            expect(screen.getByText(cls)).toBeInTheDocument();
        });
    });

    test('renders Randomize button', () => {
        renderBoard();
        expect(screen.getByText(/Randomize/i)).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// Name input
// ---------------------------------------------------------------------------

describe('CharacterBoard – name input', () => {
    test('calls onChange when name is edited', () => {
        const { onChange } = renderBoard();
        const input = screen.getByDisplayValue('Hero');
        fireEvent.change(input, { target: { value: 'Aldric' } });
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Aldric' })
        );
    });
});

// ---------------------------------------------------------------------------
// Randomize
// ---------------------------------------------------------------------------

describe('CharacterBoard – randomize', () => {
    test('calls onChange with a valid CharacterState when Randomize is clicked', () => {
        const { onChange } = renderBoard();
        fireEvent.click(screen.getByText(/Randomize/i));
        expect(onChange).toHaveBeenCalledTimes(1);
        const arg: CharacterState = onChange.mock.calls[0][0];
        expect(typeof arg.name).toBe('string');
        expect(arg.body).toHaveLength(6);
        expect(arg.classes).toHaveLength(6);
    });
});

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

describe('CharacterBoard – attribute tracks', () => {
    test('clicking a pip at value 5 calls onChange with brawn=5', () => {
        const { onChange } = renderBoard();
        // The Brawn pip track renders buttons titled "Set to 0" … "Set to 10"
        const pip = screen.getAllByTitle('Set to 5')[0]; // first attribute pip row = Brawn
        fireEvent.click(pip);
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                attributes: expect.objectContaining({ brawn: 5 }),
            })
        );
    });
});

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

describe('CharacterBoard – resource counters', () => {
    test('increment XP calls onChange with xp+1', () => {
        const { onChange } = renderBoard({ resources: { xp: 3, gold: 0, supplies: 0, mana: 0 } });
        // The XP row has two buttons (− and +). We need the + button in its row.
        const incrementButtons = screen.getAllByText('+');
        fireEvent.click(incrementButtons[0]); // first increment = XP
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                resources: expect.objectContaining({ xp: 4 }),
            })
        );
    });

    test('decrement XP calls onChange with xp-1', () => {
        const { onChange } = renderBoard({ resources: { xp: 2, gold: 0, supplies: 0, mana: 0 } });
        const decrementButtons = screen.getAllByText('−');
        fireEvent.click(decrementButtons[0]); // first decrement = XP
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                resources: expect.objectContaining({ xp: 1 }),
            })
        );
    });

    test('decrement at 0 does not go below 0', () => {
        const { onChange } = renderBoard({ resources: { xp: 0, gold: 0, supplies: 0, mana: 0 } });
        const decrementButtons = screen.getAllByText('−');
        // The button should be disabled at 0
        expect(decrementButtons[0]).toBeDisabled();
    });
});

// ---------------------------------------------------------------------------
// Scoring track
// ---------------------------------------------------------------------------

describe('CharacterBoard – scoring track', () => {
    test('clicking score segment 10 sets discovery to 10', () => {
        const { onChange } = renderBoard();
        const pip = screen.getAllByTitle('Milestone at 10')[0]; // first = Discovery
        fireEvent.click(pip);
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                scoring: expect.objectContaining({ discovery: 10 }),
            })
        );
    });
});

// ---------------------------------------------------------------------------
// Class level track
// ---------------------------------------------------------------------------

describe('CharacterBoard – class levels', () => {
    test('clicking level 3 pip on Alchemist sets level to 3', () => {
        const { onChange } = renderBoard();
        const pip = screen.getAllByTitle('Level 3')[0]; // first class row = Alchemist
        fireEvent.click(pip);
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                classes: expect.arrayContaining([
                    expect.objectContaining({ className: 'Alchemist', level: 3 }),
                ]),
            })
        );
    });

    test('clicking the already-active level pip toggles level to 0', () => {
        const character = {
            ...DEFAULT_CHARACTER,
            classes: DEFAULT_CHARACTER.classes.map(c =>
                c.className === 'Bard' ? { ...c, level: 2 } : c
            ),
        };
        const onChange = jest.fn();
        render(<CharacterBoard character={character} onChange={onChange} />);
        // Bard is the second class row; find the "Level 2" buttons
        const level2Pips = screen.getAllByTitle('Level 2');
        // Click the one in Bard's row (index 1, since Alchemist is first)
        fireEvent.click(level2Pips[1]);
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                classes: expect.arrayContaining([
                    expect.objectContaining({ className: 'Bard', level: 0 }),
                ]),
            })
        );
    });
});

// ---------------------------------------------------------------------------
// getScoringMilestones utility
// ---------------------------------------------------------------------------

describe('getScoringMilestones', () => {
    test('returns correct milestones up to 35', () => {
        expect(getScoringMilestones(35)).toEqual([5, 10, 15, 20, 23, 26, 29, 32, 35]);
    });

    test('only every-5 milestones when max is 20', () => {
        expect(getScoringMilestones(20)).toEqual([5, 10, 15, 20]);
    });
});

// ---------------------------------------------------------------------------
// generateRandomCharacter utility
// ---------------------------------------------------------------------------

describe('generateRandomCharacter', () => {
    test('returns a CharacterState with a non-empty name', () => {
        const char = generateRandomCharacter();
        expect(char.name.length).toBeGreaterThan(0);
    });

    test('attributes are within 1–7', () => {
        for (let i = 0; i < 10; i++) {
            const { attributes: a } = generateRandomCharacter();
            ([a.brawn, a.agility, a.mind, a.spirit]).forEach(v => {
                expect(v).toBeGreaterThanOrEqual(1);
                expect(v).toBeLessThanOrEqual(7);
            });
        }
    });

    test('all energies are 0–2', () => {
        for (let i = 0; i < 10; i++) {
            const { energies: e } = generateRandomCharacter();
            Object.values(e).forEach(v => {
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThanOrEqual(2);
            });
        }
    });

    test('class levels all start at 0', () => {
        const { classes } = generateRandomCharacter();
        classes.forEach(c => expect(c.level).toBe(0));
    });

    test('body has 6 locations all with 0 wounds and 0 armor', () => {
        const { body } = generateRandomCharacter();
        expect(body).toHaveLength(6);
        body.forEach(loc => {
            expect(loc.wounds).toBe(0);
            expect(loc.armor).toBe(0);
        });
    });
});
