// ── auto mode ──

const autoLines = ["LOOK", "INTOTHE", "GAP", "YOUWILL", "SEE", "TRUTH"];
const autoRatios = [80, 50, 30, 10, 5, 1, 0.5];
8;
let auto_colorMode = "color"; // "color" | "bw_dark" | "bw_light"
let auto_shiftX = -12; // px, negative = left
let auto_lineColors = [];

function initAutoColors() {
  let shuffled = [...neonColors].sort(() => random(-1, 1));
  auto_lineColors = shuffled.slice(0, autoLines.length);
}

function drawAuto() {
  if (auto_lineColors.length === 0) initAutoColors();

  if (auto_colorMode === "bw_light") {
    background(255);
  } else {
    background(0);
  }

  textAlign(CENTER, TOP);
  textFont("Unica77");
  textSize(160);
  drawingContext.letterSpacing = "-8px";
  let fontHeight = textAscent() + textDescent();
  let count = constrain(floor(map(angle, 20, 140, 1, 7)), 1, 6);
  let startIdx = autoLines.length - count;
  let activeRatios = autoRatios.slice(startIdx, autoLines.length);
  let total = activeRatios.reduce((a, b) => a + b, 0);
  let currentY = 0;

  for (let i = 0; i < count; i++) {
    let lineIdx = startIdx + i;
    let h = height * (activeRatios[i] / total);
    let scaleX = (width * 0.99) / textWidth(autoLines[lineIdx]);
    let scaleY = h / 120;

    if (auto_colorMode === "bw_dark") {
      fill(255);
      noStroke();
    } else if (auto_colorMode === "bw_light") {
      fill(0);
      noStroke();
    } else {
      fill(...auto_lineColors[lineIdx]);
      noStroke();
    }

    push();
    translate(width / 2 + auto_shiftX, currentY);
    scale(scaleX, scaleY);
    text(autoLines[lineIdx], 0, 0);
    pop();

    currentY += h;
  }
}

function keyPressedAuto() {
  if (key === "b" || key === "B") {
    auto_colorMode = auto_colorMode === "bw_dark" ? "bw_light" : "bw_dark";
  }

  if (key === "q" || key === "Q") {
    auto_colorMode = "color";
    initAutoColors();
  }
}
