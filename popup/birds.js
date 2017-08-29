function randomBird() {
  browser.runtime.sendMessage("random-bird").then(bird => {
    let birdViewer = document.getElementById("bird-viewer");

    birdViewer.src = bird.photo.url;
  });
}

window.addEventListener("load", function() {
  let randomButton = document.getElementById("button-random");

  console.log("Loading.");

  randomButton.addEventListener("click", function() { randomBird(); });
  randomBird();
});
