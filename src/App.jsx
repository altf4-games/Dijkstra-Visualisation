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
  const [isCtrlPressed, setIsCtrlPressed] = useState(false); // For weight adjustment
  const [visualizationSpeed, setVisualizationSpeed] = useState(1000);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [currentlyAnimating, setCurrentlyAnimating] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resetRequired, setResetRequired] = useState(false);
  const [showWeights, setShowWeights] = useState(true);
  const [currentOperation, setCurrentOperation] = useState(null);
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
      if (e.key === 'Control') setIsCtrlPressed(true);
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
      if (e.key === 'Control') setIsCtrlPressed(false);
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

    // Add random walls
    for (let i = 0; i < GRID_COLUMNS; i++) {
      for (let j = 0; j < GRID_ROWS; j++) {
        if (Math.random() < 0.3 && !(i === startPos.x && j === startPos.y)) {
          newGrid[i][j].isWall = true;
        }
      }
    }

    // Add random weights (1-5) to non-wall cells
    for (let i = 0; i < GRID_COLUMNS; i++) {
      for (let j = 0; j < GRID_ROWS; j++) {
        if (!newGrid[i][j].isWall) {
          // Higher probability for weight=1 for better visualization
          const rand = Math.random();
          if (rand < 0.6) {
            newGrid[i][j].weight = 1;
          } else if (rand < 0.8) {
            newGrid[i][j].weight = 2;
          } else if (rand < 0.9) {
            newGrid[i][j].weight = 3;
          } else if (rand < 0.95) {
            newGrid[i][j].weight = 4;
          } else {
            newGrid[i][j].weight = 5;
          }
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
    const allOperations = []; // Track all algorithm operations in sequence

    // Initialize
    allOperations.push({
      type: 'initialize',
      position: { x: startPos.x, y: startPos.y },
      message: 'Setting start node distance to 0'
    });

    newGrid[startPos.x][startPos.y].distance = 0;
    pq.enqueue({ x: startPos.x, y: startPos.y }, 0);
    
    allOperations.push({
      type: 'enqueue',
      position: { x: startPos.x, y: startPos.y },
      message: `Enqueue start node with priority 0`
    });

    while (!pq.isEmpty()) {
      const { element: currentNode } = pq.dequeue();
      const { x, y } = currentNode;
      
      allOperations.push({
        type: 'dequeue',
        position: { x, y },
        message: `Dequeue node (${x},${y}) with distance ${newGrid[x][y].distance}`
      });

      if (newGrid[x][y].isVisited) {
        allOperations.push({
          type: 'skip',
          position: { x, y },
          message: `Node already visited, skipping`
        });
        continue;
      }

      newGrid[x][y].isVisited = true;
      
      allOperations.push({
        type: 'visit',
        position: { x, y },
        message: `Mark node as visited, distance: ${newGrid[x][y].distance}`
      });
      
      visitedNodesInOrder.push({ x, y });

      if (x === endPos.x && y === endPos.y) {
        allOperations.push({
          type: 'found',
          position: { x, y },
          message: `End node found! Total distance: ${newGrid[x][y].distance}`
        });
        break;
      }

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
          
          allOperations.push({
            type: 'check',
            position: { x: nx, y: ny },
            message: `Checking neighbor (${nx},${ny}), current: ${newGrid[nx][ny].distance}, new: ${newDistance}`
          });

          if (newDistance < newGrid[nx][ny].distance) {
            newGrid[nx][ny].distance = newDistance;
            newGrid[nx][ny].previousNode = { x, y };
            pq.enqueue({ x: nx, y: ny }, newDistance);
            
            allOperations.push({
              type: 'update',
              position: { x: nx, y: ny },
              message: `Update distance to ${newDistance} and enqueue`
            });
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

    animateAlgorithm(visitedNodesInOrder, path, allOperations);
  };

  const animateAlgorithm = (visitedNodesInOrder, path, allOperations) => {
    clearAnimations();

    // Animate all operations in sequence
    allOperations.forEach((operation, index) => {
      const timeout = setTimeout(() => {
        setCurrentOperation(operation);
        
        // Highlight the node associated with the operation
        const { x, y } = operation.position;
        
        // Only modify the grid for certain operations
        if (['visit', 'update', 'check'].includes(operation.type)) {
          setGrid(prevGrid => {
            const newGrid = prevGrid.map(col => col.map(cell => ({ ...cell })));
            
            // Only mark as visited for 'visit' operations
            if (operation.type === 'visit') {
              newGrid[x][y].isVisited = true;
            }
            
            newGrid[x][y] = {
              ...newGrid[x][y],
              isAnimating: true,
            };
            return newGrid;
          });

          setCurrentlyAnimating(prev => [...prev, { x, y }]);

          setTimeout(() => {
            setGrid(prevGrid => {
              const newGrid = prevGrid.map(col => col.map(cell => ({ ...cell })));
              newGrid[x][y] = {
                ...newGrid[x][y],
                isAnimating: false,
              };
              return newGrid;
            });

            setCurrentlyAnimating(prev => prev.filter(n => n.x !== x || n.y !== y));
          }, 300);
        }
      }, index * visualizationSpeed);

      animationTimeouts.current.push(timeout);
    });

    // Path animation starts after all operations
    const pathStartTime = allOperations.length * visualizationSpeed + 100;

    path.forEach((node, index) => {
      const timeout = setTimeout(() => {
        setCurrentOperation({
          type: 'path',
          position: { x: node.x, y: node.y },
          message: `Path node (${node.x},${node.y}), part ${index + 1} of ${path.length}`
        });
        
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
      // Set end position
      if (x === startPos.x && y === startPos.y) return;
      if (grid[x][y].isWall) return;

      setEndPos({ x, y });
      if (resetRequired) setGrid(prevGrid => resetGridKeepingWalls(prevGrid));
    } else if (isCtrlPressed) {
      // Change node weight (1-5)
      if (x === startPos.x && y === startPos.y || x === endPos.x && y === endPos.y || grid[x][y].isWall) return;
      
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(col => col.map(cell => ({ ...cell })));
        // Cycle through weights 1->2->3->4->5->1
        newGrid[x][y].weight = (newGrid[x][y].weight % 5) + 1;
        return newGrid;
      });
      
      if (resetRequired) setGrid(prevGrid => resetGridKeepingWalls(prevGrid));
    } else if (x === startPos.x && y === startPos.y) {
      return;
    } else if (x === endPos.x && y === endPos.y) {
      return;
    } else {
      // Toggle wall
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(col => col.map(cell => ({ ...cell })));
        newGrid[x][y].isWall = !newGrid[x][y].isWall;
        return newGrid;
      });

      if (resetRequired) setGrid(prevGrid => resetGridKeepingWalls(prevGrid));
    }
  };

  const getWeightColor = (weight) => {
    switch(weight) {
      case 1: return 'bg-gray-50';
      case 2: return 'bg-orange-50';
      case 3: return 'bg-orange-100';
      case 4: return 'bg-orange-200';
      case 5: return 'bg-orange-300';
      default: return 'bg-gray-50';
    }
  };

  const AlgorithmVisualizer = () => {
    const getOperationColor = (type) => {
      switch(type) {
        case 'initialize': return 'bg-purple-100 border-purple-500';
        case 'enqueue': return 'bg-green-100 border-green-500';
        case 'dequeue': return 'bg-yellow-100 border-yellow-500';
        case 'visit': return 'bg-blue-100 border-blue-500';
        case 'check': return 'bg-gray-100 border-gray-500';
        case 'update': return 'bg-orange-100 border-orange-500';
        case 'found': return 'bg-red-100 border-red-500';
        case 'path': return 'bg-yellow-100 border-yellow-500';
        default: return 'bg-gray-50 border-gray-300';
      }
    };

    return currentOperation ? (
      <div className="mt-4 p-4 border-2 rounded-lg w-full max-w-4xl shadow-md animate-pulse">
        <div className="flex items-center gap-3 mb-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getOperationColor(currentOperation.type)}`}>
            {currentOperation.type.toUpperCase()}
          </div>
          <div className="font-mono">
            Position: ({currentOperation.position.x}, {currentOperation.position.y})
          </div>
        </div>
        <p className="text-gray-700">{currentOperation.message}</p>
      </div>
    ) : null;
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-gray-800 drop-shadow-sm">Dijkstra's Pathfinding Visualizer</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 w-full max-w-4xl">
        <div className="flex flex-wrap gap-4 mb-6">
          <button 
            onClick={runDijkstra} 
            disabled={isVisualizing} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Visualize Algorithm
          </button>
          
          <button 
            onClick={() => setGrid(prevGrid => resetGridKeepingWalls(prevGrid))} 
            disabled={isVisualizing} 
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-300 shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21h5v-5"></path></svg>
            Reset Grid
          </button>
          
          <button 
            onClick={() => setGrid(initializeGrid(GRID_COLUMNS, GRID_ROWS))} 
            disabled={isVisualizing} 
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-300 shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
            Clear All
          </button>
          
          <button 
            onClick={loadRandomExample} 
            disabled={isVisualizing} 
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-300 shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"></path><path d="M2 20h20"></path><path d="M14 12v.01"></path></svg>
            Random Maze
          </button>
          
          <button 
            onClick={() => setIsDialogOpen(true)} 
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
            View Code
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label htmlFor="speed-slider" className="font-medium text-gray-700 w-40">Animation Speed:</label>
            <input 
              id="speed-slider" 
              type="range" 
              min="5" 
              max="100" 
              value={100 - visualizationSpeed} 
              onChange={(e) => setVisualizationSpeed(100 - parseInt(e.target.value))} 
              disabled={isVisualizing}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="w-16 text-center">{visualizationSpeed < 20 ? 'Fast' : visualizationSpeed < 50 ? 'Medium' : 'Slow'}</span>
          </div>
          
          {/* <div className="flex items-center gap-4">
            <label htmlFor="weights-toggle" className="font-medium text-gray-700 w-40">Show Node Weights:</label>
            <div className="relative inline-block w-12 h-6 rounded-full cursor-pointer">
              <input 
                id="weights-toggle" 
                type="checkbox" 
                className="sr-only" 
                checked={showWeights} 
                onChange={() => setShowWeights(!showWeights)} 
              />
              <div className={`block w-12 h-6 rounded-full ${showWeights ? 'bg-blue-600' : 'bg-gray-300'} transition`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showWeights ? 'transform translate-x-6' : ''}`}></div>
            </div>
          </div> */}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 w-full max-w-4xl">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Instructions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Start Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>End Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-black rounded"></div>
                <span>Wall</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-300 rounded"></div>
                <span>Visited Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span>Shortest Path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 animate-pulse rounded shadow-lg"></div>
                <span>Animating</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p><span className="font-medium">Click:</span> Place/Remove walls</p>
            <p><span className="font-medium">Shift + Click:</span> Move end point</p>
            <p><span className="font-medium">Ctrl + Click:</span> Change node weight (1-5)</p>
            <div className="flex items-center gap-2">
              <span className="font-medium">Node Weights:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(w => (
                  <div key={w} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${getWeightColor(w)} border border-gray-200`}>
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div 
        id="grid-container" 
        className="border border-gray-300 rounded-lg shadow-lg relative bg-white"
        style={{ 
          width: GRID_COLUMNS * TILE_SIZE, 
          height: GRID_ROWS * TILE_SIZE, 
          display: 'grid', 
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, ${TILE_SIZE}px)`, 
          gridTemplateRows: `repeat(${GRID_ROWS}, ${TILE_SIZE}px)` 
        }} 
        onMouseUp={handleMouseUp} 
        onMouseLeave={() => setMouseDown(false)}
      >
        {grid.length > 0 && grid.map((column, x) => column.map((node, y) => {
          const isStart = x === startPos.x && y === startPos.y;
          const isEnd = x === endPos.x && y === endPos.y;
          const isCurrentlyAnimating = currentlyAnimating.some(n => n.x === x && n.y === y);
          const weightClass = getWeightColor(node.weight);

          let className = "transition-all duration-300 border border-gray-200 relative ";
          
          if (isStart) {
            className += "bg-green-500 cursor-grab";
          } else if (isEnd) {
            className += "bg-red-500 cursor-grab";
          } else if (node.isWall) {
            className += "bg-gray-800";
          } else if (node.isPath) {
            className += "bg-yellow-400";
          } else if (node.isVisited) {
            className += "bg-blue-300";
          } else {
            className += `${weightClass} hover:bg-gray-100`;
          }
          
          if (isCurrentlyAnimating) {
            className += " animate-pulse bg-blue-500 border-2 border-blue-700 shadow-lg z-10";
          }

          return (
            <div 
              key={`${x}-${y}`} 
              className={className} 
              style={{ 
                width: TILE_SIZE, 
                height: TILE_SIZE, 
                gridColumn: x + 1, 
                gridRow: y + 1, 
                zIndex: isStart || isEnd ? 10 : 0, 
                transform: isCurrentlyAnimating ? 'scale(1.15)' : 'scale(1)' 
              }}
              onMouseDown={(event) => handleMouseDown(x, y, event)} 
              onMouseEnter={(event) => handleMouseEnter(x, y, event)}
            >
              {showWeights && !isStart && !isEnd && !node.isWall && node.weight > 1 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                  {node.weight}
                </div>
              )}
              {isStart && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                  </svg>
                </div>
              )}
              {isEnd && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
              )}
            </div>
          );
        }))}
      </div>
      
      {isVisualizing && <AlgorithmVisualizer />}
      
      <div className="mt-6 text-sm text-gray-500 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v6.5"></path><path d="M18.4 19.5a9 9 0 1 1 0-15"></path><path d="M22 12h-6.5"></path></svg>
        Made with React • Animations powered by CSS Transitions
      </div>
      
      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Dijkstra's Algorithm Implementation">
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{sourceCode}</pre>
      </Dialog>
    </div>
  );
};

export default DijkstraVisualizer;