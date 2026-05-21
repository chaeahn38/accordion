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

  // X축 → targetAngle (desktop lid tilt 대응)
  if (beta !== null) {
    targetAngle = Math.max(40, Math.min(140, ((beta + 90) / 180) * 100 + 40));
  }

  let now = Date.now();

  // Y축 → gamma 각도 직접 splitMode 매핑 (-90°~+90° → 1~10)
  if (gamma !== null) {
    splitMode = Math.min(10, Math.max(1, Math.ceil(((gamma + 90) / 180) * 10)));
  }

  // Z축 → reverse 토글 (60° 이상 회전하면 트리거, 1000ms 쿨다운)
  if (alpha !== null && now - _lastReverseTime > 1000) {
    let diff = Math.abs(alpha - _lastAlpha);
    if (diff > 180) diff = 360 - diff;
    if (diff > 60) {
      reverseRatios = !reverseRatios;
      _lastAlpha = alpha;
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
