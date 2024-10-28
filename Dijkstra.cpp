#include "raylib.h"
#include <stdio.h>
#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>

#define GRID_COLUMNS 20
#define GRID_ROWS 15
#define TILE_SIZE 40

typedef struct {
    int posX, posY;
} Position;

typedef struct {
    int pathCost;
    bool processed;
    bool wall;
    Position previous;
} PathNode;

typedef struct {
    Position *elements;
    int *priority;
    int itemCount;
} MinHeap;

PathNode maze[GRID_COLUMNS][GRID_ROWS];

// Function prototypes
void SetupMaze();
Position ExtractMin(MinHeap *heap);
void ShortestPathDijkstra(Position startPos, Position endPos);
void RenderPath(Position endPos);
void ProcessMouseInput(Position *startPos, Position *endPos, bool *calculatePath);
MinHeap *InitializeMinHeap(int capacity);
void Insert(MinHeap *heap, Position pos, int priority);
Position RemoveMin(MinHeap *heap);
bool HeapIsEmpty(MinHeap *heap);

void SetupMaze() {
    for (int col = 0; col < GRID_COLUMNS; col++) {
        for (int row = 0; row < GRID_ROWS; row++) {
            maze[col][row].pathCost = 1;
            maze[col][row].processed = false;
            maze[col][row].wall = false;
            maze[col][row].previous = (Position){ -1, -1 };
        }
    }
}

MinHeap *InitializeMinHeap(int capacity) {
    MinHeap *heap = (MinHeap *)malloc(sizeof(MinHeap));
    heap->elements = (Position *)malloc(capacity * sizeof(Position));
    heap->priority = (int *)malloc(capacity * sizeof(int));
    heap->itemCount = 0;
    return heap;
}

bool HeapIsEmpty(MinHeap *heap) {
    return heap->itemCount == 0;
}

void Insert(MinHeap *heap, Position pos, int priority) {
    heap->elements[heap->itemCount] = pos;
    heap->priority[heap->itemCount] = priority;
    heap->itemCount++;
    
    // Min-heapify up
    for (int i = heap->itemCount - 1; i > 0; i--) {
        if (heap->priority[i] < heap->priority[(i - 1) / 2]) {
            Position tempPos = heap->elements[i];
            heap->elements[i] = heap->elements[(i - 1) / 2];
            heap->elements[(i - 1) / 2] = tempPos;

            int tempPriority = heap->priority[i];
            heap->priority[i] = heap->priority[(i - 1) / 2];
            heap->priority[(i - 1) / 2] = tempPriority;
        } else {
            break;
        }
    }
}

Position RemoveMin(MinHeap *heap) {
    Position minElement = heap->elements[0];
    heap->elements[0] = heap->elements[heap->itemCount - 1];
    heap->priority[0] = heap->priority[heap->itemCount - 1];
    heap->itemCount--;

    // Min-heapify down
    int currentIdx = 0;
    while (currentIdx < heap->itemCount / 2) {
        int left = 2 * currentIdx + 1;
        int right = 2 * currentIdx + 2;
        int smallest = left;

        if (right < heap->itemCount && heap->priority[right] < heap->priority[left]) {
            smallest = right;
        }

        if (heap->priority[currentIdx] > heap->priority[smallest]) {
            Position tempPos = heap->elements[currentIdx];
            heap->elements[currentIdx] = heap->elements[smallest];
            heap->elements[smallest] = tempPos;

            int tempPriority = heap->priority[currentIdx];
            heap->priority[currentIdx] = heap->priority[smallest];
            heap->priority[smallest] = tempPriority;

            currentIdx = smallest;
        } else {
            break;
        }
    }

    return minElement;
}

void ShortestPathDijkstra(Position startPos, Position endPos) {
    int distances[GRID_COLUMNS][GRID_ROWS];
    bool visitedNodes[GRID_COLUMNS][GRID_ROWS];

    for (int col = 0; col < GRID_COLUMNS; col++) {
        for (int row = 0; row < GRID_ROWS; row++) {
            distances[col][row] = INT_MAX;
            visitedNodes[col][row] = false;
            maze[col][row].previous = (Position){ -1, -1 };
        }
    }

    distances[startPos.posX][startPos.posY] = 0;
    MinHeap *heap = InitializeMinHeap(GRID_COLUMNS * GRID_ROWS);
    Insert(heap, startPos, 0);

    while (!HeapIsEmpty(heap)) {
        Position currPos = RemoveMin(heap);
        if (visitedNodes[currPos.posX][currPos.posY]) continue;

        visitedNodes[currPos.posX][currPos.posY] = true;

        if (currPos.posX == endPos.posX && currPos.posY == endPos.posY) {
            free(heap->elements);
            free(heap->priority);
            free(heap);
            return;
        }

        Position neighbors[] = {
            { 0, 1 }, { 0, -1 }, { 1, 0 }, { -1, 0 }
        };

        for (int k = 0; k < 4; k++) {
            Position neighborPos = { currPos.posX + neighbors[k].posX, currPos.posY + neighbors[k].posY };

            if (neighborPos.posX >= 0 && neighborPos.posX < GRID_COLUMNS && neighborPos.posY >= 0 && neighborPos.posY < GRID_ROWS && !visitedNodes[neighborPos.posX][neighborPos.posY] && !maze[neighborPos.posX][neighborPos.posY].wall) {
                int weight = maze[neighborPos.posX][neighborPos.posY].pathCost;

                if (distances[currPos.posX][currPos.posY] + weight < distances[neighborPos.posX][neighborPos.posY]) {
                    distances[neighborPos.posX][neighborPos.posY] = distances[currPos.posX][currPos.posY] + weight;
                    maze[neighborPos.posX][neighborPos.posY].previous = currPos;
                    Insert(heap, neighborPos, distances[neighborPos.posX][neighborPos.posY]);
                }
            }
        }
    }

    free(heap->elements);
    free(heap->priority);
    free(heap);
}

void RenderPath(Position endPos) {
    Position current = endPos;

    while (maze[current.posX][current.posY].previous.posX != -1 && maze[current.posX][current.posY].previous.posY != -1) {
        DrawRectangle(current.posX * TILE_SIZE, current.posY * TILE_SIZE, TILE_SIZE, TILE_SIZE, BLUE);
        current = maze[current.posX][current.posY].previous;
    }
}

void ProcessMouseInput(Position *startPos, Position *endPos, bool *calculatePath) {
    Vector2 mousePos = GetMousePosition();

    int cellX = mousePos.x / TILE_SIZE;
    int cellY = mousePos.y / TILE_SIZE;

    if (IsMouseButtonPressed(MOUSE_LEFT_BUTTON)) {
        if (cellX >= 0 && cellX < GRID_COLUMNS && cellY >= 0 && cellY < GRID_ROWS) {
            maze[cellX][cellY].wall = !maze[cellX][cellY].wall;
            *calculatePath = true;
        }
    }

    if (IsMouseButtonPressed(MOUSE_RIGHT_BUTTON)) {
        if (cellX >= 0 && cellX < GRID_COLUMNS && cellY >= 0 && cellY < GRID_ROWS) {
            if (IsKeyDown(KEY_LEFT_SHIFT)) {
                *endPos = (Position){ cellX, cellY };
            } else {
                *startPos = (Position){ cellX, cellY };
            }
            *calculatePath = true;
        }
    }
}

int main(void) {
    const int screenW = GRID_COLUMNS * TILE_SIZE;
    const int screenH = GRID_ROWS * TILE_SIZE;

    InitWindow(screenW, screenH, "Modified Dijkstra's Pathfinding");

    Position startPos = { 0, 0 };
    Position endPos = { GRID_COLUMNS - 1, GRID_ROWS - 1 };
    bool calculatePath = true;

    SetupMaze();
    ShortestPathDijkstra(startPos, endPos);  

    SetTargetFPS(60);

    while (!WindowShouldClose()) {
        ProcessMouseInput(&startPos, &endPos, &calculatePath);

        if (calculatePath) {
            ShortestPathDijkstra(startPos, endPos);
            calculatePath = false;
        }

        BeginDrawing();
        ClearBackground(RAYWHITE);

        for (int col = 0; col < GRID_COLUMNS; col++) {
            for (int row = 0; row < GRID_ROWS; row++) {
                Color tileColor = maze[col][row].wall ? BLACK : LIGHTGRAY;
                DrawRectangle(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE, tileColor);
                DrawRectangleLines(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE, DARKGRAY);
            }
        }

        DrawRectangle(startPos.posX * TILE_SIZE, startPos.posY * TILE_SIZE, TILE_SIZE, TILE_SIZE, GREEN);
        DrawRectangle(endPos.posX * TILE_SIZE, endPos.posY * TILE_SIZE, TILE_SIZE, TILE_SIZE, RED);

        RenderPath(endPos);

        DrawText("Left click to toggle walls", 10, screenH - 40, 20, BLACK);
        DrawText("Right click to set start (Shift+Right click to set end)", 10, screenH - 20, 20, BLACK);

        EndDrawing();
    }

    CloseWindow();
    return 0;
}
