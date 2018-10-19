var dbPromise = idb.open("appDB", 1, function(upgradeDb) {
  switch(upgradeDb.oldVersion) {
    case 0:
      var restaurantStore = upgradeDb.createObjectStore("restaurants", {
        keyPath: "id"
      });
      var reveiwStore = upgradeDb.createObjectStore("reviews", {
        keyPath: "id"
      });
      reveiwStore.createIndex("restaurant_id", "restaurant_id");
  }
}); 



/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    var pr = fetch(DBHelper.DATABASE_URL + "restaurants", {method: "GET"});
    pr.then(function(response) {
      response.json().then(function(restaurants) {
        dbPromise.then(function(db) {
          var tx = db.transaction("restaurants", "readwrite");
          var store = tx.objectStore("restaurants");
          restaurants.forEach(function(restaurant) {
            store.put(restaurant);
          });
        });
        callback(null, restaurants);
      });
    }).catch(function(error) {
      dbPromise.then(function(db) {
        db.transaction("restaurants")
          .objectStore("restaurants")
          .getAll().then(function(restaurantsList) {
            if (!restaurantsList.length) {
              callback(`Request failed. ${error}`, null);
            }
            else {
              callback(null, restaurantsList);
            }
          });
      });
    });
  }

  /**
   * Fetch a reviews by its RestaurantId.
   */
  static fetchReviewsByRestaurantId(rid) {
    var pr = fetch(DBHelper.DATABASE_URL + "reviews/?restaurant_id=" + rid, {method: "GET"});
    return pr.then(function(response) {
      return response.json().then(function(reviews) {
        return dbPromise.then(function(db) {
          var tx = db.transaction("reviews", "readwrite");
          var store = tx.objectStore("reviews");
          reviews.forEach(function(review) {
            store.put(review);
          });
        }).then(function() {
          return reviews;
        });
      });
    }).catch(function(error) {
      return dbPromise.then(function(db) {
        var tx = db.transaction("reviews");
        var reviewsStore = tx.objectStore("reviews");
        var ridIndex = reviewsStore.index("restaurant_id");
        return ridIndex.getAll(rid);
      });
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}.jpg`);
  }

  /**
   * Toggle Favorite
   */
  static toggleFavorite(rid) {
    var newFavoriteVal = !(document.getElementById("fav" + rid).innerHTML === "★");
    document.getElementById("fav" + rid).innerHTML = newFavoriteVal ? "★" : "☆";
    var pr = fetch(`${DBHelper.DATABASE_URL}restaurants/${rid}/?is_favorite=${newFavoriteVal}`, {method: "PUT"});
    pr.then(function(response) {
      if(response.status === 200) {
      }
    });
    dbPromise.then(function(db) {
      var tx = db.transaction("restaurants", "readwrite");
      var restaurantsStore = tx.objectStore("restaurants");
      restaurantsStore.get(rid).then(function(rec) {
        rec["is_favorite"] = newFavoriteVal;
        restaurantsStore.put(rec);
      });
    });
  }

  /**
   * Submit Review
   */
  static submitReview(review) {
    var pr = fetch(
      `${DBHelper.DATABASE_URL}reviews/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(review)
      }
    );
    pr.then(function(response) {
      response.json().then(function(newReview){
        DBHelper.storeReview(newReview);
      });
    }).catch(function() {
      DBHelper.storeReview(review);
    });
  }

  /**
   * Store Review in IDB
   */
  static storeReview(review) {
    if(!review.id) {
      review.id = `P${(new Date().getTime())}`;
    }
    dbPromise.then(function(db) {
      var tx = db.transaction("reviews", "readwrite");
      var store = tx.objectStore("reviews");
      store.put(review);
    });
  }

  /**
   * Update Offline Changes
   */
  static updateOfflineChanges() {
    if(navigator.onLine) {
      dbPromise.then(function(db) {
        var tx = db.transaction("restaurants", "readwrite");
        var restaurantsStore = tx.objectStore("restaurants");
        restaurantsStore.getAll().then(function(restaurantsList) {
          restaurantsList.forEach(function(restaurant) {
            var rid = restaurant.id;
            var newFavoriteVal = restaurant.is_favorite || "false";
            fetch(`${DBHelper.DATABASE_URL}restaurants/${rid}/?is_favorite=${newFavoriteVal}`, {method: "PUT"});
          });
        });
      });
      dbPromise.then(function(db) {
        var tx = db.transaction("reviews", "readwrite");
        var reviewsStore = tx.objectStore("reviews");
        return reviewsStore.openCursor();
      }).then(function sync(cursor) {
        if (!cursor) return;
        if(("" + cursor.value.id).startsWith("P")) {
          const review = {
            "restaurant_id": cursor.value.restaurant_id,
            "name": cursor.value.name,
            "rating": cursor.value.rating,
            "comments": cursor.value.comments
          };
          DBHelper.submitReview(review);
          cursor.delete();
        }
        return cursor.continue().then(sync);
      });
    }
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

