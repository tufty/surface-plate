
function init_2d() {
  render_2d = new THREE.WebGLRenderer();
  scene_2d = new THREE.Scene();
  //camera_2d = new THREE.OrthographicCamera();
  camera_2d = new THREE.PerspectiveCamera();
  geometry_2d = new THREE.BufferGeometry();
  mesh_2d = new THREE.Mesh();
  materials_2d = [ new THREE.MeshBasicMaterial( {'color': 0xffffff, 'transparent': false, 'opacity': 0.25, 'wireframe': true}),
                   new THREE.MeshBasicMaterial( {'color': 0xff0000, 'transparent': false, 'wireframe': true})];

  document.getElementById("grid").appendChild(render_2d.domElement);
}

function triangulate() {
  let radius = document.getElementById('radius').value;
  let width = document.getElementById('width').value;
  let height = document.getElementById('height').value;

  decompose(radius, width, height);
  geometry_data_changed(radius, width, height);
}

function geometry_data_changed(radius, width, height) {
  document.getElementById("triangulate-button").disabled = true;

  document.getElementById("measure_count").innerText = "Measures to take : " + triangles.length;

  scene_2d.clear();
  mesh_2d.geometry = null;
  mesh_2d.material = null;
  geometry_2d.clearGroups();
  geometry_2d.deleteAttribute('position');
  geometry_2d.dispose();
  geometry_2d = new THREE.BufferGeometry();


  // Resize the renderer
  render_2d.setSize (window.innerWidth * 0.75, window.innerWidth * 0.75 * height / width);

  // Set up the camera
  camera_2d.position.set(width / 2, height / 2, 500);
  camera_2d.aspect = width / height;
  camera_2d.near = 0.1;
  camera_2d.far = 1000;

  camera_2d.lookAt(width / 2, height / 2, 0);
  camera_2d.updateProjectionMatrix();

  geometry_2d.setIndex(Array.from(triangles, t => [points.indexOf(t.a), points.indexOf(t.b), points.indexOf(t.c)]).flat());
  geometry_2d.setAttribute('position', new THREE.Float32BufferAttribute(Array.from(points, p => [p.x, p.y, p.z]).flat(), 3));

  selected_triangle = 0;
  update_selected_triangle();

  mesh_2d.geometry = geometry_2d;
  mesh_2d.material = materials_2d;

  scene_2d.add(mesh_2d);

  render_2d.render(scene_2d, camera_2d);

  camera_3d.position.set(width / 2, -3 * (height / 2), 300);
  camera_3d.aspect = width / height;
  camera_3d.near = 0.1;
  camera_3d.far = Math.max(width, height) * 100;
  camera_3d.zoom = 2.0;

  camera_3d.lookAt(width / 2, height / 2, 0);
  camera_3d.up = new THREE.Vector3(0,0,1);
  camera_3d.updateProjectionMatrix();

  render_3d.setSize (window.innerWidth * 0.75, window.innerWidth * 0.75 * height / width);

}

function update_selected_triangle() {
  geometry_2d.clearGroups();

  if (selected_triangle > 0) {
    geometry_2d.addGroup(0, selected_triangle * 3, 0);
  }
  if (selected_triangle < triangles.length) {
    geometry_2d.addGroup((selected_triangle * 3) + 3, (triangles.length * 3) - (selected_triangle * 3) + 3, 0);
  }
  geometry_2d.addGroup(selected_triangle * 3, 3, 1);
  geometry_2d.computeBoundingBox();

  let f = document.getElementById('measurement');
  f.value = triangles[selected_triangle].measured_height || 0;
  f.select();
}


// UI for data entry.  Handle moving the selection in the 2d representation and entering measurements
document.getElementById('measurement').addEventListener('keyup', function (evt) {
  if (evt.defaultPrevented) return;

  switch (evt.key || evt.keyCode) {
    case 'Enter':
    case 13:
      enter_measurement();
      break;
    case 'ArrowRight':
    case 39:
      select_next();
      break;
    case 'ArrowLeft':
    case 37:
      select_prev();
      break;
  }});

function select_next() {
  update_measurement();
  selected_triangle = (selected_triangle + 1) % triangles.length;
  update_selected_triangle();
  render_2d.render(scene_2d, camera_2d);
}

function select_prev() {
  update_measurement();
  selected_triangle = selected_triangle - 1;
  if (selected_triangle < 0) selected_triangle += triangles.length;
  update_selected_triangle();
  render_2d.render(scene_2d, camera_2d);
}

function update_measurement() {
  let field = document.getElementById('measurement');
  triangles[selected_triangle].measured_height = field.value;
}

function enter_measurement() {
  update_measurement();
  update_selected_triangle();
}

function init_3d() {
  render_3d = new THREE.WebGLRenderer();
  scene_3d = new THREE.Scene();
  //camera_2d = new THREE.OrthographicCamera();
  camera_3d = new THREE.PerspectiveCamera();
  geometry_3d = new THREE.BufferGeometry();
  mesh_3d = new THREE.Mesh();

  mesh_3d.material = new THREE.MeshBasicMaterial( { wireframe: true, side: THREE.DoubleSide, vertexColors: true});

  document.getElementById("3d-render").appendChild(render_3d.domElement);
}

function solve() {
  do_solve();
  update_3d();
}

function update_3d() {
  scene_3d.clear()
  scene_2d.clear();
  mesh_3d.geometry = null;
  geometry_3d.clearGroups();
  geometry_3d.deleteAttribute('position');
  geometry_3d.dispose();
  geometry_3d = new THREE.BufferGeometry();

//  let z_max = points.reduce((a, p) => Math.max(a, Math.abs(p.z)), 0);

  geometry_3d.setAttribute('position', new THREE.Float32BufferAttribute(Array.from(points, p => [p.x, p.y, p.z * 200]).flat(), 3));
//  geometry_3d.setAttribute('color', new THREE.Float32BufferAttribute(Array.from(points, p => [Math.abs(p.z) / z_max, 1 - (Math.abs(p.z) / z_max), 0.0]).flat(), 3));
  geometry_3d.setAttribute('color', new THREE.Float32BufferAttribute(Array.from(points, p => point_color(p, 0.01)).flat(), 3));
  geometry_3d.setIndex(Array.from(little_triangles, t => [points.indexOf(t.a), points.indexOf(t.b), points.indexOf(t.c)]).flat());
  geometry_3d.computeVertexNormals();

  mesh_3d.geometry = geometry_3d;
  scene_3d.add(mesh_3d);

  render_3d.render(scene_3d, camera_3d);
}

function point_color (p, l) {
  let z = lim(p.z, l);
  return [(z / l), 1.0 - (z / l), 0];
}


function animate() {
	requestAnimationFrame( animate );
	render_3d.render( scene_3d, camera_3d );
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

document.getElementById('import-button').addEventListener('click', () => {document.getElementById('import-selector').click();}, false);

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

  geometry_data_changed(json.radius, json.width, json.height);
}