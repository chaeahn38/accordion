// ── mobile gyroscope ──

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

let _lastAlpha = 0;
let _lastReverseTime = 0;
let _gyroActive = false;

function randomColorStep() {
  let modes = ["random", "gradient"];
  colorMode = modes[Math.floor(Math.random() * modes.length)];
  outlineMode = false;
  if (colorMode === "random") {
    randomColor = neonColors[Math.floor(Math.random() * neonColors.length)];
  } else {
    gradientColors = [
      neonColors[Math.floor(Math.random() * neonColors.length)],
      neonColors[Math.floor(Math.random() * neonColors.length)],
    ];
  }
}

function handleOrientation(e) {
  let beta = e.beta; // X: front-back tilt  → lid angle
  let gamma = e.gamma; // Y: left-right tilt  → splitMode change
  let alpha = e.alpha; // Z: twist/compass    → reverse

  let now = Date.now();

  // Y축 → |gamma| 기반 splitMode 매핑 (0°→1, ±80°→10)
  if (gamma !== null) {
    splitMode = Math.min(10, Math.max(1, Math.round((Math.min(Math.abs(gamma), 80) / 80) * 9) + 1));
  }

  // Z축 → targetAngle (나침반 회전, 0°~360° → 40~140 매핑)
  if (alpha !== null) {
    targetAngle = Math.max(40, Math.min(140, (alpha / 360) * 100 + 40));
  }

  // X축 → reverse 토글 (앞뒤 60° 이상 기울면 트리거, 1000ms 쿨다운)
  if (beta !== null && now - _lastReverseTime > 1000) {
    if (Math.abs(beta) > 60) {
      reverseRatios = !reverseRatios;
      _lastReverseTime = now;
    }
  }
}

function startGyro() {
  _gyroActive = true;
  _lastAlpha = 0;
  window.addEventListener("deviceorientation", handleOrientation);
  setInterval(randomColorStep, 300);
}

function applyMobileSplitShiftX() {
  // 모바일 전용 x-shift (index 1~10 = splitMode 1~10)
  // → sketch.js setup() 에서 호출됨 (let 선언 이후)
  splitShiftX = [0, -2, -3, -3, -3, -3, 0, 0, 0, 0, 0];
}

function setupMobile() {
  if (!isMobile) return;

  // 화면 터치 → 입력창 토글 (input 자체 터치는 제외)
  document.addEventListener(
    "touchend",
    function (e) {
      if (!wordInputEl) return;
      if (e.target === wordInputEl.elt) return;
      if (wordInputEl.elt.style.display === "none" || wordInputEl.elt.style.display === "") {
        wordInputEl.style("display", "block");
        wordInputEl.elt.focus();
      } else {
        wordInputEl.style("display", "none");
        wordInputEl.value("");
      }
    },
    { passive: true }
  );

  // iOS 13+는 퍼미션 요청 필요
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    let btn = document.createElement("button");
    btn.textContent = "Enable Gyroscope";
    btn.style.cssText =
      "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);" +
      "z-index:9999;padding:20px 40px;font-size:24px;font-family:sans-serif;" +
      "background:#ffffff;color:#0055ff;border:none;border-radius:8px;cursor:pointer;";
    document.body.appendChild(btn);
    btn.addEventListener("click", () => {
      DeviceOrientationEvent.requestPermission().then((state) => {
        if (state === "granted") {
          document.body.removeChild(btn);
          startGyro();
        }
      });
    });
  } else {
    // Android 등 퍼미션 불필요
    startGyro();
  }
}

setupMobile();
