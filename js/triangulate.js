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
        t.measured_height = 0;
        return t;
      } else {
        t = new THREE.Triangle( points[row][col],
                                points[row][col + 3],
                                points[row + 3][col + 1]);
        t.d = points[row + 1][col + 1];
        t.measured_height = 0;
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
        t.measured_height = 0;
        return t;
      } else {
        t = new THREE.Triangle ( points[row - 3][col + 1],
                                 points[row][col + 3],
                                 points[row][col]);
        t.d = points[row - 1][col + 1];
        t.measured_height = 0;
        return t;
      }
    });
  })).flat();

  // Flatten the array of points
  points = points.flat();
}

var mesh, camera;
const scene = new THREE.Scene();

// Set up our renderer
const renderer = new THREE.WebGLRenderer();
document.getElementById("grid").appendChild(renderer.domElement);

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

  let geometry = new THREE.BufferGeometry();
  geometry.setIndex(Array.from(triangles, t => [points.indexOf(t.a), points.indexOf(t.b), points.indexOf(t.c)]).flat());
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(Array.from(points, p => [p.x, p.y, p.z]).flat(), 3));

  geometry.addGroup(3, (triangles.length * 3) - 3, 0);
  geometry.addGroup(0, 3, 1);

  materials = [ new THREE.MeshBasicMaterial( {'color': 0xffffff, 'transparent': false, 'opacity': 0.25, 'wireframe': true}),
                new THREE.MeshBasicMaterial( {'color': 0xff0000, 'transparent': false, 'wireframe': true})];

  const mesh = new THREE.Mesh(geometry, materials);

  scene.add( mesh );

  renderer.render(scene, camera);

  document.getElementById("triangulate-button").disabled = true;
}
