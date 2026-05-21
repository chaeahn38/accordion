// ── p5.js ──

let word = "a";
let splitMode = 1; // 1 = angle-based, 2 = two equal, 3 = three equal

let activeMode = "auto"; // "sketch" | "auto"

let reverseRatios = false;
let lineGap = 0;
let smoothRatios = [];
let drawnBg = [6, 6, 8];
let drawnFill = [255, 204, 0];
let drawnStroke = [255, 204, 0];
// px x-shift per splitMode (index 1~10), negative = left
let splitShiftX = [0, -80, -40, -20, -20, -10, -10, -10, -10, -10, -8];
let inkCache = {};
let colorMode = "yellow"; // "yellow", "random", "darkBW", "lightBW", "gradient"
let randomColor;
let gradientColors = [];
let outlineMode = false;

let useKoreanFont = false;
let wordInputEl;

const neonColors = [
  [255, 255, 0], // yellow
  [0, 255, 128], // green
  [0, 255, 255], // cyan
  [255, 0, 255], // magenta
  [255, 80, 0], // orange
  [180, 0, 255], // purple
  [255, 20, 147], // pink
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  connectWS();

  let style = document.createElement("style");
  style.textContent = `@font-face { font-family: 'BlackHanSans'; src: url('asset/BlackHanSans-Regular.ttf') format('truetype'); }`;
  document.head.appendChild(style);

  wordInputEl = createInput("");
  wordInputEl.style("position", "fixed");
  wordInputEl.style("top", "50%");
  wordInputEl.style("left", "50%");
  wordInputEl.style("transform", "translate(-50%, -50%)");
  wordInputEl.style("font-size", "48px");
  wordInputEl.style("width", "80px");
  wordInputEl.style("padding", "8px");
  wordInputEl.style("border", "1px solid rgb(255, 255, 255)");
  wordInputEl.style("background", "#111");
  wordInputEl.style("color", "#fff");
  wordInputEl.style("outline", "none");
  wordInputEl.style("text-align", "center");
  wordInputEl.style("z-index", "9999");
  wordInputEl.style("display", "none");
  wordInputEl.elt.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      let val = wordInputEl.value().trim();
      if (val.length > 0) {
        word = val;
        useKoreanFont = /[가-힣ᄀ-ᇿ㄰-㆏]/.test(val);
      }
      wordInputEl.style("display", "none");
      wordInputEl.value("");
    } else if (e.key === "Escape") {
      wordInputEl.style("display", "none");
      wordInputEl.value("");
    }
    e.stopPropagation();
  });
}

function keyPressed() {
  if (key === "w" || key === "W") {
    wordInputEl.style("display", "block");
    wordInputEl.elt.focus();
    return;
  }

  if (key === "a" || key === "A") {
    activeMode = activeMode === "auto" ? "sketch" : "auto";
    return;
  }

  if (activeMode === "auto") {
    keyPressedAuto();
    return;
  }

  if (key === "1") splitMode = 1;
  if (key === "2") splitMode = 2;
  if (key === "3") splitMode = 3;
  if (key === "4") splitMode = 4;
  if (key === "5") splitMode = 5;
  if (key === "6") splitMode = 6;
  if (key === "7") splitMode = 7;
  if (key === "8") splitMode = 8;
  if (key === "9") splitMode = 9;
  if (key === "0") splitMode = 10;

  if (key === "r" || key === "R") {
    reverseRatios = !reverseRatios;
  }

  if (key === "q" || key === "Q") {
    colorMode = "random";
    outlineMode = false;
    randomColor = neonColors[floor(random(neonColors.length))];
  }

  if (key === "b" || key === "B") {
    outlineMode = false;
    if (colorMode === "darkBW") {
      colorMode = "lightBW";
    } else {
      colorMode = "darkBW";
    }
  }

  if (key === "l" || key === "L") {
    outlineMode = !outlineMode;
  }

  if (key === "g" || key === "G") {
    colorMode = "gradient";
    outlineMode = false;
    gradientColors = [neonColors[floor(random(neonColors.length))], [255, 255, 255]];
  }

  if (key === "p" || key === "P") {
    togglePlay();
  }
}

function measureInkPixels(char, fontName) {
  let key = char + "|" + fontName;
  if (inkCache[key]) return inkCache[key];

  let sz = 300,
    pad = 100;
  let cw = sz + pad * 2,
    ch = sz + pad * 2;
  let oc = document.createElement("canvas");
  oc.width = cw;
  oc.height = ch;
  let ctx = oc.getContext("2d");
  ctx.font = sz + 'px "' + fontName + '"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.fillText(char, cw / 2, ch / 2);

  let data = ctx.getImageData(0, 0, cw, ch).data;
  let minX = cw,
    maxX = 0,
    minY = ch,
    maxY = 0;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (data[(y * cw + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  let result = {
    w: maxX - minX,
    h: maxY - minY,
    dx: (minX + maxX) / 2 - cw / 2,
    dy: (minY + maxY) / 2 - ch / 2,
    sz: sz,
  };

  // only cache once the font is actually loaded (prevents wrong measurement on first frame)
  if (document.fonts.check(sz + 'px "' + fontName + '"')) {
    inkCache[key] = result;
  }
  return result;
}

function draw() {
  angle = lerp(angle, targetAngle, 0.05);

  if (activeMode === "auto") {
    drawAuto();
    return;
  }

  // determine target colors
  let tBg, tFill, tStroke;
  if (colorMode === "darkBW") {
    tBg = [0, 0, 0];
    tFill = [255, 255, 255];
    tStroke = [255, 255, 255];
  } else if (colorMode === "lightBW") {
    tBg = [255, 255, 255];
    tFill = [0, 0, 0];
    tStroke = [0, 0, 0];
  } else if (colorMode === "random") {
    tBg = [6, 6, 8];
    tFill = randomColor || [255, 255, 0];
    tStroke = tFill;
  } else {
    tBg = [6, 6, 8];
    tFill = [255, 204, 0];
    tStroke = [255, 204, 0];
  }

  // lerp colors toward target
  const CT = 0.08;
  for (let i = 0; i < 3; i++) {
    drawnBg[i] = lerp(drawnBg[i], tBg[i], CT);
    drawnFill[i] = lerp(drawnFill[i], tFill[i], CT);
    drawnStroke[i] = lerp(drawnStroke[i], tStroke[i], CT);
  }

  // background & color
  if (colorMode === "gradient" && gradientColors.length >= 2) {
    let c1 = gradientColors[0];
    let bgGrad = drawingContext.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, `rgb(0, 0, 0)`);
    bgGrad.addColorStop(1, `rgb(${c1[0]},${c1[1]},${c1[2]})`);
    drawingContext.fillStyle = bgGrad;
    drawingContext.fillRect(0, 0, width, height);
    noFill();
    noStroke();
  } else {
    background(drawnBg[0], drawnBg[1], drawnBg[2]);
    if (outlineMode) {
      noFill();
      stroke(drawnStroke[0], drawnStroke[1], drawnStroke[2]);
      strokeWeight(1);
    } else {
      fill(drawnFill[0], drawnFill[1], drawnFill[2]);
      noStroke();
    }
  }

  let fontName = useKoreanFont ? "BlackHanSans" : "Unica77";
  textFont(fontName);
  textSize(160);
  drawingContext.font = '160px "' + fontName + '"';

  // pixel-accurate ink bounds (cached per word+font)
  let ink = measureInkPixels(word, fontName);
  let s = 160 / ink.sz;
  let inkW = ink.w * s;
  let inkH = ink.h * s;
  let inkDX = ink.dx * s; // offset: ink center → typographic middle, X
  let inkDY = ink.dy * s; // offset: ink center → typographic middle, Y

  // save fill/stroke set by p5 above
  let savedFill = drawingContext.fillStyle;
  let savedStroke = drawingContext.strokeStyle;

  let count = floor(map(angle, 40, 140, 1, 12));
  count = constrain(count, 1, 12);
  let base = [140, 120, 80, 60, 40, 30, 20, 10, 5].slice(0, count);
  let targetRatios = reverseRatios ? [...base].reverse() : base;

  // grow: new rows start at 0 and lerp up
  while (smoothRatios.length < targetRatios.length) smoothRatios.push(0);
  // shrink: pad target with 0 so disappearing rows lerp to 0
  let paddedTarget = [...targetRatios];
  while (paddedTarget.length < smoothRatios.length) paddedTarget.push(0);
  for (let i = 0; i < smoothRatios.length; i++) {
    smoothRatios[i] = lerp(smoothRatios[i], paddedTarget[i], 0.1);
  }
  // remove rows that have fully faded out
  while (smoothRatios.length > targetRatios.length && smoothRatios[smoothRatios.length - 1] < 0.5) {
    smoothRatios.pop();
  }

  let total = smoothRatios.reduce((a, b) => a + b, 0);
  let currentY = 0;

  let cols = splitMode;

  for (let i = 0; i < smoothRatios.length; i++) {
    let h = height * (smoothRatios[i] / total);
    let y = currentY + h / 2;

    for (let j = 0; j < cols; j++) {
      let x = (j + 0.5) * (width / cols) + (splitShiftX[splitMode] || 0);
      let scaleX = (width / cols / inkW) * 0.98;
      let scaleY = h / inkH;
      push();
      translate(x, y);
      scale(scaleX, scaleY);

      drawingContext.textAlign = "center";
      drawingContext.textBaseline = "middle";

      if (colorMode === "gradient" && gradientColors.length >= 2) {
        let localTop = (0 - y) / scaleY;
        let localBottom = (height - y) / scaleY;
        let c1 = gradientColors[0];
        let grad = drawingContext.createLinearGradient(0, localTop, 0, localBottom);
        grad.addColorStop(0, `rgb(${c1[0]},${c1[1]},${c1[2]})`);
        grad.addColorStop(1, `rgb(0, 0, 0)`);
        drawingContext.fillStyle = grad;
        drawingContext.fillText(word, -inkDX, -inkDY);
      } else if (outlineMode) {
        drawingContext.strokeStyle = savedStroke;
        drawingContext.lineWidth = 1 / min(scaleX, scaleY);
        drawingContext.strokeText(word, -inkDX, -inkDY);
      } else {
        drawingContext.fillStyle = savedFill;
        drawingContext.fillText(word, -inkDX, -inkDY);
      }

      pop();
    }

    currentY += h + lineGap;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
