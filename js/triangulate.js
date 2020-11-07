// Generator function giving numbers 0..n
function* iota(a, b = undefined, c = undefined) {
  const limit = b || a;
  const  step = c || 1;
  const start = b ? a : 0;

  for (let n = start; n < limit; n+= step) {
    yield n;
  }
}

var triangles;
var points;

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
  const h_step = radius / Math.sqrt(3);
  const v_step = radius / 2;
  const rows = Math.trunc(height / v_step) + 1;
  const cols_max = Math.trunc(width / h_step) + 1;

  // Sanity check.
  if ((rows < 3) || (cols_max < 3)) {
    return [];  // Be better here
  }

  points = Array.from(iota(rows), function (row) {
    let cols = (row % 2) ? cols_max - 1 : cols_max;
    let offset = (row % 2) ? h_step / 2 : 0;
    return Array.from(iota(cols), function (col) {
      let p = new THREE.Vector3 (offset + (col * h_step), row * v_step, 0);
      p.corrections = [];
      return p;
    });
  });

  triangles = Array.from(iota(rows - 3), function(row) {
    // First we do the downside up triangles, which are easy
    let cols = (row % 2) ? cols_max - 1 : cols_max;
    return Array.from(iota(cols - 3), function(col) {
      let t;
      if (row % 2) {
        t = new THREE.Triangle( points[row][col],
                                points[row][col + 3],
                                points[row + 3][col + 2]);
        t.d = points[row + 1][col + 2];
        t.measured_height = undefined;
        return t;
      } else {
        t = new THREE.Triangle( points[row][col],
                                points[row][col + 3],
                                points[row + 3][col + 1]);
        t.d = points[row + 1][col + 1];
        t.measured_height = undefined;
        return t;
      }
    });
  }).concat( Array.from(iota(3, rows), function(row) {
    // And now the right way up triangles, which are a bit harder
    let cols = (row % 2) ? cols_max - 1 : cols_max;
    return Array.from(iota(cols - 3), function(col) {
      let t;
      if (row % 2) {
        t = new THREE.Triangle ( points[row - 3][col + 2],
                                 points[row][col + 3],
                                 points[row][col]);
        t.d = points[row - 1][col + 2];
        t.measured_height = undefined;
        return t;
      } else {
        t = new THREE.Triangle ( points[row - 3][col + 1],
                                 points[row][col + 3],
                                 points[row][col]);
        t.d = points[row - 1][col + 1];
        t.measured_height = undefined;
        return t;
      }
    });
  })).flat();

  // Flatten the array of points
  points = points.flat();
}

var mesh, camera, geometry;
const scene = new THREE.Scene();

// Set up our renderer
const renderer = new THREE.WebGLRenderer();
document.getElementById("grid").appendChild(renderer.domElement);
var selected = 0;

function triangulate() {
  const radius = document.getElementById("radius").value;
  const width = document.getElementById("width").value;
  const height = document.getElementById("height").value;

  // Resize the renderer
  renderer.setSize (window.innerWidth * 0.9, window.innerWidth * 0.9 * height / width);
  camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 600 );
//  camera = new THREE.OrthographicCamera(0 - (width / 10), width + (width / 10), 0 - (height / 10), height + (height / 10), 0, 2000);
  camera.position.set(width/2, height/2, 300);
  camera.lookAt(width/2, height/2, 0);

  // Decompose the surface into points and triangles
  decompose(radius, width, height);

  geometry = new THREE.BufferGeometry();
  geometry.setIndex(Array.from(triangles, t => [points.indexOf(t.a), points.indexOf(t.b), points.indexOf(t.c)]).flat());
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(Array.from(points, p => [p.x, p.y, p.z]).flat(), 3));


  materials = [ new THREE.MeshBasicMaterial( {'color': 0xffffff, 'transparent': false, 'opacity': 0.25, 'wireframe': true}),
                new THREE.MeshBasicMaterial( {'color': 0xff0000, 'transparent': false, 'wireframe': true})];

  update_selected();

  const mesh = new THREE.Mesh(geometry, materials);

  scene.add( mesh );

  renderer.render(scene, camera);

  document.getElementById("triangulate-button").disabled = true;
}

function update_selected() {
  geometry.clearGroups();
  if (selected > 0) {
    geometry.addGroup(0, (selected * 3) - 1, 0);
  }
  if (selected < triangles.length) {
    geometry.addGroup((selected * 3) + 3, (triangles.length * 3) - (selected * 3) + 3, 0);
  }
  geometry.addGroup(selected * 3, 3, 1);
  geometry.computeBoundingBox();
}

document.onkeydown = function(e) {
  switch (e.keyCode || e.which) {
    case 39: // Arrow right
      select_next();
      break;
    case 37: // Arrow left
      select_prev();
      break;
  }
}

function select_next() {
  selected = (selected + 1) % triangles.length;
  update_selected();
  renderer.render(scene, camera);
}

function select_prev() {
  selected = selected - 1;
  if (selected < 0) selected += triangles.length;
  update_selected();
  renderer.render(scene, camera);
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
    normal.multiplyScalar(t.measured_height || 0);
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

  if (cumulativeError.length == 0) {
    return [0,0,Infinity];
  } else {
    return [cumulativeError.reduce((a,b) => a + b, 0) / cumulativeError.length,
            cumulativeError.reduce((a,b) => Math.max(Math.abs(a), Math.abs(b)), 0),
            cumulativeError.reduce((a,b) => Math.min(Math.abs(a), Math.abs(b)), Infinity)];
  }
}

function correct(factor) {
  // Apply the overall correction and calculate average
  points.forEach( function (p) {
    p.z += p.corrections.reduce((a,b) => a + b, 0) * factor;
    p.corrections = [];
  });
  let avg = points.reduce((a, b) => a + b.z, 0) / points.length;

  // move everything down by the average height
  points.forEach (function(p){ p.z -= avg;});
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
