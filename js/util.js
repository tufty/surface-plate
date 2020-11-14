// Generator function giving numbers 0..n
function* iota(a, b = undefined, c = undefined) {
  const limit = b || a;
  const step = c || 1;
  const start = b ? a : 0;

  for (let n = start; n != limit; n+= step) {
    yield n;
  }
}

function lim(n, l) {
  if (Math.abs(n) > l) {
    return l;
  } else {
    return Math.abs(n);
  }
}
