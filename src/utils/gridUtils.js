export const initializeGrid = (columns, rows) => {
  return Array(columns)
    .fill()
    .map(() =>
      Array(rows)
        .fill()
        .map(() => ({
          isWall: false,
          distance: Infinity,
          isVisited: false,
          previousNode: null,
          isPath: false,
          isAnimating: false,
          weight: 1,
        }))
    );
};

export const resetGridKeepingWalls = (grid) => {
  return grid.map((col) =>
    col.map((cell) => ({
      ...cell,
      distance: Infinity,
      isVisited: false,
      previousNode: null,
      isPath: false,
      isAnimating: false,
    }))
  );
};
