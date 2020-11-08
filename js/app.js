window.addEventListener('load', function () {
  // Initialise everything
  init_2d();

  // Trigger an initial decomposition of the surface
  document.getElementById('triangulate-button').click();
})
