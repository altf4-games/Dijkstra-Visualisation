#include "raylib.h"
#include <stdio.h>
#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>

#define GRID_WIDTH 20
#define GRID_HEIGHT 15
#define CELL_SIZE 40

typedef struct {
    int x, y;
} Vector2D;

typedef struct {
    int cost;
    bool visited;
    bool isWall;
    Vector2D prev;
} Node;

typedef struct {
    Vector2D *nodes;
    int *distances;
    int size;
} PriorityQueue;

Node grid[GRID_WIDTH][GRID_HEIGHT];

// Function prototypes
void InitializeGrid();
Vector2D GetMinDistanceNode(PriorityQueue *pq);
void Dijkstra(Vector2D start, Vector2D end);
void DrawShortestPath(Vector2D end);
void HandleMouseInput(Vector2D *start, Vector2D *end, bool *recalculate);
PriorityQueue *CreatePriorityQueue(int capacity);
void Enqueue(PriorityQueue *pq, Vector2D node, int distance);
Vector2D Dequeue(PriorityQueue *pq);
bool IsEmpty(PriorityQueue *pq);

void InitializeGrid() {
    for (int i = 0; i < GRID_WIDTH; i++) {
        for (int j = 0; j < GRID_HEIGHT; j++) {
            grid[i][j].cost = 1;
            grid[i][j].visited = false;
            grid[i][j].isWall = false;
            grid[i][j].prev = (Vector2D){ -1, -1 };
        }
    }
}

PriorityQueue *CreatePriorityQueue(int capacity) {
    PriorityQueue *pq = (PriorityQueue *)malloc(sizeof(PriorityQueue));
    pq->nodes = (Vector2D *)malloc(capacity * sizeof(Vector2D));
    pq->distances = (int *)malloc(capacity * sizeof(int));
    pq->size = 0;
    return pq;
}

bool IsEmpty(PriorityQueue *pq) {
    return pq->size == 0;
}

void Enqueue(PriorityQueue *pq, Vector2D node, int distance) {
    pq->nodes[pq->size] = node;
    pq->distances[pq->size] = distance;
    pq->size++;
    
    // Bubble up to maintain min-heap property
    for (int i = pq->size - 1; i > 0; i--) {
        if (pq->distances[i] < pq->distances[(i - 1) / 2]) {
            // Swap
            Vector2D tempNode = pq->nodes[i];
            pq->nodes[i] = pq->nodes[(i - 1) / 2];
            pq->nodes[(i - 1) / 2] = tempNode;

            int tempDist = pq->distances[i];
            pq->distances[i] = pq->distances[(i - 1) / 2];
            pq->distances[(i - 1) / 2] = tempDist;
        } else {
            break;
        }
    }
}

Vector2D Dequeue(PriorityQueue *pq) {
    Vector2D minNode = pq->nodes[0];
    pq->nodes[0] = pq->nodes[pq->size - 1];
    pq->distances[0] = pq->distances[pq->size - 1];
    pq->size--;

    // Bubble down to maintain min-heap property
    int index = 0;
    while (index < pq->size / 2) {
        int leftChild = 2 * index + 1;
        int rightChild = 2 * index + 2;
        int smallerChild = leftChild;

        if (rightChild < pq->size && pq->distances[rightChild] < pq->distances[leftChild]) {
            smallerChild = rightChild;
        }

        if (pq->distances[index] > pq->distances[smallerChild]) {
            // Swap
            Vector2D tempNode = pq->nodes[index];
            pq->nodes[index] = pq->nodes[smallerChild];
            pq->nodes[smallerChild] = tempNode;

            int tempDist = pq->distances[index];
            pq->distances[index] = pq->distances[smallerChild];
            pq->distances[smallerChild] = tempDist;

            index = smallerChild;
        } else {
            break;
        }
    }

    return minNode;
}

void Dijkstra(Vector2D start, Vector2D end) {
    int dist[GRID_WIDTH][GRID_HEIGHT];
    bool sptSet[GRID_WIDTH][GRID_HEIGHT];

    for (int i = 0; i < GRID_WIDTH; i++) {
        for (int j = 0; j < GRID_HEIGHT; j++) {
            dist[i][j] = INT_MAX;
            sptSet[i][j] = false;
            grid[i][j].prev = (Vector2D){ -1, -1 };
        }
    }

    dist[start.x][start.y] = 0;
    PriorityQueue *pq = CreatePriorityQueue(GRID_WIDTH * GRID_HEIGHT);
    Enqueue(pq, start, 0);

    while (!IsEmpty(pq)) {
        Vector2D u = Dequeue(pq);
        if (sptSet[u.x][u.y]) continue;

        sptSet[u.x][u.y] = true;

        if (u.x == end.x && u.y == end.y) {
            free(pq->nodes);
            free(pq->distances);
            free(pq);
            return;
        }

        Vector2D directions[] = {
            { 0, 1 }, { 0, -1 }, { 1, 0 }, { -1, 0 }
        };

        for (int i = 0; i < 4; i++) {
            Vector2D v = { u.x + directions[i].x, u.y + directions[i].y };

            if (v.x >= 0 && v.x < GRID_WIDTH && v.y >= 0 && v.y < GRID_HEIGHT && !sptSet[v.x][v.y] && !grid[v.x][v.y].isWall) {
                int weight = grid[v.x][v.y].cost;

                if (dist[u.x][u.y] + weight < dist[v.x][v.y]) {
                    dist[v.x][v.y] = dist[u.x][u.y] + weight;
                    grid[v.x][v.y].prev = u;
                    Enqueue(pq, v, dist[v.x][v.y]);
                }
            }
        }
    }

    free(pq->nodes);
    free(pq->distances);
    free(pq);
}

void DrawShortestPath(Vector2D end) {
    Vector2D curr = end;

    while (grid[curr.x][curr.y].prev.x != -1 && grid[curr.x][curr.y].prev.y != -1) {
        DrawRectangle(curr.x * CELL_SIZE, curr.y * CELL_SIZE, CELL_SIZE, CELL_SIZE, BLUE);
        curr = grid[curr.x][curr.y].prev;
    }
}

void HandleMouseInput(Vector2D *start, Vector2D *end, bool *recalculate) {
    Vector2 mousePosition = GetMousePosition();

    int gridX = mousePosition.x / CELL_SIZE;
    int gridY = mousePosition.y / CELL_SIZE;

    if (IsMouseButtonPressed(MOUSE_LEFT_BUTTON)) {
        if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
            grid[gridX][gridY].isWall = !grid[gridX][gridY].isWall;
            *recalculate = true;
        }
    }

    if (IsMouseButtonPressed(MOUSE_RIGHT_BUTTON)) {
        if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
            if (IsKeyDown(KEY_LEFT_SHIFT)) {
                *end = (Vector2D){ gridX, gridY };
            } else {
                *start = (Vector2D){ gridX, gridY };
            }
            *recalculate = true;
        }
    }
}

int main(void) {
    const int screenWidth = GRID_WIDTH * CELL_SIZE;
    const int screenHeight = GRID_HEIGHT * CELL_SIZE;

    InitWindow(screenWidth, screenHeight, "Dijkstra's Algorithm with Walls");

    Vector2D start = { 0, 0 };
    Vector2D end = { GRID_WIDTH - 1, GRID_HEIGHT - 1 };
    bool recalculate = true;

    InitializeGrid();
    Dijkstra(start, end);  

    SetTargetFPS(60);

    while (!WindowShouldClose()) {
        HandleMouseInput(&start, &end, &recalculate);

        if (recalculate) {
            Dijkstra(start, end);
            recalculate = false;
        }

        BeginDrawing();
        ClearBackground(RAYWHITE);

        for (int i = 0; i < GRID_WIDTH; i++) {
            for (int j = 0; j < GRID_HEIGHT; j++) {
                Color cellColor = grid[i][j].isWall ? BLACK : LIGHTGRAY;
                DrawRectangle(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE, cellColor);
                DrawRectangleLines(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE, DARKGRAY);
            }
        }

        DrawRectangle(start.x * CELL_SIZE, start.y * CELL_SIZE, CELL_SIZE, CELL_SIZE, GREEN);
        DrawRectangle(end.x * CELL_SIZE, end.y * CELL_SIZE, CELL_SIZE, CELL_SIZE, RED);

        DrawShortestPath(end);

        DrawText("Left click to toggle walls", 10, screenHeight - 40, 20, BLACK);
        DrawText("Right click to move start (Shift+Right click for end)", 10, screenHeight - 20, 20, BLACK);

        EndDrawing();
    }

    CloseWindow();
    return 0;
}
