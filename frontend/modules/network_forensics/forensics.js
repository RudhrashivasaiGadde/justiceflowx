console.log("[JusticeFlowX] System Initializing...");

const SYSTEM_PASSWORD = "justice123";

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/* ========================= CLOCK ========================= */
function startClock() {
  const el = document.getElementById("clockDisplay");
  if (!el) return;
  function tick() { el.textContent = new Date().toTimeString().slice(0, 8); }
  tick(); setInterval(tick, 1000);
}

/* ========================= CPU METER ========================= */
function startCpuMeter() {
  const el = document.getElementById("cpuVal");
  if (!el) return;
  let base = 30;
  setInterval(() => {
    base = Math.max(10, Math.min(85, base + (Math.random() - 0.5) * 14));
    el.textContent = Math.round(base) + "%";
    el.style.color = base > 70 ? "var(--red)" : base > 50 ? "var(--warn)" : "var(--green)";
  }, 1800);
}

/* ========================= MARQUEE ========================= */
function startMarquee() {
  const el = document.getElementById("marqueeText");
  if (!el) return;
  el.textContent = "â¬¢ JUSTICEFX BIOMETRIC AUTHENTICATION LAYER 2 ACTIVE  â  DATABASE NODES 14/14 CONNECTED  â  LAST BREACH ATTEMPT: 72H AGO â NEUTRALIZED  â  NEXT AUDIT: 06:00 UTC  â  ALL SUBSYSTEMS NOMINAL";
}

/* ========================= HEX CANVAS ========================= */
function initHexCanvas() {
  const canvas = document.getElementById("hexCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize(); window.addEventListener("resize", resize);
  const hexSize = 36;
  const cols = Math.ceil(window.innerWidth / (hexSize * 1.75)) + 2;
  const rows = Math.ceil(window.innerHeight / (hexSize * 1.55)) + 2;
  const hexagons = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      hexagons.push({
        x: c * hexSize * 1.75 + (r % 2 === 0 ? 0 : hexSize * 0.875),
        y: r * hexSize * 1.55,
        alpha: Math.random() * 0.15,
        pulseSpeed: randomBetween(0.002, 0.006),
        pulsePhase: Math.random() * Math.PI * 2,
        activated: false, activationTimer: 0,
      });
    }
  }
  setInterval(() => {
    const h = hexagons[Math.floor(Math.random() * hexagons.length)];
    if (!h.activated) { h.activated = true; h.activationTimer = 60; }
  }, 180);
  function drawHex(x, y, size, alpha, bright) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + size * Math.cos(angle), py = y + size * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = bright ? `rgba(0,245,255,${alpha * 3})` : `rgba(0,180,200,${alpha})`;
    ctx.lineWidth = bright ? 1.2 : 0.6;
    ctx.stroke();
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hexagons.forEach(h => {
      h.pulsePhase += h.pulseSpeed;
      const pulse = 0.04 + Math.sin(h.pulsePhase) * 0.035;
      if (h.activated) { h.activationTimer--; if (h.activationTimer <= 0) h.activated = false; drawHex(h.x, h.y, hexSize - 2, pulse * 4, true); }
      else { drawHex(h.x, h.y, hexSize - 2, pulse, false); }
    });
    requestAnimationFrame(animate);
  }
  animate();
}

/* ========================= DATA STREAMS ========================= */
function initDataStreams() {
  const container = document.getElementById("dataStreams");
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const stream = document.createElement("div");
    stream.className = "data-stream";
    stream.style.left = Math.random() * 100 + "vw";
    stream.style.animationDuration = randomBetween(6, 18) + "s";
    stream.style.animationDelay = randomBetween(0, 12) + "s";
    stream.style.height = randomBetween(80, 220) + "px";
    stream.style.opacity = randomBetween(0.1, 0.5);
    container.appendChild(stream);
  }
}

/* ========================= PARTICLES ========================= */
function initParticles() {
  const colors = ["#00f5ff", "#7b2fff", "#00ff88", "#ffffff"];
  for (let i = 0; i < 45; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = randomBetween(1.5, 4);
    p.style.width = size + "px"; p.style.height = size + "px";
    p.style.left = Math.random() * 100 + "vw";
    p.style.bottom = "-10px";
    p.style.animationDuration = randomBetween(12, 28) + "s";
    p.style.animationDelay = randomBetween(0, 20) + "s";
    const color = colors[Math.floor(Math.random() * colors.length)];
    p.style.background = color; p.style.boxShadow = `0 0 6px ${color}`;
    document.body.appendChild(p);
  }
}

/* ========================= ACCESS POPUP ========================= */
function showAccessPopup(granted, callback) {
  const popup = document.createElement("div");
  popup.className = "access-popup" + (granted ? " granted" : " denied");
  popup.innerHTML = `
    <span class="popup-icon">${granted ? "✓" : "✕"}</span>
    ${granted ? "ACCESS GRANTED" : "ACCESS DENIED"}
    <span class="popup-sub">${granted ? "IDENTITY VERIFIED — PROCEEDING" : "AUTHENTICATION FAILED"}</span>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup.classList.add("show"), 50);
  setTimeout(() => popup.classList.remove("show"), 2800);
  setTimeout(() => { popup.remove(); if (granted && callback) callback(); }, 3200);
}

/* ========================= PASSWORD CHECK ========================= */
function requestPassword(onSuccess, type) {
  let modalColor = "var(--cyan)";
  let modalGlow = "rgba(0,245,255,0.15)";
  let iconClass = "bx-fingerprint";
  let title = "Restricted Access";
  
  if (type === "face") { modalColor = "#b18fff"; modalGlow = "rgba(177,143,255,0.15)"; iconClass = "bx-scan"; title = "Biometric Access"; }
  else if (type === "forensic") { modalColor = "var(--green)"; modalGlow = "rgba(0,255,136,0.15)"; iconClass = "bx-search-alt"; title = "Forensics Access"; }
  else if (type === "network") { modalColor = "#00aaff"; modalGlow = "rgba(0,170,255,0.15)"; iconClass = "bx-folder"; title = "Case Control"; }
  else if (type === "forensics_db") { modalColor = "#ff0055"; modalGlow = "rgba(255,0,85,0.15)"; iconClass = "bx-radar"; title = "Network Forensics"; }
  else if (type === "chain_of_custody") { modalColor = "#ffd700"; modalGlow = "rgba(255,215,0,0.15)"; iconClass = "bx-link"; title = "Chain of Custody"; }
  else if (type === "threat_intel") { modalColor = "#00d4ff"; modalGlow = "rgba(0,212,255,0.15)"; iconClass = "bx-shield-quarter"; title = "Threat Intelligence"; }
  else if (type === "law") { modalColor = "#ff9f43"; modalGlow = "rgba(255,159,67,0.15)"; iconClass = "bxs-book-reader"; title = "Legal Education"; }
  else if (type === "capture") { modalColor = "#00f5ff"; modalGlow = "rgba(0,245,255,0.15)"; iconClass = "bx-wifi"; title = "Live Capture"; }
  else if (type === "analyzer") { modalColor = "#b18fff"; modalGlow = "rgba(177,143,255,0.15)"; iconClass = "bx-file-find"; title = "Packet Analyzer"; }
  else if (type === "threat") { modalColor = "#ff4757"; modalGlow = "rgba(255,71,87,0.15)"; iconClass = "bx-error-alt"; title = "Threat Intel"; }
  else if (type === "forensics") { modalColor = "#ff9f43"; modalGlow = "rgba(255,159,67,0.15)"; iconClass = "bx-line-chart"; title = "Traffic Analysis"; }

  if (!document.getElementById("global-password-styles")) {
    const style = document.createElement("style");
    style.id = "global-password-styles";
    style.innerHTML = `
      .global-password-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(4, 9, 20, 0.9); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 999999; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
      .global-password-overlay.show { opacity: 1; pointer-events: auto; }
      .global-password-modal { background: rgba(5,20,40,0.95); border: 1px solid var(--modal-color, #00f5ff); border-radius: 16px; padding: 40px; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 30px var(--modal-glow, rgba(0,245,255,0.15)); transform: translateY(20px) scale(0.95); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      .global-password-overlay.show .global-password-modal { transform: translateY(0) scale(1); }
      .global-password-modal .modal-icon { width: 64px; height: 64px; margin: 0 auto 20px; background: var(--modal-glow, rgba(0,245,255,0.1)); color: var(--modal-color, #00f5ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; border: 1px solid var(--modal-color, #00f5ff); box-shadow: 0 0 20px var(--modal-glow, rgba(0,245,255,0.2)); }
      .global-password-modal h2 { font-family: 'Rajdhani', sans-serif; font-size: 24px; color: #fff; margin-bottom: 8px; }
      .global-password-modal .modal-sub { color: #8899aa; font-size: 14px; margin-bottom: 24px; }
      .global-password-modal input { width: 100%; padding: 14px 20px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 16px; font-family: 'Share Tech Mono', monospace; text-align: center; outline: none; transition: border-color 0.3s; margin-bottom: 20px; }
      .global-password-modal input:focus { border-color: var(--modal-color, #00f5ff); }
      .global-password-modal .access-btn { width: 100%; padding: 14px; background: var(--modal-glow, rgba(0,245,255,0.15)); color: var(--modal-color, #00f5ff); border: 1px solid var(--modal-color, #00f5ff); border-radius: 8px; font-family: 'Rajdhani', sans-serif; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.3s; }
      .global-password-modal .access-btn:hover { background: var(--modal-color, #00f5ff); color: #000; }
      .global-password-modal .access-error { display: none; color: #ff4757; font-size: 13px; margin-top: 14px; }
    `;
    document.head.appendChild(style);
  }

  const overlay = document.createElement("div");
  overlay.className = "global-password-overlay";
  overlay.innerHTML = `
    <div class="global-password-modal" style="--modal-color:${modalColor}; --modal-glow:${modalGlow}">
      <div class="modal-icon"><i class='bx ${iconClass}'></i></div>
      <h2>${title}</h2>
      <p class="modal-sub">Enter the access code to unlock this module</p>
      <input type="password" id="globalAccessCode" placeholder="Enter Access Code" autocomplete="off">
      <button class="access-btn" id="globalAccessBtn"><i class='bx bx-log-in'></i> Unlock Module</button>
      <p class="access-error" id="globalAccessError"><i class='bx bx-error-circle'></i> Incorrect access code. Try again.</p>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add("show"), 10);
  
  const input = overlay.querySelector("#globalAccessCode");
  const btn = overlay.querySelector("#globalAccessBtn");
  const err = overlay.querySelector("#globalAccessError");
  input.focus();

  function attempt() {
    if (input.value === "justice123") {
      overlay.classList.remove("show");
      setTimeout(() => { overlay.remove(); showAccessPopup(true, onSuccess); }, 300);
    } else {
      err.style.display = "block";
      input.value = "";
      input.focus();
    }
  }

  btn.addEventListener("click", attempt);
  input.addEventListener("keypress", (e) => { if(e.key === "Enter") attempt(); });
}

/* =====================================================================
   SCAN OVERLAYS â UNIQUE PER TYPE
   ===================================================================== */

/* ========================= SCAN OVERLAYS ========================= */

/* ----------- TYPE 1: CAPTURE ----------- */
function showCaptureOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "module-loader";
  overlay.innerHTML = `
    <div class="loader-radar"></div>
    <div class="loader-title" style="color: var(--cyan)">INITIALIZING SNIFFER...</div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.classList.add("fade-out");
    setTimeout(() => { overlay.remove(); onComplete(); }, 500);
  }, 1200);
}

/* ----------- TYPE 2: ANALYZER ----------- */
function showAnalyzerOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "module-loader";
  overlay.innerHTML = `
    <div class="loader-hex">
      <span>0x4A</span><span>0x55</span><span>0x53</span><span>0x54</span>
    </div>
    <div class="loader-title" style="color: var(--green)">DECRYPTING PCAP STREAM...</div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.classList.add("fade-out");
    setTimeout(() => { overlay.remove(); onComplete(); }, 500);
  }, 1200);
}

/* ----------- TYPE 3: TRAFFIC ----------- */
function showTrafficOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "module-loader";
  overlay.innerHTML = `
    <div class="loader-topology">
      <div class="node"></div><div class="line"></div><div class="node"></div><div class="line"></div><div class="node"></div>
    </div>
    <div class="loader-title" style="color: #ff9f43">BUILDING TOPOLOGY...</div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.classList.add("fade-out");
    setTimeout(() => { overlay.remove(); onComplete(); }, 500);
  }, 1200);
}

/* ----------- TYPE 4: THREAT ----------- */
function showThreatOverlay(onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "module-loader";
  overlay.innerHTML = `
    <div class="loader-threat"></div>
    <div class="loader-title" style="color: #00bfff">QUERYING THREAT FEEDS...</div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.classList.add("fade-out");
    setTimeout(() => { overlay.remove(); onComplete(); }, 500);
  }, 1200);
}

/* ========================= BOOT SEQUENCE ========================= */
function runBootSequence(onComplete) {
  const bootOverlay = document.createElement("div");
  bootOverlay.id = "bootOverlay";
  bootOverlay.innerHTML = `
    <div class="boot-logo-area">JusticeFlowX</div>
    <div class="boot-subtitle">BIOMETRIC VERIFICATION SYSTEM v2.4</div>
    <div class="boot-progress-bar"><div class="boot-progress-fill" id="bootProgressFill"></div></div>
    <div id="bootLog"></div>
  `;
  document.body.appendChild(bootOverlay);
  const bootLog = bootOverlay.querySelector("#bootLog");
  const progressFill = bootOverlay.querySelector("#bootProgressFill");
  const bootMessages = [
    { text: "Kernel handshake complete", type: "ok" },
    { text: "Initializing biometric subsystem...", type: "" },
    { text: "Fingerprint module â ONLINE", type: "ok" },
    { text: "Facial recognition engine â ONLINE", type: "ok" },
    { text: "Syncing criminal database [14,217 records]...", type: "" },
    { text: "Database sync complete", type: "ok" },
    { text: "Loading surveillance grid overlay...", type: "" },
    { text: "Encryption layer â 256-bit AES active", type: "ok" },
    { text: "Threat detection module updated", type: "ok" },
    { text: "All systems nominal â READY", type: "ok" },
  ];
  let idx = 0;
  const interval = setInterval(() => {
    if (idx < bootMessages.length) {
      const { text, type } = bootMessages[idx];
      const div = document.createElement("div");
      div.textContent = text;
      if (type) div.classList.add(type);
      bootLog.appendChild(div);
      bootLog.scrollTop = bootLog.scrollHeight;
      progressFill.style.width = ((idx + 1) / bootMessages.length * 100) + "%";
      idx++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        bootOverlay.style.transition = "opacity 0.6s ease";
        bootOverlay.style.opacity = "0";
        setTimeout(() => { bootOverlay.remove(); onComplete(); }, 650);
      }, 400);
    }
  }, 380);
}

/* ========================= TERMINAL LOGS ========================= */
function startTerminal() {
  const termBody = document.getElementById("terminalBody");
  const termTime = document.getElementById("termTime");
  if (!termBody) return;
  const logs = [
    { text: "Fingerprint module ping â 2ms", type: "" },
    { text: "ALERT: Drone sector 7B activated", type: "alert" },
    { text: "Facial DB sync complete (14,217)", type: "ok" },
    { text: "Firewall scan â no anomalies", type: "ok" },
    { text: "ALERT: Unauthorized access blocked", type: "alert" },
    { text: "AI threat detection update pushed", type: "" },
    { text: "Biometric reader â standby mode", type: "" },
    { text: "WARN: Node 4C response degraded", type: "warn" },
    { text: "Encryption handshake verified", type: "ok" },
    { text: "Surveillance feed reconnected", type: "ok" },
    { text: "Case DB query completed (0.4ms)", type: "" },
    { text: "WARN: CPU spike â 78% peak", type: "warn" },
    { text: "Memory pool optimized", type: "ok" },
    { text: "Auth attempt from 192.168.1.44 â denied", type: "alert" },
  ];
  setInterval(() => {
    const { text, type } = logs[Math.floor(Math.random() * logs.length)];
    const div = document.createElement("div");
    div.textContent = text;
    if (type) div.classList.add(type);
    termBody.appendChild(div);
    if (termBody.children.length > 20) termBody.removeChild(termBody.firstChild);
    termBody.scrollTop = termBody.scrollHeight;
  }, 1600);
  setInterval(() => { if (termTime) termTime.textContent = new Date().toTimeString().slice(0, 8); }, 1000);
}

/* ========================= STAT COUNTER ========================= */
function animateStats() {
  document.querySelectorAll(".stat-val").forEach(el => {
    const target = parseFloat(el.getAttribute("data-count"));
    const isDecimal = target % 1 !== 0;
    const duration = 1800, startTime = performance.now();
    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = target * eased;
      el.textContent = isDecimal ? val.toFixed(1) : Math.round(val);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

/* ========================= BRAND GLITCH ========================= */
function initBrandGlitch() {
  const brand = document.querySelector(".brand");
  if (!brand) return;
  brand.setAttribute("data-text", brand.textContent);
  setInterval(() => {
    brand.style.transform = `translate(${(Math.random() - 0.5) * 3}px, ${(Math.random() - 0.5) * 2}px)`;
    brand.style.filter = `hue-rotate(${Math.random() * 30}deg)`;
    setTimeout(() => { brand.style.transform = "translate(0,0)"; brand.style.filter = ""; }, 100);
  }, 3000);
}

/* ========================= HOVER SOUND ========================= */
function initHoverSound() {
  const scanSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-interface-zoom-890.mp3");
  scanSound.volume = 0.4;
  document.querySelectorAll(".scan-btn").forEach(btn => {
    btn.addEventListener("mouseenter", () => { scanSound.currentTime = 0; scanSound.play().catch(() => {}); });
  });
}

/* ========================= SCAN BUTTONS â ROUTE BY TYPE ========================= */
function initScanButtons() {
  document.querySelectorAll(".scan-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      const type = btn.getAttribute("data-type") || "finger";
      const href = btn.getAttribute("href");

      function afterScan() {
        requestPassword(() => { if (href) window.location.href = href; }, type);
      }

      switch (type) {
          case "capture":  showCaptureOverlay(afterScan);     break;
          case "analyzer": showAnalyzerOverlay(afterScan);    break;
          case "threat":   showThreatOverlay(afterScan);      break;
          case "forensics":showTrafficOverlay(afterScan);     break;
          default:         showCaptureOverlay(afterScan);     break;
        }
    });
  });
}

/* ========================= MENU DROPDOWN ========================= */
function initMenu() {
  const menuBtn = document.getElementById("menuBtn");
  const dropdown = document.getElementById("menuDropdown");
  if (!menuBtn || !dropdown) return;
  menuBtn.addEventListener("click", e => { e.stopPropagation(); dropdown.classList.toggle("show"); });
  document.addEventListener("click", () => dropdown.classList.remove("show"));
}

/* ========================= LOGOUT ========================= */
function initLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", e => {
    e.preventDefault();
    window.close();
    setTimeout(() => { alert("You have been logged out. Please close the tab manually if it didn't close automatically."); window.location.href = "about:blank"; }, 100);
  });
}


/* ========================= NAV LINKS ROUTING ========================= */
function initNavLinks() {
  document.querySelectorAll(".nav-link, .dropdown a").forEach(link => {
    link.addEventListener("click", e => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || link.id === "logoutBtn") return;
      if (link.classList.contains("active")) return;

      e.preventDefault();

      function navigate() { window.location.href = href; }

      if (href.includes("live_capture.html")) showCaptureOverlay(navigate);
      else if (href.includes("packet_analyzer.html")) showAnalyzerOverlay(navigate);
      else if (href.includes("threat_intel.html")) showThreatOverlay(navigate);
      else if (href.includes("forensics.html")) showTrafficOverlay(navigate);
      else if (href.includes("index.html")) navigate(); // Dashboard has boot sequence on load
      else navigate();
    });
  });
}

/* ========================= MAIN INIT ========================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("[JusticeFlowX] DOM Ready - Launching boot sequence");
  initHexCanvas();
  initDataStreams();
  initParticles();

  function onSystemReady() {
    startClock();
    startCpuMeter();
    startMarquee();
    initBrandGlitch();
    initHoverSound();
    initScanButtons();
    initMenu();
    initLogout();
    initNavLinks();
    if(typeof startTerminal === 'function') startTerminal();
    if(typeof animateStats === 'function') animateStats();
    console.log("[JusticeFlowX] All systems online.");
  }

  if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
    runBootSequence(onSystemReady);
  } else {
    onSystemReady();
  }
});

// Export Functionality
function exportData(type) {
  let content = "";
  let filename = "";
  let mimeType = "";

  if (type === 'pcap') {
    content = "dummy pcap binary data blob...";
    filename = "capture_log_7849.pcap";
    mimeType = "application/vnd.tcpdump.pcap";
  } else if (type === 'pdf') {
    content = "dummy pdf binary data blob...";
    filename = "forensics_report.pdf";
    mimeType = "application/pdf";
  } else if (type === 'csv') {
    content = "Timestamp,Source,Destination,Protocol,Length,Info\n2026-07-19 10:15:32,192.168.1.5,10.0.0.1,TCP,64,SYN\n";
    filename = "traffic_analysis.csv";
    mimeType = "text/csv";
  }

  // Create a blob and trigger download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Show a mini notification if possible, or just alert
  alert("Exporting " + filename.toUpperCase() + "...");
}
