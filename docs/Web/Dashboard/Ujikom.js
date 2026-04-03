import { db } from "../Config/Fire_Auth.js";
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

// LOG AKTIVITAS
function getTime() {
  return new Date().toLocaleTimeString("id-ID", { hour12: false });
}

function addLog(message) {
  const logBox = document.getElementById("LogBox");
  if (!logBox) return;

  const item = document.createElement("div");
  item.textContent = `[${getTime()}] ${message}`;
  logBox.appendChild(item);
  logBox.scrollTop = logBox.scrollHeight;

  while (logBox.children.length > 9) {
    logBox.removeChild(logBox.firstChild);
  }
}

// DATABASE
function dbRead(path, callback) {
  onValue(ref(db, path), snap => callback(snap.val()));
}

function dbWrite(path, value) {
  return set(ref(db, path), value)
    .then(() => console.log(`Tulis DB: ${path} = ${value}`))
    .catch(err => console.error("Error menulis data:", err));
}

// Tunggu DOM siap sebelum attach listener
document.addEventListener("DOMContentLoaded", () => {

  // LAMPU CONTROL
  const panel = document.querySelector(".card-lampu");
  const lampuList = document.querySelectorAll(".toggle-state");

  function updatePanel() {
    if (!panel) return;
    const aktif = [...lampuList].find(l => l.checked);
    panel.style.backgroundColor = aktif ? aktif.dataset.color || "grey" : "white";
  }

  lampuList.forEach(el => el.addEventListener("change", updatePanel));

  function kontrolLampu(elementId, dbPath) {
    const el = document.getElementById(elementId);
    if (!el) return console.warn(`Tombol ${elementId} tidak ditemukan!`);

    // UI → DB
    el.addEventListener("change", () => {
      console.log(`Toggle ${elementId}: ${el.checked}`);
      dbWrite(dbPath, el.checked);
      addLog(`${elementId} ${el.checked ? "Dinyalakan" : "Dimatikan"}`);
    });

    // DB → UI realtime
    dbRead(dbPath, val => {
      el.checked = !!val;
      updatePanel();
    });
  }

  kontrolLampu("Lampu_Merah", "lampu/led1");
  kontrolLampu("Lampu_Hijau", "lampu/led2");
  kontrolLampu("Lampu_Biru", "lampu/led3");

  // SERVO CONTROL
  const angleMap = { p0: 0, p1: 45, p2: 90, p3: 135, p4: 180 };

  function setServo(preset) {
    if (!(preset in angleMap)) return console.warn("Preset tidak valid:", preset);
    const angle = angleMap[preset];

    const angleText = document.getElementById("servoAngle");
    const arm = document.getElementById("servoArm");

    if (angleText) angleText.textContent = angle + "°";
    if (arm) arm.style.transform = `rotate(${angle - 180}deg)`;

    addLog(`Servo mengarah ${angle}°`);
    dbWrite("servo/angle", angle);
  }

  const servoButtons = document.getElementById("servoButtons");
  if (servoButtons) {
    servoButtons.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;
      setServo(btn.dataset.preset);
    });
  }

  // SENSOR ULTRASONIC
  const ultrasonicEl = document.getElementById("nilai-sensor-jarak");
  if (ultrasonicEl) dbRead("sensor/jarak", val => ultrasonicEl.textContent = `Jarak : ${val} cm`);

  // SENSOR DHT11
  const suhuEl = document.getElementById("nilai-sensor-dht");
  const lembabEl = document.getElementById("nilai-lembab-dht");
  if (suhuEl) dbRead("sensor/suhu", val => suhuEl.textContent = `Suhu : ${val} °`);
  if (lembabEl) dbRead("sensor/kelembaban", val => lembabEl.textContent = `Kelembaban : ${val} %`);

  // SENSOR API
  const fireEl = document.getElementById("fire-safe");
  if (fireEl) dbRead("sensor/api", val => {
    if (val === false) {
      fireEl.textContent = "AMAN";
      fireEl.style.background = "green";
      addLog("Aman: Tidak ada api!");
    } else {
      fireEl.textContent = "KEBAKARAN";
      fireEl.style.background = "red";
      addLog("KEBAKARAN!!!");
    }
  });

});
