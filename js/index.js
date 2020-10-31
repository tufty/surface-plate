// Our array of correction offsets
THREE.Vector3.prototype.corrections = undefined;

// Measured height for a point, as entered by the user
THREE.Triangle.prototype.measured_height = 0;
// The geometric centre of the triangle
THREE.Triangle.prototype.d = undefined;

let points, triangles;

// Create an array of points given the dimensions of the spherometer and the plate,
// and use this to create the array of triangles.
// Each point will start with a z coordinate of 0
function initBaseData () {
    const radius = document.getElementById("radius").value;
    const width = document.getElementById("width").value;
    const height = document.getElementById("height").value;

    // side length of equilateral triangle given its circumradius
    const side = 3 * radius / Math.sqrt(3);

    const cols_even = Math.trunc(3 * width / side) + 1;
    const cols_odd = Math.trunc(3 * (width - side) / side) + 1;
    const rows = Math.trunc((2 * height) / radius) + 1;

    points = Array.from( {length: rows}, function (_, row) {
      const cols = (row % 2) ? cols_odd : cols_even;
      const x = (row % 2) ? side / 2 : 0;
      return Array.from( {length: cols}, function (_, col) {
        let p = new THREE.Vector3(x + (col * (side / 3)), row * (radius / 2), 0);
        p.corrections = [];
        return p;
      });
    });

    triangles = Array.from( {length: rows - 3},  function (_, row) {
      const cols = (row % 2) ? cols_odd : cols_even;
      return Array.from( {length: cols - 3}, function (_, col) {
        let t = new THREE.Triangle( points[row][col], points[row][col+3], points[row+3][col]);
        t.d = points[row+1][col];
        t,measured_height = 0;
        return t;
      })}).concat(Array.from( {length: rows - 3},  function (_, row) {
        return Array.from( {length: cols_odd - 3}, function (_, col) {
          let t = new THREE.Triangle( points[row][col+3], points[row+3][col+3], points[row+3][col]);
          t.d = points[row+2][col+1];
          t.measured_height = 0;
          return t;
        })
      })).flat();
}

function calcErrorAndCorrect(factor) {
  let cumulativeError = new THREE.Vector3();
  let error = new THREE.Vector3();
  let normal = new THREE.Vector3();
  let midpoint = new THREE.Vector3();

  // Calculate error factor for each triangle
  triangles.forEach( function(t) {
    t.getMidpoint(midpoint);
    t.getNormal(normal);

    // Take our normal and multiply to get "actual" position
    normal.multiplyScalar(t.measured_height);
    normal.add(midpoint);
    // Subtract our current calculated position to get the error
    error.subVectors(t.d, normal);

    // Scale it down and add to overall error
    error.multiplyScalar(factor);
    cumulativeError.add(error);

    // add a correction to the points in the triangle
    // We assume that only the z error ir relevant
    t.a.corrections.push(error.z);
    t.b.corrections.push(error.z);
    t.c.corrections.push(error.z);
//    t.d.corrections.push(error.z);
  });

  // Apply the overall correction
  points.forEach( function (a) {
    a.forEach( function (p) {
      p.z = p.corrections.reduce((a,b)=>a+b,p.z);
      p.corrections = [];
    })
  });

  return cumulativeError;
}

function doit () {
  triangles[0].measured_height = 0.02;
  for (i = 0; i < 100; i++) {
    calcErrorAndCorrect(0.1);
  }
}
