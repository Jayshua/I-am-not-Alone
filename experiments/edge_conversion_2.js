var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

Array.prototype.window = function(lambda) {
  for (var i = 0; i < this.length - 1; i++) {
    lambda([this[i], this[i + 1]], i);
  }
};





let gridWidth = 8;
let gridHeight = 7;
let Grid = {};
// For ease of use purposes, requesting a cell outside of the grid always returns 0
Grid.cellAbove = (grid, x, y) => Grid.cellAt(grid, x, y - 1);
Grid.cellBelow = (grid, x, y) => Grid.cellAt(grid, x, y + 1);
Grid.cellLeft  = (grid, x, y) => Grid.cellAt(grid, x - 1, y);
Grid.cellRight = (grid, x, y) => Grid.cellAt(grid, x + 1, y);

let grid = [
  1, 1, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 1, 0, 0, 0, 1,
  1, 0, 0, 1, 1, 1, 0, 1,
  1, 0, 0, 1, 1, 1, 1, 0,
  1, 0, 0, 1, 1, 1, 0, 1,
  1, 0, 0, 0, 0, 0, 0, 1,
  1, 1, 1, 1, 1, 1, 1, 1
];


let horizontalEdges = Array((gridHeight + 1) * gridWidth).fill(false);
let verticalEdges = Array((gridWidth + 1) * gridHeight).fill(false);
let cellAt = (x, y) =>
  (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight)
  ? 0
  : grid[y * gridWidth + x];

for (let i = 0; i < grid.length; i++) {
  let x = i % gridWidth;
  let y = Math.floor(i / gridWidth);
  horizontalEdges[x + y * gridWidth] = cellAt(x, y - 1) !== grid[i];
  horizontalEdges[x + (y + 1) * gridWidth] = cellAt(x, y + 1) !== grid[i];
  verticalEdges[y + x * gridHeight] = cellAt(x - 1, y) !== grid[i];
  verticalEdges[y + (x + 1) * gridHeight] = cellAt(x + 1, y) !== grid[i];
}


let edges = [];

// Append horizontal edges
for (let y = 0; y < gridHeight + 1; y++) {
  let currentPoint = horizontalEdges[y * gridWidth] ? {x: 0, y} : null;

  for (let x = 0; x < gridWidth - 1; x++) {
    let i = x + y * gridWidth;
    if (horizontalEdges[i] !== horizontalEdges[i + 1]) {
      if (currentPoint === null) {
        currentPoint = {x: x + 1, y};
      } else {
        edges.push({begin: currentPoint, end: {x: x + 1, y}});
        currentPoint = null;
      }
    }
  }
  
  if (currentPoint !== null) {
    edges.push({begin: currentPoint, end: {x: gridWidth, y}});
  }
}


for (let x = 0; x < gridWidth + 1; x++) {
  let currentPoint = verticalEdges[x * gridHeight] ? {x, y: 0} : null;

  for (let y = 0; y < gridHeight - 1; y++) {
    let i = y + x * gridHeight;

    if (verticalEdges[i] !== verticalEdges[i + 1]) {
      if (currentPoint === null) {
        currentPoint = {x, y: y + 1};
      } else {
        edges.push({begin: currentPoint, end: {x, y: y + 1}});
        currentPoint = null;
      }
    }
  }

  if (currentPoint !== null) {
    edges.push({begin: currentPoint, end: {x, y: gridHeight}});
  }
}


console.log(edges.length);


let cellWidth = 15;
let cellHeight = 15;

ctx.fillStyle = "black";
ctx.beginPath();
for (let i = 0; i < grid.length; i++) {
  let cellX = i % gridWidth;
  let cellY = Math.floor(i / gridWidth);
  let cell = grid[i];
  if (cell == 0) continue;
  let x = cellWidth * cellX;
  let y = cellHeight * cellY;
  ctx.moveTo(x, y);
  ctx.lineTo(x + cellWidth, y);
  ctx.lineTo(x + cellWidth, y + cellHeight);
  ctx.lineTo(x, y + cellHeight);
}
ctx.fill();


ctx.fillStyle = "red";
for (let i = 0; i < horizontalEdges.length; i++) { 
  let x = (i % gridWidth) * cellWidth;
  let y = Math.floor(i / gridWidth) * cellHeight;
  if (horizontalEdges[i])
    ctx.fillRect(x, y, cellWidth, 2);
}

debugger;
ctx.fillStyle = "green";
for (let i = 0; i < verticalEdges.length; i++) {
  let x = Math.floor(i / gridHeight) * cellWidth;
  let y = (i % gridHeight) * cellHeight;
  if (verticalEdges[i])
    ctx.fillRect(x, y, 2, cellHeight);
}

ctx.strokeStyle = "blue";
ctx.beginPath();
edges.forEach(edge => {
  ctx.moveTo(edge.begin.x * cellWidth, edge.begin.y * cellHeight);
  ctx.lineTo(edge.end.x * cellWidth, edge.end.y * cellHeight);
});
ctx.stroke();





















// console.log(verticalEdges);

// ctx.beginPath();
// for (let i = 0; i < grid.length; i++) {
//   if (grid[i] == 0) continue;
//   let x = (i % gridWidth) * cellWidth;
//   let y = Math.floor(i / gridWidth) * cellHeight;
//   ctx.moveTo(x, y);
//   ctx.lineTo(x + cellWidth, y);
//   ctx.lineTo(x + cellWidth, y + cellHeight);
//   ctx.lineTo(x, y + cellHeight);
// }

// ctx.fillStyle = "red";
// ctx.fill();