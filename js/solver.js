var step = 3;

function calc_error() {
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

      // Dependent on step, we either add a correction of error to one of a, b, or c,
      // and subtract error / 2 from d.  This is more or less equivalent to rotating
      // the triangle around the opposing edge, and doesn't use much computing power.
      // We can get away with this because we're talking about arcseconds, so it's only really
      // the z coordinate that matters.
      step = step++ % 3;
      switch (step) {
        case 0 :
          t.a.corrections.push(error.z);
          break;
        case 1 :
          t.b.corrections.push(error.z);
          break;;
        case 2 :
          t.c.corrections.push(error.z);
          break;
      }
      t.d.corrections.push(- error.z / 2);
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
