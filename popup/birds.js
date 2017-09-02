let loadedBird = null;

function randomBird() {
  browser.runtime.sendMessage("random-bird").then(bird => {
    let birdViewer = document.getElementById("bird-viewer");

    loadedBird = bird;
    birdViewer.src = loadedBird.photo.url;
  });
}

function viewBird() {
  browser.tabs.create({ "url": loadedBird.url });
}

function copyBirdURL() {
  let hiddenInput = document.getElementById("input-hidden-url");

  hiddenInput.value = loadedBird.url;
  hiddenInput.select();
  document.execCommand("Copy");
  hiddenInput.value = "";
  document.getElementById("button-copy").focus();
}

window.addEventListener("load", function() {
  let randomButton = document.getElementById("button-random");
  let viewButton = document.getElementById("button-view");
  let copyButton = document.getElementById("button-copy");

  randomButton.addEventListener("click", function() { randomBird(); });
  viewButton.addEventListener("click", function() { viewBird(); });
  copyButton.addEventListener("click", function() { copyBirdURL(); });
  randomBird();
  randomButton.focus();
});
