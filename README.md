# Dungeon Designer

## Purpose
Dungeon Designer is a web-based tool for creating and managing 2D game boards for tabletop dungeon crawl games. Originally generated with BOLT AI, this application serves as both a practical game design tool and a demonstration of AI's capability in rapid application development.

## Features & Functionality

### Board Design
- Create custom dungeon layouts with a flexible grid system (8x8 up to 24x24)
- Place and customize different cell types:
  - Empty spaces and walls
  - Entrance point
  - Key, supplies, and mana collection points
  - Encounters, treasures, and relics
- Add color requirements to cells (red, orange, yellow, green, blue, purple)
- Create wall boundaries between cells

### Card-Based Gameplay
- Simulates a card drawing system using standard playing cards
- Cards trigger the placement of predetermined shapes on the board
- Shapes are sorted into 5 levels of increasing complexity:
  - Level 1 (Cards 2-4): Simple 1-2 cell shapes
  - Level 2 (Cards 5-6): 3-4 cell shapes
  - Level 3 (Cards 7-8): 4 cell shapes with more complex arrangements
  - Level 4 (Cards 9-10): 5 cell shapes
  - Level 5 (Card A): 6 cell shapes
- Face cards (J, Q, K) trigger automatic encounters

### Advanced Features
- Save, load, and export board designs
- Export boards as PNG images
- Randomized board generation with customizable parameters
- Shape transformation (rotation and flipping)
- Real-time tracking of board coverage progress

## Action Shapes Reference

There are five levels of action shapes, each triggered by specific card values:

Level: 1 
Draw values: 2, 3, 4
Number of tiles: 1, 2
Number of shapes: 2

1.1 |X| 
1.2 |XX|

Level: 2
Draw values: 5, 6
Number of tiles: 3, 4 
Number of shapes: 3

2.1 |XXX|

2.2 |XX|
    |X.|
    
2.3 |XX|
    |XX|

Level: 3
Draw values: 7, 8
Number of tiles: 4
Number of shapes: 3
3.1 |XXXX|

3.2 |XXX|
    |X..|

3.3 |.X|
    |XX|
    |X.|

Level: 4
Draw values: 9, 10
Number of tiles: 5
Number of shapes: 4
4.1 |XXXXX|

4.2 |XXXX|
    |X...|

4.3 |.X.|
    |XXX|
    |.X.|

4.4 |.XX|
    |.X.|
    |XX.|

Level: 5
Draw values: A 
Number of tiles: 6
Number of shapes: 4

5.1 |XXXXXX|
5.2 |XXXXX|
     |X....|
5.3 |XXX|
    |XXX|
5.4 |XX|
    |XX|
    |XX|

## Technical Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/dungeon-designer.git
   cd dungeon-designer

2. Install dependencies:
   ```bash
    npm install
    ```

3. Start the development server:
    ```bash
    npm run dev
    ```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production
1. Build the project:
   ```bash
   npm run build
   ```

The production files will be generated in the dist folder.

Technologies Used
React 18 with TypeScript
Vite for fast development and builds
Tailwind CSS for styling
Lucide React for icons
HTML Canvas API for image export
How to Play
Design your dungeon by placing walls, special cells, and challenges
Use the Card Draw Simulator to draw cards and place shapes on the board
Traverse the dungeon by placing shapes that connect to the entrance
Collect keys, supplies, mana, and treasures as you explore
Avoid or resolve encounters
Reach and collect the relics to complete the dungeon
License
MIT