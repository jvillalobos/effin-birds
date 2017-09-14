// If you're forking this add-on, you need your own API key from Tumblr.
// See https://www.tumblr.com/docs/en/api/v2
const API_KEY = "tgqJTvQ1xGDcJpAPsPe5PMaoQQAbgeaYuZHgbfsMerM0Zt0uH2";
const REQ_LIMIT = 20;
const EB_URL =
  "https://api.tumblr.com/v2/blog/effinbirds.tumblr.com/posts/photo";
const UPDATE_RECENT_RATE = 24 * 60 * 60 * 1000; // 1 day (in ms). Update recent.
const UPDATE_ALL_RATE = 7 * 24 * 60 * 60 * 1000; // 7 days (in ms). Update all.
const STORAGE_POSTS = "eb-posts";
const STORAGE_LAST_UPDATE_RECENT = "eb-last-update-recent";
const STORAGE_LAST_UPDATE_ALL = "eb-last-update-all";

let effinBirds = new Map();

/**
 * Loads posts from storage.
 */
function loadStoredPosts() {
  browser.storage.local.get(STORAGE_POSTS, results => {
    effinBirds = new Map(results[STORAGE_POSTS]);
    //console.log(`Loaded posts: ${effinBirds.size}.`);
  });
}

/**
 * Checks if the birds list needs to be updated, and triggers an update if
 * needed.
 */
function updateBirds() {
  browser.storage.local.get(STORAGE_LAST_UPDATE_ALL, results => {
    let lastUpdateAll = (results[STORAGE_LAST_UPDATE_ALL] || 0);
    let timeDiffAll = Date.now() - lastUpdateAll;
    // check if we haven't updated the full list in a while.
    if (0 == effinBirds.size || UPDATE_ALL_RATE < timeDiffAll) {
      //console.log("Doing a full bird update.");
      getAllBirds();
    } else {
      browser.storage.local.get(STORAGE_LAST_UPDATE_RECENT, results => {
        let lastUpdate = (results[STORAGE_LAST_UPDATE_RECENT] || 0);
        let timeDiff = Date.now() - lastUpdate;
        // check if we haven't done a partial update in a while.
        if (UPDATE_RECENT_RATE < timeDiff) {
          //console.log("Doing a recent bird update.");
          //getRecentBirds();
        } else {
          // check back when an update is due.
          //console.log("Birds are up to date.");
          window.setTimeout(function() { updateBirds(); }, timeDiff);
        }
      });
    }
  });
}

function getAllBirds() {
  getBirds(true, 0);
}

function getRecentBirds() {
  getBirds(false, 0);
}

/**
 * Requests bird posts from the Tumblr API.
 * @param getAll true if all posts should be obtained, false if we only need the
 * first set.
 * @param offset where to start in the list of posts.
 */
function getBirds(getAll, offset) {
  let xhr = new XMLHttpRequest();

  xhr.addEventListener("load", function() {
    let data = JSON.parse(xhr.responseText);

    if (data && data.meta && 200 == data.meta.status && data.response) {
      processBirds(data.response.posts);
      // check if we need to get more birds. Otherwise update the timestamps.
      if (getAll) {
        if (data.response.total_posts > (offset + data.response.posts.length)) {
          getBirds(true, (offset + data.response.posts.length));
        } else {
          let toStore = {};

          toStore[STORAGE_LAST_UPDATE_RECENT] = Date.now();
          toStore[STORAGE_LAST_UPDATE_ALL] = Date.now();
          browser.storage.local.set(toStore);
        }
      } else {
        let toStore = {};

        toStore[STORAGE_LAST_UPDATE_RECENT] = Date.now();
        browser.storage.local.set(toStore);
      }
    }
  });

  xhr.open(
    "GET", EB_URL + `?api_key=${API_KEY}&limit=${REQ_LIMIT}&offset=${offset}`);
  xhr.send();
}

/**
 * Obtains bird post data from the API response, loads it in memory and stores
 * it.
 * @param posts object that should contain posts from the API.
 */
function processBirds(posts) {
  if (posts) {
    let newPost;

    for (let post of posts) {
      try {
        newPost =
          { "id": post.id,
            "url": post.post_url,
            "summary": post.summary,
            "photo": post.photos[0].original_size };
        effinBirds.set(post.id, newPost);
      } catch (e) {
        console.log(`Invalid post entry:\n${e}`);
      }
    }

    storeBirds();
  } else {
    console.log(`Invalid posts object: ${posts}.`);
  }
}

/**
 * Stores bird posts.
 */
function storeBirds() {
  let toStore = {};

  toStore[STORAGE_POSTS] = [];
  effinBirds.forEach(
    (value, key, map) => {toStore[STORAGE_POSTS].push([key, value])});
  browser.storage.local.set(toStore);
}

/**
 * Gets a random bird to show in the popup.
 */
function getRandomBird() {
  let randomIndex = Math.floor(Math.random() * effinBirds.size) + 1;
  let birds = effinBirds.values();
  let bird;

  for (let i = 0; i < randomIndex; i++) {
    bird = birds.next().value;
  }

  return bird;
}

function startup() {
  loadStoredPosts();
  updateBirds();
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if ("random-bird" == request) {
    sendResponse(getRandomBird());
  }
});

startup();
