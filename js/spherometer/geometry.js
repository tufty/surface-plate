function decompose (radius, width, height) {
  // We decompose the plane into a series of overlapping rows of
  // height radius / 2.
  // Each row consists of a row of equilateral triangles.
  // .   .   .   .   .   .
  //   .   .   .   .   .
  // .   .   .   .   .   .
  //   .   .   .   .   .
  // .   .   .   .   .   .
  // For "downward" triangles
  // Row 0 -> [0,0][3,0][1,3], [1,0][4,0][2,3] ...
  // Row 1 -> [0,1][3,1][2,4], [1,1][4,1][3,4] ...
  // For "upward" triangles
  // Row 3 -> [2,0][3,3][0,3], [3,0][4,3][1,3] ...
  // Row 4 -> [1,1][3,4][0,4], [2,1][4,4][1,4] ...
  let h_step = radius / Math.sqrt(3);
  let v_step = radius / 2;
  let rows = Math.trunc(height / v_step) + 1;
  let cols_even = Math.trunc(width / h_step) + 1;
  let odd_offset = h_step / 2;
  let cols_odd = Math.trunc((width - odd_offset) / h_step) + 1;

  // Sanity check.
  if ((rows < 3) || (cols_even < 3) || (cols_odd < 3)) {
    return [];  // Be better here
  }

  points = Array.from (iota (rows), function (row) {
    if (row % 2) {
      return Array.from (iota (cols_odd), (col) => new THREE.Vector3(odd_offset + (col * h_step), (row * v_step), 0));
    } else {
      return Array.from (iota (cols_even), (col) => new THREE.Vector3((col * h_step), (row * v_step), 0));
    }
  });

  triangles = Array.from(iota (rows - 3), function (row){
    let t;
    const o = (row % 2) ? 1 : 0;
    const cols = (row % 2) ? cols_odd : cols_even;
    return Array.from (iota (cols - 3), function(col) {
      t = new THREE.Triangle( points[row][col],
                              points[row][col + 3],
                              points[row + 3][col + 1 + o]);
      t.d = points[row + 1][col + 1 + o];
      t.measured_height = 0;
      return t;
    });
  }).concat( Array.from(iota(3, rows), function(row) {
    let t;
    const o = (row % 2) ? 1 : 0;
    const cols = (row % 2) ? cols_odd : cols_even;
    return Array.from(iota(cols - 3), function(col) {
      t = new THREE.Triangle ( points[row - 3][col + 1 + o],
                               points[row][col + 3],
                               points[row][col]);
      t.d = points[row - 1][col + 1 + o];
      t.measured_height = 0;
      return t;
    });
  })).flat();

  // Little triangles for 3d render
  // 2 cases here.  Either cols_even is greater than cols_odd, or they are equal.
  little_triangles = Array.from(iota(0, rows - 1), function (row) {
    const o = (row % 2) ? 1 : 0;
    const cols = (row % 2) ? cols_odd : cols_even;
    return Array.from(iota(0, cols - 1), (col) => new THREE.Triangle ( points[row][col],
                                                                       points[row][col + 1],
                                                                       points[row + 1][col + o]));
  }).concat( Array.from(iota(1, rows), function (row) {
    const o = (row % 2) ? 1 : 0;
    const cols = (row % 2) ? cols_odd : cols_even;
    return Array.from(iota(0, cols - 1), (col) => new THREE.Triangle ( points[row][col + 1],
                                                                       points[row][col],
                                                                       points[row - 1][col + o]));
  })).flat();

  // Flatten the array of points
  points = points.flat();
  points.forEach((p) => p.corrections=[]);
}
