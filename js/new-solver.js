function solve() {

  // Build the matrix giving us which measurements affect which points
  let A = math.zeros(points, measures);
  for (let row = 0; row <= h_rows; row ++) {
      for (let col = 0; col <= v_cols; col++) {
        let point = (row * v_cols) + col;
        if (col > 0)      A.subset(math.index(point, (row * h_cols) + col), 1);
        if (col < v_cols) A.subset(math.index(point, (row * h_cols) + col + 1), -1);
        if (row > 0)      A.subset(math.index(point, (h_rows * h_cols) + (row * v_cols) + col), 1);
        if (row < h_rows) A.subset(math.index(point, (h_rows * h_cols) + ((row + 1) * v_cols) + col), -1);
      }
  }
  // Calculate its transpose
  let At = math.transpose(A);

  // Multiply the two
  let AtA = math.multiply(A, At);
}
