// Ujikom.js
import { db, auth } from "../Config/Fire_Auth.js";
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

// Logging
function getTime() {
  return new Date().toLocaleTimeString("id-ID", { hour12: false });
}

function addLog(msg) {
  const logBox = document.getElementById("LogBox");
  if (!logBox) return;
  const item = document.createElement("div");
  item.textContent = `[${getTime()}] ${msg}`;
  logBox.appendChild(item);
  logBox.scrollTop = logBox.scrollHeight;
  while (logBox.children.length > 9) logBox.removeChild(logBox.firstChild);
}

// DB read/write
function dbRead(path, callback) { onValue(ref(db, path), snap => callback(snap.val())); }
function dbWrite(path, value) { return set(ref(db, path), value).catch(err => console.error(err)); }

// Lampu
function kontrolLampu(id, path) {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener("change", () => {
    dbWrite(path, el.checked);
    addLog(`${id} ${el.checked ? "Dinyalakan" : "Dimatikan"}`);
    updatePanel();
  });

  dbRead(path, val => {
    el.checked = !!val;
    updatePanel();
  });
}

const panel = document.querySelector(".card-lampu");
const lampuList = document.querySelectorAll(".toggle-state");
function updatePanel() {
  if (!panel) return;
  const aktif = [...lampuList].find(l => l.checked);
  panel.style.backgroundColor = aktif ? aktif.dataset.color || "grey" : "white";
}

// Servo
const angleMap = { p0: 0, p1: 45, p2: 90, p3: 135, p4: 180 };
function setServo(preset) {
  if (!(preset in angleMap)) return;
  const angle = angleMap[preset];
  const angleText = document.getElementById("servoAngle");
  const arm = document.getElementById("servoArm");
  if (angleText) angleText.textContent = angle + "°";
  if (arm) arm.style.transform = `rotate(${angle - 180}deg)`;
  dbWrite("servo/angle", angle);
  addLog(`Servo mengarah ${angle}°`);
}

// Sensor
function ULTRASONIC() {
  const el = document.getElementById("nilai-sensor-jarak");
  if (el) dbRead("sensor/jarak", val => el.textContent = `Jarak : ${val} cm`);
}

function DHT() {
  const el = document.getElementById("nilai-sensor-dht");
  const elm = document.getElementById("nilai-lembab-dht");
  if (el) dbRead("sensor/suhu", val => el.textContent = `Suhu : ${val} °`);
  if (elm) dbRead("sensor/kelembaban", val => elm.textContent = `Kelembaban : ${val} %`);
}

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

// Inisialisasi semua kontrol **setelah user login**
onAuthStateChanged(auth, user => {
  if (!user) {
    console.warn("User belum login!");
    return;
  }

  kontrolLampu("Lampu_Merah", "lampu/led1");
  kontrolLampu("Lampu_Hijau", "lampu/led2");
  kontrolLampu("Lampu_Biru", "lampu/led3");

  const servoButtons = document.getElementById("servoButtons");
  if (servoButtons) {
    servoButtons.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;
      setServo(btn.dataset.preset);
    });
  }

  ULTRASONIC();
  DHT();
  FIRE();
});
