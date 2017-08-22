var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

Array.prototype.window = function(lambda) {
  for (var i = 0; i < this.length - 1; i++) {
    lambda([this[i], this[i + 1]], i);
  }
};



let Grid = (width, height, arr) => ({grid: arr, width, height});
Grid.forEachCell = (grid, lambda) => {
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      lambda(grid.grid[y * grid.width + x], x, y);
    }
  }
};
// For ease of use purposes, requesting a cell outside of the grid always returns 0
Grid.cellAt = (grid, x, y) => {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.width) return 0;
  return grid.grid[y * grid.width + x];
};
Grid.cellAbove = (grid, x, y) => Grid.cellAt(grid, x, y - 1);
Grid.cellBelow = (grid, x, y) => Grid.cellAt(grid, x, y + 1);
Grid.cellLeft  = (grid, x, y) => Grid.cellAt(grid, x - 1, y);
Grid.cellRight = (grid, x, y) => Grid.cellAt(grid, x + 1, y);

let grid = Grid(8, 7, [
  1, 1, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 0, 1, 1, 1, 1, 1,
  1, 0, 0, 1, 0, 1, 0, 1,
  1, 0, 1, 1, 1, 1, 0, 1,
  1, 0, 0, 0, 0, 0, 0, 1,
  1, 1, 1, 1, 1, 1, 1, 1
]);






let horizontalEdges = Array((grid.height + 1) * grid.width).fill(false);
let verticalEdges = Array((grid.width + 1) * grid.height).fill(false);
Grid.forEachCell(grid, (cell, x, y) => {
  horizontalEdges[y * grid.width + x] = Grid.cellAbove(grid, x, y) !== cell;
  horizontalEdges[(y + 1) * grid.width + x] = Grid.cellBelow(grid, x, y) !== cell;
  verticalEdges[x + y * (grid.width + 1)] = Grid.cellLeft(grid, x, y) !== cell;
  verticalEdges[1 + x + y * (grid.width + 1)] = Grid.cellRight(grid, x, y) !== cell;
});




let cellWidth = 15;
let cellHeight = 15;

ctx.fillStyle = "black";
ctx.beginPath();
Grid.forEachCell(grid, (cell, cellX, cellY) => {
  if (cell == 0) return;
  let x = cellWidth * cellX;
  let y = cellHeight * cellY;
  ctx.moveTo(x, y);
  ctx.lineTo(x + cellWidth, y);
  ctx.lineTo(x + cellWidth, y + cellHeight);
  ctx.lineTo(x, y + cellHeight);
});
ctx.fill();


ctx.fillStyle = "red";
for (let i = 0; i < horizontalEdges.length; i++) {
  let x = (i % grid.width) * cellWidth;
  let y = Math.floor(i / grid.width) * cellHeight;
  if (horizontalEdges[i])
    ctx.fillRect(x, y, cellWidth, 2);
}

ctx.fillStyle = "green";
for (let i = 0; i < verticalEdges.length; i++) {
  let x = (i % (grid.width + 1)) * cellWidth;
  let y = Math.floor(i / (grid.width + 1)) * cellHeight;
  if (verticalEdges[i])
    ctx.fillRect(x, y, 2, cellHeight);
}






















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