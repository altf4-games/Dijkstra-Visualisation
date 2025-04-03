import React, { useState, useEffect, useRef } from 'react';
import Dialog from './components/Dialog';
import PriorityQueue from './utils/PriorityQueue';
import { initializeGrid, resetGridKeepingWalls } from './utils/gridUtils';

const GRID_COLUMNS = 20;
const GRID_ROWS = 15;
const TILE_SIZE = 30;

const DijkstraVisualizer = () => {
  const [grid, setGrid] = useState([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [endPos, setEndPos] = useState({ x: GRID_COLUMNS - 1, y: GRID_ROWS - 1 });
  const [mouseDown, setMouseDown] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [visualizationSpeed, setVisualizationSpeed] = useState(20);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [currentlyAnimating, setCurrentlyAnimating] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resetRequired, setResetRequired] = useState(false);
  const animationTimeouts = useRef([]);

  const sourceCode = `
  // Dijkstra's Pathfinding Algorithm with Priority Queue
  import React, { useState, useEffect, useRef } from 'react';

  const GRID_COLUMNS = 20;
  const GRID_ROWS = 15;
  const TILE_SIZE = 30;

  // Priority Queue implementation
  class PriorityQueue {
    constructor() {
      this.values = [];
    }
    
    enqueue(element, priority) {
      this.values.push({ element, priority });
      this.sort();
    }
    
    dequeue() {
      return this.values.shift();
    }
    
    sort() {
      this.values.sort((a, b) => a.priority - b.priority);
    }
    
    isEmpty() {
      return this.values.length === 0;
    }
  }

  // Dijkstra's algorithm
  const runDijkstra = (grid, startPos, endPos) => {
    const visitedNodesInOrder = [];
    const pq = new PriorityQueue();
    
    // Set distance for start node to 0
    grid[startPos.x][startPos.y].distance = 0;
    pq.enqueue({ x: startPos.x, y: startPos.y }, 0);
    
    while (!pq.isEmpty()) {
      const { element: currentNode } = pq.dequeue();
      const { x, y } = currentNode;
      
      if (grid[x][y].isVisited) continue;
      
      grid[x][y].isVisited = true;
      visitedNodesInOrder.push({ x, y });
      
      if (x === endPos.x && y === endPos.y) break;
      
      // Get neighbors (up, right, down, left)
      const neighbors = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 }
      ];
      
      neighbors.forEach(neighbor => {
        const { x: nx, y: ny } = neighbor;
        
        if (nx >= 0 && nx < GRID_COLUMNS && ny >= 0 && ny < GRID_ROWS && 
            !grid[nx][ny].isVisited && !grid[nx][ny].isWall) {
          const newDistance = grid[x][y].distance + grid[nx][ny].weight;
          
          if (newDistance < grid[nx][ny].distance) {
            grid[nx][ny].distance = newDistance;
            grid[nx][ny].previousNode = { x, y };
            pq.enqueue({ x: nx, y: ny }, newDistance);
          }
        }
      });
    }
    
    return visitedNodesInOrder;
  };

  // Trace back the path from end to start
  const getShortestPath = (grid, endPos, startPos) => {
    const path = [];
    let current = { x: endPos.x, y: endPos.y };
    
    while (current && (current.x !== startPos.x || current.y !== startPos.y)) {
      path.unshift({ x: current.x, y: current.y });
      current = grid[current.x][current.y].previousNode;
      if (!current) break;
    }
    
    return path;
  };`;

  useEffect(() => {
    setGrid(initializeGrid(GRID_COLUMNS, GRID_ROWS));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const clearAnimations = () => {
    animationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    animationTimeouts.current = [];
  };

  const loadRandomExample = () => {
    const newGrid = initializeGrid(GRID_COLUMNS, GRID_ROWS);

    for (let i = 0; i < GRID_COLUMNS; i++) {
      for (let j = 0; j < GRID_ROWS; j++) {
        if (Math.random() < 0.3 && !(i === startPos.x && j === startPos.y)) {
          newGrid[i][j].isWall = true;
        }
      }
    }

    let randomEndPos;
    do {
      randomEndPos = {
        x: Math.floor(Math.random() * GRID_COLUMNS),
        y: Math.floor(Math.random() * GRID_ROWS),
      };
    } while (
      newGrid[randomEndPos.x][randomEndPos.y].isWall ||
      (randomEndPos.x === startPos.x && randomEndPos.y === startPos.y)
    );

    newGrid[randomEndPos.x][randomEndPos.y].isWall = false;

    setEndPos(randomEndPos);
    setGrid(newGrid);
    clearAnimations();
    setCurrentlyAnimating([]);
    setResetRequired(false);
  };

  const runDijkstra = () => {
    if (isVisualizing) return;

    setGrid(prevGrid => resetGridKeepingWalls(prevGrid));
    setIsVisualizing(true);

    const newGrid = [...grid];
    const visitedNodesInOrder = [];
    const pq = new PriorityQueue();

    newGrid[startPos.x][startPos.y].distance = 0;
    pq.enqueue({ x: startPos.x, y: startPos.y }, 0);

    while (!pq.isEmpty()) {
      const { element: currentNode } = pq.dequeue();
      const { x, y } = currentNode;

      if (newGrid[x][y].isVisited) continue;

      newGrid[x][y].isVisited = true;
      visitedNodesInOrder.push({ x, y });

      if (x === endPos.x && y === endPos.y) break;

      const neighbors = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 },
      ];

      neighbors.forEach(neighbor => {
        const { x: nx, y: ny } = neighbor;

        if (nx >= 0 && nx < GRID_COLUMNS && ny >= 0 && ny < GRID_ROWS &&
            !newGrid[nx][ny].isVisited && !newGrid[nx][ny].isWall) {
          const newDistance = newGrid[x][y].distance + newGrid[nx][ny].weight;

          if (newDistance < newGrid[nx][ny].distance) {
            newGrid[nx][ny].distance = newDistance;
            newGrid[nx][ny].previousNode = { x, y };
            pq.enqueue({ x: nx, y: ny }, newDistance);
          }
        }
      });
    }

    const path = [];
    let current = { x: endPos.x, y: endPos.y };

    while (current && (current.x !== startPos.x || current.y !== startPos.y)) {
      path.unshift({ x: current.x, y: current.y });
      current = newGrid[current.x][current.y].previousNode;
      if (!current) break;
    }

    animateAlgorithm(visitedNodesInOrder, path);
  };

  const animateAlgorithm = (visitedNodesInOrder, path) => {
    clearAnimations();

    visitedNodesInOrder.forEach((node, index) => {
      const timeout = setTimeout(() => {
        setGrid(prevGrid => {
          const newGrid = prevGrid.map(col => col.map(cell => ({ ...cell })));
          newGrid[node.x][node.y] = {
            ...newGrid[node.x][node.y],
            isAnimating: true,
            isVisited: true,
          };
          return newGrid;
        });

        setCurrentlyAnimating(prev => [...prev, node]);

        setTimeout(() => {
          setGrid(prevGrid => {
            const newGrid = prevGrid.map(col => col.map(cell => ({ ...cell })));
            newGrid[node.x][node.y] = {
              ...newGrid[node.x][node.y],
              isAnimating: false,
            };
            return newGrid;
          });

          setCurrentlyAnimating(prev => prev.filter(n => n.x !== node.x || n.y !== node.y));
        }, 300);
      }, index * visualizationSpeed);

      animationTimeouts.current.push(timeout);
    });

    const pathStartTime = visitedNodesInOrder.length * visualizationSpeed + 100;

    path.forEach((node, index) => {
      const timeout = setTimeout(() => {
        setGrid(prevGrid => {
          const newGrid = [...prevGrid];
          newGrid[node.x][node.y] = {
            ...newGrid[node.x][node.y],
            isPath: true,
            isAnimating: true,
          };
          return newGrid;
        });

        setTimeout(() => {
          setGrid(prevGrid => {
            const newGrid = [...prevGrid];
            newGrid[node.x][node.y] = {
              ...newGrid[node.x][node.y],
              isAnimating: false,
            };
            return newGrid;
          });

          if (index === path.length - 1) {
            setIsVisualizing(false);
            setResetRequired(true);
          }
        }, 300);
      }, pathStartTime + index * visualizationSpeed);

      animationTimeouts.current.push(timeout);
    });

    if (path.length === 0) {
      setTimeout(() => {
        setIsVisualizing(false);
        setResetRequired(true);
      }, pathStartTime);
    }
  };

  const handleMouseDown = (x, y, event) => {
    if (event.buttons !== 1) return;
    setMouseDown(true);
    handleNodeClick(x, y);
  };

  const handleMouseUp = () => {
    setMouseDown(false);
  };

  const handleMouseEnter = (x, y, event) => {
    if (mouseDown && event.buttons === 1) {
      handleNodeClick(x, y);
    }
  };

  const handleNodeClick = (x, y) => {
    if (isVisualizing) return;

    if (isShiftPressed) {
      if (x === startPos.x && y === startPos.y) return;
      if (grid[x][y].isWall) return;

      setEndPos({ x, y });
      if (resetRequired) setGrid(prevGrid => resetGridKeepingWalls(prevGrid));
    } else if (x === startPos.x && y === startPos.y) {
      return;
    } else if (x === endPos.x && y === endPos.y) {
      return;
    } else {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(col => col.map(cell => ({ ...cell })));
        newGrid[x][y].isWall = !newGrid[x][y].isWall;
        return newGrid;
      });

      if (resetRequired) setGrid(prevGrid => resetGridKeepingWalls(prevGrid));
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Dijkstra's Pathfinding Visualizer</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={runDijkstra} disabled={isVisualizing} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-300">
          Visualize Dijkstra's Algorithm
        </button>
        <button onClick={() => setGrid(prevGrid => resetGridKeepingWalls(prevGrid))} disabled={isVisualizing} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:bg-gray-300">
          Reset Grid
        </button>
        <button onClick={() => setGrid(initializeGrid(GRID_COLUMNS, GRID_ROWS))} disabled={isVisualizing} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-red-300">
          Clear All
        </button>
        <button onClick={loadRandomExample} disabled={isVisualizing} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-green-300">
          Load Random Example
        </button>
        <button onClick={() => setIsDialogOpen(true)} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
          View Code
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500"></div><span>Start Node</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500"></div><span>End Node</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-black"></div><span>Wall</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-300"></div><span>Visited Node</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-400"></div><span>Shortest Path</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 animate-pulse"></div><span>Animating</span></div>
      </div>
      <div id="grid-container" className="border border-gray-300 rounded shadow-md relative" style={{ width: GRID_COLUMNS * TILE_SIZE, height: GRID_ROWS * TILE_SIZE, display: 'grid', gridTemplateColumns: `repeat(${GRID_COLUMNS}, ${TILE_SIZE}px)`, gridTemplateRows: `repeat(${GRID_ROWS}, ${TILE_SIZE}px)` }} onMouseUp={handleMouseUp} onMouseLeave={() => setMouseDown(false)}>
        {grid.length > 0 && grid.map((column, x) => column.map((node, y) => {
          const isStart = x === startPos.x && y === startPos.y;
          const isEnd = x === endPos.x && y === endPos.y;
          const isCurrentlyAnimating = currentlyAnimating.some(n => n.x === x && n.y === y);

          let className = "transition-colors duration-300 border border-gray-200 ";
          if (isStart) className += "bg-green-500 cursor-grab";
          else if (isEnd) className += "bg-red-500 cursor-grab";
          else if (node.isWall) className += "bg-black";
          else if (node.isPath) className += "bg-yellow-400";
          else if (node.isVisited) className += "bg-blue-300";
          else className += "bg-white hover:bg-gray-100";
          if (isCurrentlyAnimating) className += " animate-pulse bg-blue-500";

          return (
            <div key={`${x}-${y}`} className={className} style={{ width: TILE_SIZE, height: TILE_SIZE, gridColumn: x + 1, gridRow: y + 1, zIndex: isStart || isEnd ? 10 : 0, transform: isCurrentlyAnimating ? 'scale(1.1)' : 'scale(1)' }} onMouseDown={(event) => handleMouseDown(x, y, event)} onMouseEnter={(event) => handleMouseEnter(x, y, event)} />
          );
        }))}
      </div>
      <div className="mt-6 text-sm text-gray-500">Made with React • Animations powered by CSS Transitions</div>
      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Dijkstra's Algorithm Implementation">
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{sourceCode}</pre>
      </Dialog>
    </div>
  );
};

export default DijkstraVisualizer;