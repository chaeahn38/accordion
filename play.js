// ── auto play ──

let playMode = false;
let playInterval = null;

function togglePlay() {
  playMode = !playMode;
  if (playMode) {
    playInterval = setInterval(playStep, 400);
  } else {
    clearInterval(playInterval);
    playInterval = null;
  }
}

function playStep() {
  let r = Math.random();

  if (r < 0.4) {
    // splitMode 1~10 랜덤
    splitMode = Math.floor(Math.random() * 10) + 1;
  } else if (r < 0.75) {
    // colorMode 랜덤
    let modes = ["yellow", "random", "darkBW", "lightBW", "gradient"];
    colorMode = modes[Math.floor(Math.random() * modes.length)];
    outlineMode = false;
    if (colorMode === "random") {
      randomColor = neonColors[Math.floor(Math.random() * neonColors.length)];
    }
    if (colorMode === "gradient") {
      gradientColors = [neonColors[Math.floor(Math.random() * neonColors.length)], [255, 255, 255]];
    }
  } else if (r < 0.9) {
    // reverseRatios 토글
    reverseRatios = !reverseRatios;
  } else {
    // outlineMode 토글
    outlineMode = !outlineMode;
  }
}
