self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open("mvs_restaurant1").then(function(cache) {
      return cache.addAll([
        "/",
        "js/dbhelper.js",
        "js/main.js",
        "js/restaurant_info.js",
        "js/sw_reg.js",
        "js/idb.js",
        "css/styles.css",
        "index.html",
        //"data/restaurants.json",
        "https://unpkg.com/leaflet@1.3.1/dist/leaflet.js",
        "https://unpkg.com/leaflet@1.3.1/dist/leaflet.css"
      ]);
    })
  );
});

self.addEventListener("fetch", function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('index.html'));
      return;
    }
    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(fetchImage(event.request));
      return;
    }
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(fetchRestaurantPage(event.request));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  ); 

});

function fetchImage(request) {
  var url = request.url;

  return caches.open("mvs_restaurant1").then(function(cache) {
    return cache.match(url).then(function(response) {
      if (response) return response;

       var requestClone = request.clone();
      return fetch(requestClone).then(function(networkResponse) {
        cache.put(url, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
 
function fetchRestaurantPage(request) {
  var url = request.url;

  return caches.open("mvs_restaurant1").then(function(cache) {
    return cache.match(url).then(function(response) {
      if (response) return response;

      var requestClone = request.clone();
      return fetch(requestClone).then(function(networkResponse) {
        cache.put(url, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
