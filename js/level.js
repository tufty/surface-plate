
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
});

  function jmr06_decompose() {
    let grid_div = document.getElementById('jmr06-grid');

    // Get our supplied data
    let width = document.getElementById('width').value;
    let breadth = document.getElementById('breadth').value;
    let length = document.getElementById('length').value;
    let sample = document.getElementById('jmr06-samples').value;

    // The number of samples in a direction is <dimension> / <length> + 1
    let cols = Math.floor(width / length) + 1;
    let rows = Math.floor(breadth / length) + 1;

    // Clear any children of the grid
    grid_div.clearChildren();

    let table = document.createElement('table');

    Array.from(iota(rows - 1)).forEach(function(row) {
      table.appendChild(h_reading_row(row, cols));
      table.appendChild(v_reading_row(row, cols));

    });
    table.appendChild(h_reading_row(rows, cols));

    grid_div.appendChild(table);
  }

  function h_reading_row(row, cols) {
    let tr = document.createElement("tr");
    let td = document.createElement('th');
    td.appendChild(document.createTextNode(row));
    tr.appendChild(td);
    tr.appendChild(document.createElement('td'));

    Array.from(iota(cols - 1)).forEach(function(col){
      td = document.createElement('td');
      let f = document.createElement('input');
      f.type = "number";
      f.value = 0;
      f.id = "jmr06-horiz-" + row + "-" + col;
      td.appendChild(f);
      tr.appendChild(td)
      tr.appendChild(document.createElement('td'));
    });
    return tr;
  }

  function v_reading_row(row, cols) {
    let tr = document.createElement("tr");
    let td = document.createElement('th');
    tr.appendChild(td);
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
    f.id = "jmr06-vert-" + row + "-" + cols;
    td.appendChild(f);
    tr.appendChild(td)
    return tr;

  }

  function dimension_change() {
    document.getElementById('um-grad').value = document.getElementById('sensitivity').value * document.getElementById('length').value;
  }
