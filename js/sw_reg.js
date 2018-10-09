if (navigator.serviceWorker) {

  navigator.serviceWorker.register("../sw.js").then(function(reg) {
    if (!navigator.serviceWorker.controller) {
      return;
    }

  });
}
