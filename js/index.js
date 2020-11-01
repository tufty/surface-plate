// Our array of correction offsets
THREE.Vector3.prototype.corrections = undefined;

// Measured height for a point, as entered by the user
THREE.Triangle.prototype.measured_height = 0;
// The geometric centre of the triangle
THREE.Triangle.prototype.d = undefined;

// geometry
let geometry = new THREE.Geometry();

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
      let p = new THREE.Vector3(x + (col * (side / 3)), row * (radius / 2), Math.random() / 100);
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

  // Build geometry
  if (geometry != undefined) {
    geometry.dispose();
  }
  geometry = new THREE.BufferGeometry().setFromPoints(points.flat);
}


function calcError() {
  let cumulativeError = [];
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

    if (Math.abs(error.z) > 0.0005) {
      // Scale it down and add to overall error
      cumulativeError.push(error.z);

      // add a correction to the points in the triangle
      // We assume that only the z error is relevant
      t.a.corrections.push(error.z);
      t.b.corrections.push(error.z);
      t.c.corrections.push(error.z);
    }
  });
}

return [cumulativeError.reduce((a,b) => a + b, 0) / cumulativeError.length,
  cumulativeError.reduce((a,b) => Math.max(Math.abs(a), Math.abs(b), 0)),
  cumulativeError.reduce((a,b) => Math.min(Math.abs(a), Math.abs(b), Infinity))]
}

function correct(factor) {
  // Apply the overall correction
  points.forEach( function (a) {
    a.forEach( function (p) {
      p.z = p.corrections.reduce((a,b)=>a+b, p.z) * factor;
      p.corrections = [];
    })
  });
}

function doit () {
  triangles[0].measured_height = 0.05;

  let e = calcError();
  let e_old = [e[0], Infinity, Infinity];

  while((e != e_old) && (Math.sign(e[0]) == Math.sign(e_old[0]))) {
    console.log("Cumulative Error : ", e[0], " Max Error : ", e[1], " Min Error : ", e[2]);
    e_old = e;
    correct(0.01);
    e = calcError();
  }
}
