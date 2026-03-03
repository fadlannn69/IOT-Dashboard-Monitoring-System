import { db } from "../Config/Firebase.js";
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";
console.log("Firebase Terkoneksi");


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

  // simpan max 9 log terakhir
  while (logBox.children.length > 9) {
    logBox.removeChild(logBox.firstChild);
  }
}

// DATABASE METHOD
// READ
function dbRead(path, callback) {
  onValue(ref(db, path), snap => {
    callback(snap.val());
  });
}


// WRITE
function dbWrite(path, value) {
  return set(ref(db, path), value)
    .catch(err => console.error("Error Ketika Menulis Data !! : ", err));
}


// LAMPU CONTROL
const panel = document.querySelector(".card-lampu");
const lampuList = document.querySelectorAll(".toggle-state");

// update background panel
function updatePanel() {
  if (!panel) return;

  const aktif = [...lampuList].find(l => l.checked);

  panel.style.backgroundColor = aktif
    ? aktif.dataset.color || "grey"
    : "white";
}

// bind change UI
lampuList.forEach(el => {
  el.addEventListener("change", updatePanel);
});

// bind lampu firebase
function kontrolLampu(elementId, dbPath) {
  const el = document.getElementById(elementId);
  if (!el) return;

  // UI → DB
  el.addEventListener("change", () => {
    dbWrite(dbPath, el.checked);
    addLog(`${elementId} ${el.checked ? "Dinyalakan" : "Dimatikan"}`);
  });

  // DB → UI (SYNC SAAT LOAD + REALTIME)
  dbRead(dbPath, val => {
    el.checked = !!val;
    updatePanel();
  });
}


kontrolLampu("Lampu_Merah", "lampu/led1");
kontrolLampu("Lampu_Hijau", "lampu/led2");
kontrolLampu("Lampu_Biru",  "lampu/led3");


// SERVO CONTROL
const angleMap = {
  p0: 0,
  p1: 45,
  p2: 90,
  p3: 135,
  p4: 180
};
// SYNC
dbRead("servo/angle", angle => {
  if (angle == null) return;

  const angleText = document.getElementById("servoAngle");
  const arm = document.getElementById("servoArm");

  if (angleText) angleText.textContent = angle + "°";
  if (arm) arm.style.transform = `rotate(${angle - 180}deg)`;
});

function setServo(preset) {
  if (!(preset in angleMap)) {
    console.warn("Preset tidak valid:", preset);
    return;
  }

  const angle = angleMap[preset];
  

  // UI update
  const angleText = document.getElementById("servoAngle");
  const arm = document.getElementById("servoArm");

  if (angleText) angleText.textContent = angle + "°";
  if (arm) arm.style.transform = `rotate(${angle - 180}deg)`;

  // log
  addLog(`Servo Mengarah ${angle} Derajat`);

  // firebase
  dbWrite("servo/angle", angle);
}

// event  tombol servo
const servoButtons = document.getElementById("servoButtons");

if (servoButtons) {
  servoButtons.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const preset = btn.dataset.preset;
    setServo(preset);
  });
}

// SENSOR ULTRASONIC
function ULTRASONIC() {
  const el = document.getElementById("nilai-sensor-jarak");
  if (!el) return;

  onValue(ref(db, "sensor/jarak"), snapshot => {
    const val = snapshot.val();
    el.textContent = `Jarak : ${val} cm`;
  });
}

ULTRASONIC();

// SENSOR DHT11
function DHT() {
  const el = document.getElementById("nilai-sensor-dht");
  const elm = document.getElementById("nilai-lembab-dht");
  if (!el) return;
  // SUHU
  onValue(ref(db, "sensor/suhu"), snapshot => {
    const val = snapshot.val();
    el.textContent = `Suhu : ${val} %`;
  })

  if (!elm) return;
  // KELEMBABAN
  onValue(ref(db, "sensor/kelembaban"), snapshot => {
    const val = snapshot.val();
    elm.textContent = `Kelembaban : ${val} %`;
  });
}
DHT();

// SENSOR API
function FIRE() {
  const el = document.getElementById("fire-safe");
  if (!el) return;

  onValue(ref(db, "sensor/api"), snapshot => {
    const val = snapshot.val();
    if (val == false){
      el.textContent = `AMAN `;
      el.style.background = "green"
      addLog("Aman Tidak Ada Api !")
    }
    else{
      el.textContent = `KEBAKARAN`;
      el.style.background = "red"
      addLog("KEBAKARAN !!!")
    }
  });
}

FIRE();
