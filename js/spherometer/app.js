window.addEventListener('load', function () {
  // Initialise everything
  init_2d();
  init_3d();

  // Trigger an initial decomposition of the surface
  document.getElementById('triangulate-button').click();
})
