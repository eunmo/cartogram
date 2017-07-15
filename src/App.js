import React, { Component } from 'react';
import './App.css';

import points from './data/points';

class App extends Component {

	constructor(props) {
	  super(props);
	
		var squareCount = this.getSquareCount();
		var squares = this.getSquares(squareCount);
		var step = this.expand(squares);
		var colors = this.color(squares);

		this.state = {squareCount: squareCount, matrix: squares.matrix, colors: colors, step: step};
	}

  render() {
		var margin = 0;
		var side = 1000 / this.state.squareCount - 2 * margin;
    return (
			<div className="flex-container">
				<div className="flex-1"></div>
				<div>
				{this.state.matrix.map((row, index) => {
					return (
						<div key={index} className="flex-container">
						{row.map((cell, index) => {
							var style = this.getStyle(cell);
							style.width = side + 'px';
							style.height = side + 'px';
							style.margin = margin + 'px';
							style.lineHeight = side + 'px';
							return (
								<div key={index} className="cell" style={style}>{cell.initial}</div>
							);
						})}
						</div>
					);
				})}
				<h3>Districts of Seoul in {this.state.step} Steps</h3>
				</div>
				<div className="flex-1"></div>
			</div>
    );
  }

	getStyle(cell) {
		var color = 'beige';
		var hues = [10, 30, 60, 200, 140, 260];

		if (cell.region !== undefined) {
			var hue = hues[this.state.colors[cell.region]];
			var lightness = 70;

			color = 'hsl(' + hue + ', 60%, ' + lightness + '%)';
		}

		var style = {backgroundColor: color};

		return style;
	}

	getSquareCount() {
		var sum = 0;
		for (var i = 0; i < points.length; i++) {
			sum += points[i].pop;
		}

		var count = Math.round(Math.sqrt(sum * 2));
		return count;
	}

	color(squares) {
		var edgeMap = [];
		var i, j;
		for (i = 0; i < squares.centers.length; i++) {
			edgeMap[i] = [];
		}

		var matrix = squares.matrix;
		var row, cell, bottom, right;
		for (i = 0; i < matrix.length - 1; i++) {
			row = matrix[i];
			for (j = 0 ; j < row.length - 1; j++) {
				cell = matrix[i][j];

				if (cell.region === undefined) {
					continue;
				}

				bottom = matrix[i + 1][j];
				if (bottom.region !== undefined && cell.region !== bottom.region) {
					edgeMap[cell.region][bottom.region] = true;
					edgeMap[bottom.region][cell.region] = true;
				}

				right = matrix[i][j + 1];
				if (right.region !== undefined && cell.region !== right.region) {
					edgeMap[cell.region][right.region] = true;
					edgeMap[right.region][cell.region] = true;
				}
			}
		}

		var colors = [];
		var edges = [];
		for (i = 0; i < squares.centers.length; i++) {
			colors[i] = -1;
			edges[i] = {index: i, array: []};
			for (j = 0; j < squares.centers.length; j++) {
				if (edgeMap[i][j]) {
					edges[i].array.push(j);
				}
			}
		}

		edges.sort(function(a, b) {
			return b.array.length - a.array.length;
		});

		var edge;
		var usedColor;
		for (i = 0; i < squares.centers.length; i++) {
			edge = edges[i];
			usedColor = [];

			for (j = 0; j < edge.array.length; j++) {
				if (colors[edge.array[j]] !== -1) {
					usedColor[colors[edge.array[j]]] = true;
				}
			}

			for (j = 0; j < usedColor.length; j++) {
				if (usedColor[j] !== true)
					break;
			}

			colors[edge.index] = j;
		}

		return colors;
	}

	isOutOfBounds(matrix, x, y) {
		return (x < 0 || x >= matrix[0].length ||
						y < 0 || y >= matrix.length);
	}

	updateCenter(area) {
		var i, x, y;
		for (i = x = y = 0; i < area.cells.length; i++) {
			y += area.cells[i].coord[0];
			x += area.cells[i].coord[1];
		}
		x /= area.cells.length;
		y /= area.cells.length;
		area.avg = {coord: [y, x]};
	}

	getDist(a, b) {
		var distY = a.coord[0] - b.coord[0];
		var distX = a.coord[1] - b.coord[1];

		return distX * distX + distY * distY;
	}

	getClosestCells(area, cells) {
		var minDist = 0;
		var i, cell, dist;
		var closest = [];

		minDist = this.getDist(cells[0], area.avg);
		for (i = 0; i < cells.length; i++) {
			dist = this.getDist(cells[i], area.avg);
			if (dist < minDist) {
				minDist = dist;
			}
		}

		minDist = Math.sqrt(minDist) + 1.5;
		for (i = 0; i < cells.length; i++) {
			cell = cells[i];
			dist = this.getDist(cell, area.avg);
			if (Math.sqrt(dist) < minDist) {
				closest.push(cell);
			}
		}

		return closest;
	}

	canSteal(matrix, area, cand) {
		var coeffs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
		var coeff;
		var i, x, y;
		var count = 0;
		var cell;
		var map = {};

		var cellToString = function(cell) {
			return cell.coord[0] + ' ' + cell.coord[1];
		};

		map[cellToString(cand)] = true;

		for (i = 0; i < area.cells.length; i++) {
			cell = area.cells[i];
			if (cellToString(cell) !== cellToString(cand))
				break;
		}

		if (i === area.cells.length)
			return false;

		map[cellToString(cell)] = true;
		count++;
		var cells = [cell];
		var newCell;

		while (cells.length > 0) {
			cell = cells.pop();

			for (i = 0; i < coeffs.length; i++) {
				coeff = coeffs[i];
				y = cell.coord[0] + coeff[0];
				x = cell.coord[1] + coeff[1];

				if (this.isOutOfBounds(matrix, x, y))
					continue;

				newCell = matrix[y][x];

				if (map[cellToString(newCell)])
					continue;

				if (newCell.region === area.index ) {
					map[cellToString(newCell)] = true;
					count++;
					cells.push(newCell);
				}
			}
		}

		return (area.cells.length - 1 === count);
	}

	getCandidates(matrix, area, areas) {
		var coeffs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
		var i, j, x, y;
		var cell, coeff, cand;
		var candidates = [];

		for (i = 0; i < area.cells.length; i++) {
			cell = area.cells[i];

			for (j = 0; j < coeffs.length; j++) {
				coeff = coeffs[j];
				y = cell.coord[0] + coeff[0];
				x = cell.coord[1] + coeff[1];

				if (this.isOutOfBounds(matrix, x, y))
					continue;

				cand = matrix[y][x];

				if (cand.region === area.index)
					continue;

				if (cand.region === undefined) {
					candidates.push(cand);
					continue;
				}

				if (!this.canSteal(matrix, areas[cand.region], cand))
					continue;
					
				candidates.push(cand);
			}
		}

		return this.getClosestCells(area, candidates);
	}

	expand(squares) {
		var matrix = squares.matrix;
		var i;
	 	var center;
		var areas = [];
		var remainingAreas = [];

		for (i = 0; i < points.length; i++) {
			center = squares.centers[i];
			areas[i] = {
				index: i,
				cells: [center],
				pop: points[i].pop - 1
			};
			remainingAreas[i] = areas[i];
		}

		var seed = 1;
		var random = function(number) {
			var x = Math.sin(seed++) * 10000;
			return Math.floor((x - Math.floor(x)) * number);
		}

		var areaIndex, area, cell
		var candidateIndex, candidates, steal, stolenArea;
		var stepLimit = 10000;
		var count = 0;
		while (count < stepLimit) {
			areaIndex = random(remainingAreas.length);
			area = remainingAreas[areaIndex];

			this.updateCenter(area);

			candidates = this.getCandidates(matrix, area, areas);
			candidateIndex = random(candidates.length);
			cell = candidates[candidateIndex];

			if (cell.region === undefined) {
				cell.region = area.index;
				area.cells.push(cell);
				area.pop--;
			} else {
				steal = cell;
				
				stolenArea = areas[steal.region];
				stolenArea.cells.splice(stolenArea.cells.indexOf(steal), 1);
				stolenArea.pop++;

				if (stolenArea.pop === 1) {
					remainingAreas.push(stolenArea);
				}
				
				steal.region = area.index;
				area.cells.push(steal);
				area.pop--;
			}
			
			if (area.pop === 0) {
				remainingAreas.splice(areaIndex, 1);
				if (remainingAreas.length === 0) {
					break;
				}
			}

			count++;
		}

		var j, x, y;
		for (i = 0; i < points.length; i++) {
			area = areas[i];
			points[i].remain = areas.pop;
			this.updateCenter(area);
			y = Math.round(area.avg.coord[0]);
			x = Math.round(area.avg.coord[1] - points[i].name.length / 2 + 0.5);

			for (j = 0; j < points[i].name.length; j++) {
				cell = matrix[y][x + j];
				cell.initial = points[i].name.charAt(j);
			}
		}

		return count;
	}

	getSquares(squareCount) {
		var x = {};
		var y = {};
		var i, point, X, Y;

		x.sum = y.sum = 0;
		x.min = y.min = 200;
		x.max = y.max = -200;
		for (i = 0; i < points.length; i++) {
			point = points[i];

			X = point.loc[1];
			Y = point.loc[0];
			x.sum += X;
			y.sum += Y;
			x.min = Math.min(x.min, X);
			y.min = Math.min(y.min, Y);
			x.max = Math.max(x.max, X);
			y.max = Math.max(y.max, Y);
		}
		x.avg = x.sum / points.length;
		y.avg = y.sum / points.length;

		var axis = Math.max(x.max - x.min, y.max - y.min);
		var x0 = x.avg - axis;
		var y0 = y.avg - axis;

		var j, k;
		var matrix = [];
		var row, square;
		var cellLength = (2 * axis) / squareCount;
		var centers = [];
		var rowIndex;
		for (i = 0;	i < squareCount; i++) {
			rowIndex = squareCount - i - 1;
			matrix[rowIndex] = row = [];
			for (j = 0; j < squareCount; j++) {
				row[j] = square = {coord: [rowIndex, j], neighbors: []};
				square.x0 = x0 + cellLength * j;
				square.x1 = x0 + cellLength * (j + 1);
				square.y0 = y0 + cellLength * i;
				square.y1 = y0 + cellLength * (i + 1);

				for (k = 0; k < points.length; k++) {
					point = points[k];
					X = point.loc[1];
					Y = point.loc[0];

					if (square.x0 <= X && square.x1 > X &&
							square.y0 <= Y && square.y1 > Y) {
						square.point = point;
						square.point.region = square.region = k;
						centers[k] = square;
					}
				}
			}
		}

		// top
		for (i = 1; i < squareCount; i++) {
			for (j = 0; j < squareCount; j++) {
				matrix[i][j].neighbors.push(matrix[i - 1][j]);
			}
		}

		// right
		for (i = 0; i < squareCount; i++) {
			for (j = 0; j < squareCount - 1; j++) {
				matrix[i][j].neighbors.push(matrix[i][j + 1]);
			}
		}

		// down
		for (i = 0; i < squareCount - 1; i++) {
			for (j = 0; j < squareCount; j++) {
				matrix[i][j].neighbors.push(matrix[i + 1][j]);
			}
		}

		// left
		for (i = 0; i < squareCount; i++) {
			for (j = 1; j < squareCount; j++) {
				matrix[i][j].neighbors.push(matrix[i][j - 1]);
			}
		}
		
		var seed = 1;
		var random = function(number) {
			var x = Math.sin(seed++) * 10000;
			return Math.floor((x - Math.floor(x)) * number);
		}

		var center;
		var candidates, candidateIndex, candidate;
		for (i = 0; i < points.length; i++) {
			center = centers[i]; 
			if (center.region !== i) {
				candidates = [];
				for (j = 0; j < center.neighbors.length; j++) {
					if (center.neighbors[j].region === undefined) {
						candidates.push(center.neighbors[j]);
					}
				}
				candidateIndex = random(candidates.length);
				candidate = candidates[candidateIndex];
				candidate.region = i;
				centers[i] = candidate;
			}
		}

		return {matrix: matrix, centers: centers};
	}
}

export default App;
