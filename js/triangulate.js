// Generator function giving numbers 0..n
function* iota(a, b = undefined, c = undefined) {
  const limit = b || a;
  const step = c || 1;
  const start = b ? a : 0;

  for (let n = start; n != limit; n+= step) {
    yield n;
  }
}

var triangles, little_triangles;
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
  const cols_even = Math.trunc(width / h_step) + 1;
  const odd_offset = h_step / 2;
  const cols_odd = Math.trunc((width - odd_offset) / h_step) + 1;

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

var mesh_2d, camera_2d, geometry_2d;
const scene_2d = new THREE.Scene();

var mesh_3d, camera_3d, geometry_3d;
const scene_3d = new THREE.Scene();

// Set up our renderer
const render_2d = new THREE.WebGLRenderer();
document.getElementById("grid").appendChild(render_2d.domElement);
const render_3d = new THREE.WebGLRenderer();
document.getElementById("3d-render").appendChild(render_3d.domElement);

var selected = 0;

function triangulate() {
  const radius = document.getElementById("radius").value;
  const width = document.getElementById("width").value;
  const height = document.getElementById("height").value;

  // Resize the render_2d
  render_2d.setSize (window.innerWidth * 0.75, window.innerWidth * 0.75 * height / width);
  camera_2d = new THREE.PerspectiveCamera( 75, width / height, 0.1, 900 );
//  camera_2d = new THREE.OrthographicCamera(0 - (width / 10), width + (width / 10), 0 - (height / 10), height + (height / 10), 0, 2000);
  camera_2d.position.set(width/2, height/2, 200);
  camera_2d.lookAt(width/2, height/2, 0);

  // Decompose the surface into points and triangles
  decompose(radius, width, height);

  geometry_2d = new THREE.BufferGeometry();
  geometry_2d.setIndex(Array.from(triangles, t => [points.indexOf(t.a), points.indexOf(t.b), points.indexOf(t.c)]).flat());
  geometry_2d.setAttribute('position', new THREE.Float32BufferAttribute(Array.from(points, p => [p.x, p.y, p.z]).flat(), 3));


  materials_2d = [ new THREE.MeshBasicMaterial( {'color': 0xffffff, 'transparent': false, 'opacity': 0.25, 'wireframe': true}),
                new THREE.MeshBasicMaterial( {'color': 0xff0000, 'transparent': false, 'wireframe': true})];

  update_selected();

  const mesh_2d = new THREE.Mesh(geometry_2d, materials_2d);

  scene_2d.add( mesh_2d );

  render_2d.render(scene_2d, camera_2d);

  // And the 3d stuff
  render_3d.setSize (window.innerWidth * 0.75, window.innerWidth * 0.75 * height / width);
  camera_3d = new THREE.PerspectiveCamera( 75, width / height, 0.1, 600 );

  camera_3d.position.set(width/2, height/2, 400);
  camera_3d.lookAt(width/2, height/2, 0);

  // geometry_3d = new THREE.BufferGeometry();
  // geometry_3d.setIndex(Array.from(little_triangles, t => [points.indexOf(t.a), points.indexOf(t.b), points.indexOf(t.c)]).flat());
  // geometry_3d.setAttribute('position', new THREE.Float32BufferAttribute(Array.from(points, p => [p.x, p.y, p.z]).flat(), 3));
  // geometry_3d.addGroup(0, little_triangles.length * 3, 0);

  geometry_3d = new THREE.Geometry();
  geometry_3d.vertices = points;
  geometry_3d.faces = Array.from(little_triangles, (t) => new THREE.Face3(points.indexOf(t.a), points.indexOf(t.b), points.indexOf(t.c)));


  const mesh_3d = new THREE.Mesh(geometry_3d, new THREE.MeshBasicMaterial({'color': 0xfeed05, 'wireframe': true}));
  mesh_3d.up = new THREE.Vector3(0, 0, 1);
  scene_3d.add( mesh_3d);
  const light_3d = new THREE.DirectionalLight( 0xffffff );

  light_3d.position.set( 0, 0, 1 );
  scene_3d.add( light_3d );

  render_3d.render(scene_3d, camera_3d);

  document.getElementById("triangulate-button").disabled = true;
}

function animate() {

	requestAnimationFrame( animate );

	render_3d.render( scene_3d, camera_3d );

}

function update_selected() {
  geometry_2d.clearGroups();
  if (selected > 0) {
    geometry_2d.addGroup(0, (selected * 3) - 1, 0);
  }
  if (selected < triangles.length) {
    geometry_2d.addGroup((selected * 3) + 3, (triangles.length * 3) - (selected * 3) + 3, 0);
  }
  geometry_2d.addGroup(selected * 3, 3, 1);
  geometry_2d.computeBoundingBox();

  let f = document.getElementById('measurement');
  f.value = triangles[selected].measured_height || 0;
  f.select();
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

document.onkeypress = function(e) {
  if (document.activeElement == document.getElementById('measurement') &&
      e.keyCode == 13)
      enter_measurement();
}

function select_next() {
  selected = (selected + 1) % triangles.length;
  update_selected();
  render_2d.render(scene_2d, camera_2d);
}

function select_prev() {
  selected = selected - 1;
  if (selected < 0) selected += triangles.length;
  update_selected();
  render_2d.render(scene_2d, camera_2d);
}

function enter_measurement() {
  f = document.getElementById('measurement');
  h = f.value;

  triangles[selected].measured_height = h;

  update_selected();
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
    // Measured height is in microns, so divide by 1000.
    normal.multiplyScalar(t.measured_height / 1000 || 0);
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

function export_data() {
  let filename = "surface_plate.json";

  let data = {radius: document.getElementById('radius').value,
              width: document.getElementById('width').value,
              height: document.getElementById('height').value,
              points: points.map((p) => [p.x, p.y, p.z]),
              triangles : triangles.map((t) => [points.indexOf(t.a), points.indexOf(t.b), points.indexOf(t.c), points.indexOf(t.d), t.measured_height]),
              little_triangles : little_triangles.map((t) => [points.indexOf(t.a), points.indexOf(t.b), points.indexOf(t.c)]) };

  // shamelessly ripped off from StackOverflow
  let blob = new Blob([JSON.stringify(data)], { type: 'text/json;charset=utf-8;' });
  if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, filename);
  } else {
      let link = document.createElement("a");
      if (link.download !== undefined) { // feature detection
          // Browsers that support HTML5 download attribute
          let url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } else {
        location.href = 'data:application/octet-stream,' + encodeURIComponent(JSON.stringify(data));
      }
  }
}

let file_reader = new FileReader();
file_reader.addEventListener('loadend', () => {data_loaded();});

document.getElementById('import-button').addEventListener('click', (e) => {document.getElementById('import-selector').click();}, false);

function import_data() {
  let selector = document.getElementById('import-selector');

  if (selector.files.length == 0) {
    return;
  }

  file_reader.readAsText(selector.files[0]);
}

function data_loaded() {
  json = JSON.parse(file_reader.result);

  document.getElementById("radius").value = json.radius;
  document.getElementById("width").value = json.width;
  document.getElementById("height").value = json.height;

  points = Array.from(json.points, (p) => new THREE.Vector3(p[0], p[1], p[2]));;
  points.forEach((p) => {p.corrections = [];});

  triangles = Array.from(json.triangles, function(j) {
    let t = new THREE.Triangle(points[j[0]], points[j[1]], points[j[2]]);
    t.d = points[j[3]];
    t.measured_height = j[4];
    return t;
  });

  little_triangles = Array.from(json.little_triangles, (t) => new THREE.Triangle(points[t[0]], points[t[1]], points[t[2]]));

}
