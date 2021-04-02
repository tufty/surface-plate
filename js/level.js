var geom, mesh, scene, camera, renderer;

window.addEventListener('load', function () {
  if( typeof Element.prototype.clearChildren === 'undefined' ) {
    Object.defineProperty(Element.prototype, 'clearChildren', {
      configurable: true,
      enumerable: false,
      value: function() {
        while(this.firstChild) this.removeChild(this.lastChild);
      }
    });
  }

  mesh = new THREE.Mesh;
  mesh.material = new THREE.MeshBasicMaterial( {wireframe: true, side: THREE.DoubleSide, color: 0xffffff, vertexColors: false });
  scene = new THREE.Scene;
  camera = new THREE.PerspectiveCamera;
  renderer = new THREE.WebGLRenderer();

  document.getElementById("render").appendChild(renderer.domElement);
  renderer.setSize (window.innerWidth * 0.75, window.innerWidth * 0.75 * 9 / 16);

  dimension_change();
});

function jmr06_decompose() {
  let grid_div = document.getElementById('jmr06-grid');

  // Get our supplied data
  let width = document.getElementById('width').value;
  let breadth = document.getElementById('breadth').value;
  let length = document.getElementById('length').value;

  // The number of samples in a direction is <dimension> / <length> + 1
  let cols = Math.floor(width / length) + 1;
  let rows = Math.floor(breadth / length) + 1;

  // Clear any children of the grid
  grid_div.clearChildren();

  let readings_table = document.createElement('table');
  let raw_table = document.createElement('table');
  let adj_table = document.createElement('table');
  let off_table = document.createElement('table');

  let tr = document.createElement('tr');
  tr.appendChild(document.createElement('td'));
  let th;
  Array.from(iota(cols - 1)).forEach(function(_) {
    th = document.createElement('th');
    th.appendChild(document.createTextNode("v reading"));
    tr.appendChild(th);
    tr.appendChild(document.createElement('td'));
  });
  th = document.createElement('th');
  th.appendChild(document.createTextNode("v reading"));
  tr.appendChild(th);
  readings_table.appendChild(tr);

  Array.from(iota(rows - 1)).forEach(function(row) {
    readings_table.appendChild(h_reading_row(row, cols));
    readings_table.appendChild(v_reading_row(row, cols));

    raw_table.appendChild(results_row("raw", row, cols));
    adj_table.appendChild(results_row("adj", row, cols));
    off_table.appendChild(results_row("off", row, cols));
  });
  readings_table.appendChild(h_reading_row(rows - 1, cols));
  raw_table.appendChild(results_row("raw", rows - 1, cols));
  adj_table.appendChild(results_row("adj", rows - 1, cols));
  off_table.appendChild(results_row("off", rows - 1, cols));

  document.getElementById('jmr06-raw').clearChildren();
  document.getElementById('jmr06-raw').appendChild(raw_table);
  document.getElementById('jmr06-adj').clearChildren();
  document.getElementById('jmr06-adj').appendChild(adj_table);
  document.getElementById('jmr06-off').clearChildren();
  document.getElementById('jmr06-off').appendChild(off_table);

  grid_div.appendChild(readings_table);

  document.getElementById('jmr06-calc').hidden = false;
  document.getElementById('jmr06-decompose').hidden = true;
}

function results_row(n, row, cols) {
  let tr = document.createElement('tr');
  for (const col of iota(cols)) {
    let td = document.createElement('td');
    let name = "jmr06-" + n + "-" + row + "-" + col;
    td.appendChild(document.createTextNode("R" + (row + 1) + "C" + (col + 1) + " : "));
    let span = document.createElement('span');
    span.id = name;
    td.appendChild(span);
    tr.appendChild(td);
  }
  return tr;
}

function h_reading_row(row, cols) {
  let tr = document.createElement("tr");
  let td = document.createElement('th');
  td.appendChild(document.createTextNode("h reading"));
  tr.appendChild(td);

  Array.from(iota(cols - 1)).forEach(function(col){
    td = document.createElement('td');
    td.appendChild(document.createTextNode("R" + (row + 1) + "C" + (col + 1)));
    tr.appendChild(td)
    td = document.createElement('td');
    let f = document.createElement('input');
    f.type = "number";
    f.value = 0;
    f.id = "jmr06-horiz-" + row + "-" + col;
    td.appendChild(f);
    tr.appendChild(td)
  });
  td = document.createElement('td');
  td.appendChild(document.createTextNode("R" + (row + 1) + "C" + cols));
  tr.appendChild(td)

  return tr;
}

function v_reading_row(row, cols) {
  let tr = document.createElement("tr");
  tr.appendChild(document.createElement('td'));
  let td;
  Array.from(iota(cols - 1)).forEach(function(col){
    td = document.createElement('td');
    let f = document.createElement('input');
    f.type = "number";
    f.value = 0;
    f.id = "jmr06-vert-" + row + "-" + col;
    td.appendChild(f);
    tr.appendChild(td)
    tr.appendChild(document.createElement('td'));
  });
  td = document.createElement('td');
  let f = document.createElement('input');
  f.type = "number";
  f.value = 0;
  f.id = "jmr06-vert-" + row + "-" + (cols - 1);
  td.appendChild(f);
  tr.appendChild(td)
  return tr;

}

function sensitivity_change() {
  document.getElementById('um-grad').value = document.getElementById('sensitivity').value * document.getElementById('length').value;
}

function dimension_change() {
  sensitivity_change();
  let width = document.getElementById('width').value;
  let breadth = document.getElementById('breadth').value;

  camera.position.set(width / 2, 200, 3 * (breadth / 2));
  camera.aspect = 16 / 9;
  camera.near = 0.1;
  camera.far = Math.max(width, breadth) * 100;
  camera.zoom = 0.5;

  camera.lookAt(width / 2, 0, breadth / 2,);
  camera.updateProjectionMatrix();

  document.getElementById('jmr06-decompose').hidden = false;
  document.getElementById('jmr06-calc').hidden = true;
  document.getElementById('jmr06-results').hidden = true;
}

function jmr06_grads_to_microns(n) {
  return document.getElementById('length').value * document.getElementById('sensitivity').value * n;
}

// Calculate the left pseudo inverse of a matrix.
function pseudo_inverse(A) {
  let At = math.transpose(A);
  let AtA = math.multiply(At, A);
  let iAtA = math.inv(AtA);  // Not the International Air Travel Association
  return math.multiply(iAtA, At);
}

function jmr06_calc(_) {
  let width = document.getElementById('width').value;
  let breadth = document.getElementById('breadth').value;
  let length = document.getElementById('length').value;

  let h_cols = Math.floor(width / length);
  let v_cols = h_cols + 1;
  let v_rows = Math.floor(breadth / length);
  let h_rows = v_rows + 1;

  let measures = (h_rows * h_cols) + (v_rows * v_cols);
  let points = v_cols * h_rows;

  let A = math.zeros(measures, points);

  // Set up of matrix A is fucking grim but pretty much copied direct from the spreadsheet
  // I'm sure it could be done better
  let matrix_row = 0;
  let cp = 0;
  for (let p = 0; p < points - 1; p++) {
    cp = cp + 1;
    if (cp >= v_cols) {
        cp = 1;
        p = p + 1;
    }
    A.subset(math.index(matrix_row, [p, p + 1]), [-1, 1]);
    matrix_row = matrix_row + 1;
  }

  for (let p = 0; p < points - v_cols; p++) {
    A.subset(math.index(matrix_row, p), -1);
    A.subset(math.index(matrix_row, p + v_cols), 1);
    matrix_row = matrix_row + 1;
  }

  // Now create M, which is a vector of the measurements converted from graduations to microns
  let M = math.zeros(measures);
  // Get the horizontal readings
  for (const row of iota(h_rows)) {
    let indices = Array.from(iota(row * h_cols, (row * h_cols) + h_cols));
    let readings = Array.from(iota(h_cols), (col) => jmr06_grads_to_microns(document.getElementById("jmr06-horiz-" + row + "-" + col).value));
    M.subset(math.index(indices), readings);
  }
  // And the vertical ones
  for (const row of iota(v_rows)) {
    let indices = Array.from(iota((h_rows * h_cols) + (row * v_cols), (h_rows * h_cols) + (row * v_cols) + v_cols));
    let readings = Array.from(iota(v_cols), (col) => jmr06_grads_to_microns(document.getElementById("jmr06-vert-" + row + "-" + col).value));
    M.subset(math.index(indices), readings);
  }
  // We now have the basics done.  Calculate the pseudo inverse of A.
  // Only do a subset of A, as we treat the "bottom right" measurement as zero
  let rm = math.range(0, measures);
  let rp = math.range(0, points - 1);

  let piA = pseudo_inverse(A.subset(math.index(rm, rp)));
  let piAM = math.multiply(piA, M);
  piAM.resize([points], 0);

  let Mc = math.multiply(A, piAM);

  // Here we re-derive jrm's stuff.
  // Fit to plane according to Ben's answer to
  // https://math.stackexchange.com/questions/99299/best-fitting-plane-given-a-set-of-points

  let B = math.zeros(points, 3);
  for (const i of iota(h_rows)) {
    for (const j of iota (v_cols)) {
      B.subset(math.index(j + (i * v_cols), [0,1,2]), [i * length, j * length, 1]);
    }
  }
  let piB = pseudo_inverse(B);
  let coeffs = math.multiply(piB, piAM);

  // We have the plane coefficients ax + by + c = z in plane
  // calculate the on-plane z coordinates for each sample
  let Pc = math.multiply(B, coeffs);

  // Something fucked going on here
  let diff = math.subtract(piAM, Pc);
  //let diff = math.subtract(Pc, piAM);
  let minimum = math.min(diff);
  let average = math.mean(diff);

  let results = Array.from (iota(points), function(p) {
    let v = diff.subset(math.index(p));
    return [Pc.subset(math.index(p)), v, v - average, v - minimum ];
  });


  // Calculate RMS error
  let rms = Math.sqrt(math.sum(math.map(math.subtract(M, Mc), (x) => x * x)) / M.size());
  document.getElementById('jmr06-rms').innerHTML = rms.toFixed(1);

  // Output the raw measurements
  for (const row of iota(h_rows)) {
    for (const col of iota(v_cols)) {
      let value = piAM.subset(math.index((row * v_cols) + col)).toFixed(2);
      document.getElementById("jmr06-raw-" + row + "-" + col).innerHTML = value;
    }
  }


  // Output the final measurements
  for (const row of iota(h_rows)) {
    for (const col of iota(v_cols)) {
      let adj = results[(row * v_cols) + col][2].toFixed(1);
      let off = results[(row * v_cols) + col][3].toFixed(1);
      document.getElementById("jmr06-adj-" + row + "-" + col).innerHTML = adj;
      document.getElementById("jmr06-off-" + row + "-" + col).innerHTML = off;
    }
  }

  // Build up some 3d.
  let points_3d = Array.from(iota(h_rows), function (row) {
    return Array.from(iota(v_cols), function (col) {
      return [col * length, results[(row * v_cols) + col][2] * 10, row * length];
    });
  });

  let indices = Array.from(iota(h_rows - 1), function (row) {
    return Array.from(iota(v_cols - 1), function (col) {
      return [(row * v_cols) + col, ((row + 1) * v_cols) + col, (row * v_cols) + col + 1,
              (row * v_cols) + col + 1, ((row + 1) * v_cols) + col, ((row + 1) * v_cols) + col + 1];
    });
  }).flat().flat();

  scene.clear();
  mesh.geometry.dispose();
  mesh.geometry = null;

  let geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(points_3d.flat().flat(), 3));
//  geom.setAttribute('color', new THREE.Float32BufferAttribute(points_3d.map((p) => [1, 1, 1]).flat().flat(), 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  mesh.geometry = geom;
  scene.add(mesh);
  renderer.render (scene, camera);

  document.getElementById('jmr06-results').hidden = false;

}
