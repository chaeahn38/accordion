let angle = 0;
let targetAngle = 0;
let connected = false;
let ws;

// ── WebSocket ──
function connectWS() {
  ws = new WebSocket("ws://localhost:8081");

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.angle !== undefined) {
      targetAngle = data.angle;
      connected = true;
    }
    if (data.status === "connected") connected = true;
    if (data.error) connected = false;
  };

  ws.onclose = () => {
    connected = false;
    setTimeout(connectWS, 3000);
  };
}
