Tufty.Vector = function () {};

Tufty.Vector.create = function (elements) {
  let v = new Tufty.Vector();
  if ((elements != null) && typeof elements[Symbol.iterator] === 'function') {
    v._dims = Array.from(elements);
  }
  return v;
};

Tufty.Vector.prototype = {

  dimensions: function() {
    return this._dims.length || 0;
  }
};
