// ── mobile gyroscope ──

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

let _lastGamma = 0;
let _lastAlpha = 0;
let _lastColorTime = 0;
let _lastReverseTime = 0;
let _gyroActive = false;

function handleOrientation(e) {
  let beta  = e.beta;   // X: front-back tilt  → lid angle
  let gamma = e.gamma;  // Y: left-right tilt  → color change
  let alpha = e.alpha;  // Z: twist/compass    → reverse

  // X축 → targetAngle (desktop lid tilt 대응)
  if (beta !== null) {
    targetAngle = Math.max(40, Math.min(140, (beta + 90) / 180 * 100 + 40));
  }

  let now = Date.now();

  // Y축 → 색상/gradient 랜덤 변화 (25° 이상 기울어지면 트리거, 800ms 쿨다운)
  if (gamma !== null && now - _lastColorTime > 800) {
    let diff = Math.abs(gamma - _lastGamma);
    if (diff > 25) {
      let modes = ["yellow", "random", "darkBW", "lightBW", "gradient"];
      colorMode = modes[Math.floor(Math.random() * modes.length)];
      outlineMode = false;
      if (colorMode === "random") {
        randomColor = neonColors[Math.floor(Math.random() * neonColors.length)];
      }
      if (colorMode === "gradient") {
        gradientColors = [
          neonColors[Math.floor(Math.random() * neonColors.length)],
          [255, 255, 255],
        ];
      }
      _lastGamma = gamma;
      _lastColorTime = now;
    }
  }

  // Z축 → reverse 토글 (60° 이상 회전하면 트리거, 1000ms 쿨다운)
  if (alpha !== null && now - _lastReverseTime > 1000) {
    let diff = Math.abs(alpha - _lastAlpha);
    if (diff > 180) diff = 360 - diff; // wrap-around 처리
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
}

function setupMobile() {
  if (!isMobile) return;

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
      "background:#ffcc00;border:none;border-radius:8px;cursor:pointer;";
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
