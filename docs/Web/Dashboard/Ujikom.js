////////// firebase.js //////////

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
  onValue(ref(db, path), snap => {
    callback(snap.val());
  });
}

function dbWrite(path, value) {
  return set(ref(db, path), value)
    .catch(err => console.error("Error menulis data:", err));
}

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
  if (!el) return;

  el.addEventListener("change", () => {
    dbWrite(dbPath, el.checked);
    addLog(`${elementId} ${el.checked ? "Dinyalakan" : "Dimatikan"}`);
  });

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
  if (!(preset in angleMap)) {
    console.warn("Preset tidak valid:", preset);
    return;
  }
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
function ULTRASONIC() {
  const el = document.getElementById("nilai-sensor-jarak");
  if (!el) return;
  dbRead("sensor/jarak", val => el.textContent = `Jarak : ${val} cm`);
}
ULTRASONIC();

// SENSOR DHT11
function DHT() {
  const el = document.getElementById("nilai-sensor-dht");
  const elm = document.getElementById("nilai-lembab-dht");
  if (el) dbRead("sensor/suhu", val => el.textContent = `Suhu : ${val} °`);
  if (elm) dbRead("sensor/kelembaban", val => elm.textContent = `Kelembaban : ${val} %`);
}
DHT();

// SENSOR API
function FIRE() {
  const el = document.getElementById("fire-safe");
  if (!el) return;
  dbRead("sensor/api", val => {
    if (val === false) {
      el.textContent = "AMAN";
      el.style.background = "green";
      addLog("Aman: Tidak ada api!");
    } else {
      el.textContent = "KEBAKARAN";
      el.style.background = "red";
      addLog("KEBAKARAN!!!");
    }
  });
}
FIRE();
