# Dungeon Designer

## Purpose
Dungeon Designer is a tool for designing 2D game boards for table top games.
This was originally generated with BOLT AI as a proof of concept on using AI code generation to quickly spin up tools to help with game design.

## Tiles / Action Shapes

There are five levels of tiles / action shapes, each of increasing size.

Level: 1 
Draw values: 2, 3, 4
Number of tiles: 1, 2
Number of shapes: 2

1.1 |1| 
1.2 |11|

Level: 2
Draw values: 5, 6
Number of tiles: 3, 4 
Number of shapes: 3

2.1 |111|

2.2 |11|
    |10|
    
2.3 |11|
    |11|

Level: 3
Draw values: 7, 8
Number of tiles: 4
Number of shapes: 3
3.1 |1111|

3.2 |111|
    |100|

3.3 |01|
    |11|
    |10|

Level: 4
Draw values: 9, 10
Number of tiles: 5
Number of shapes: 4
4.1 |11111|

4.2 |1111|
    |1000|

4.3 |010|
    |111|
    |010|

4.4 |011|
    |010|
    |110|

Level: 5
Draw values: A 
Number of tiles: 6
Number of shapes: 4

5.1 |111111|
5.2 |11111|
    |X0000|
5.3 |111|
    |111|
5.4 |11|
    |11|
    |11|

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/geoff-maddock/dungeon-designer)