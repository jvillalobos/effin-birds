// If you're forking this add-on, you need your own API key from Tumblr.
// See https://www.tumblr.com/docs/en/api/v2
const API_KEY = "tgqJTvQ1xGDcJpAPsPe5PMaoQQAbgeaYuZHgbfsMerM0Zt0uH2";
const REQ_LIMIT = 20;
const EB_URL =
  "https://api.tumblr.com/v2/blog/effinbirds.tumblr.com/posts/photo";
const STORAGE_POSTS = "eb-posts";

let effinBirds = new Map();

function getSomeEffinBirds() {
  let xhr = new XMLHttpRequest();
  let offset = 0;

  xhr.addEventListener("load", function() {
    let data = JSON.parse(xhr.responseText);

    if (data && data.meta && data.meta.status == 200 && data.response) {
      storeBirds(data.response.posts);
    }
  });
  xhr.open(
    "GET", EB_URL + `?api_key=${API_KEY}&limit=${REQ_LIMIT}&offset=${offset}`);
  xhr.send();
}

/**
 * Loads posts from storage.
 */
function loadPosts() {
  browser.storage.local.get(STORAGE_POSTS, storedPosts => {
    console.log(storedPosts[STORAGE_POSTS]);
    effinBirds = new Map(storedPosts[STORAGE_POSTS]);
    console.log(`Loaded posts: ${effinBirds.size}.`);
  });
}

/**
 * Stores posts.
 */
function storePosts() {
  let toStore = {};

  toStore[STORAGE_POSTS] = [];
  effinBirds.forEach(
    (value, key, map) => {toStore[STORAGE_POSTS].push([key, value])});
  browser.storage.local.set(toStore);
}

/**
 * Stores EB posts obtained from the API.
 * @param posts object that should contain posts from the API.
 */
function storeBirds(posts) {
  if (posts) {
    let loadedPosts = {};
    let newPost;

    for (let post of posts) {
      try {
        newPost =
          { "id": post.id,
            "url": post.post_url,
            "summary": post.summary,
            "photo": post.photos[0].original_size };
        loadedPosts[post.id] = newPost;
        effinBirds.set(post.id, newPost);
      } catch (e) {
        console.log(`Invalid post entry:\n${e}`);
      }
    }

    storePosts();
  } else {
    console.log(`Invalid posts object: ${posts}.`);
  }
}

function getRandomBird() {
  let randomIndex = Math.floor(Math.random() * effinBirds.size) + 1;
  let birds = effinBirds.values();
  let bird;

  for (let i = 0; i < randomIndex; i++) {
    bird = birds.next().value;
  }

  return bird;
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request == "random-bird") {
    sendResponse(getRandomBird());
  }
});

loadPosts();
//getSomeEffinBirds();
