import { db, auth , ADMIN_UID } from "../Config/Fire_Auth.js"; // Import Config Firebase
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js"; // Import Firebase Database 
import { onAuthStateChanged , signOut } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js"; // Import Firebase Auth 


// Ambil Waktu Saat Ini Untuk Log Aktivitas
function getTime() {
  return new Date().toLocaleTimeString("id-ID", { hour12: false });
}

// Tambahkan Fungsi Untuk Mengatur Log Aktivitas
function addLog(msg) {
  const logBox = document.getElementById("LogBox");
  if (!logBox) return;
  const item = document.createElement("div"); // Buat Element Baru Untuk Log
  item.textContent = `[${getTime()}] ${msg}`; // Isi Log 
  logBox.appendChild(item); // Masukkan Log Ke Dalam Element Div
  logBox.scrollTop = logBox.scrollHeight; // Log Dapat Di Scroll
  while (logBox.children.length > 9) logBox.removeChild(logBox.firstChild); // Log Akan Terhapus Otomatis Jika > 9
}

function dbRead(path, callback) { onValue(ref(db, path), snap => callback(snap.val())); } // Fungsi Untuk Membaca Isi Database
function dbWrite(path, value) { return set(ref(db, path), value).catch(err => console.error(err)); } // Fungsi Untuk Menulis Ke Dalam Database

// Fungsi Kontrol Lampu LED
function kontrolLampu(id, path) {
  const el = document.getElementById(id); 
  if (!el) return; // Pengecekan Element

  el.addEventListener("change", () => {
    dbWrite(path, el.checked);  // Tulis hasil Cek Lampu Ke DB
    addLog(`${id} ${el.checked ? "Dinyalakan" : "Dimatikan"}`); // Tambahkan Status Lampu Ke Log-Box
    updatePanel(); // Perbarui Tampilan UI Lampu
  });

  dbRead(path, val => {
    el.checked = !!val; // Cek Status Lampu
    updatePanel(); // Perbarui Tampilan UI Lampu
  });
}

const panel = document.querySelector(".card-lampu");
const lampuList = document.querySelectorAll(".toggle-state");
function updatePanel() {
  if (!panel) return; // Pengecekan Element
  const aktif = [...lampuList].find(l => l.checked); // Cek Status Lampu Aktif
  panel.style.backgroundColor = aktif ? aktif.dataset.color || "grey" : "white"; // Ubah Tampilan Background UI
}

// Servo
const angleMap = { p0: 0, p1: 45, p2: 90, p3: 135, p4: 180 }; // Inisialisasi Posisi Servo
function setServo(preset) {
  if (!(preset in angleMap)) return; 
  const angle = angleMap[preset]; // Ubah Nilai Posisi Servo Sesuai Dengan Data Posisi Servo
  const angleText = document.getElementById("servoAngle");
  const arm = document.getElementById("servoArm"); 
  if (angleText) angleText.textContent = angle + "°"; // Tambahkan Nilai Posisi Servo Di Tampilan UI
  if (arm) arm.style.transform = `rotate(${angle - 180}deg)`; // Rumus Perpindahan Posisi Servo Menyesuaikan Tampilan UI
  dbWrite("servo/angle", angle); // Tulis Posisi Servo Ke DB
  addLog(`Servo mengarah ${angle}°`); // Keterangan Posisi Servo
}

// Sensor
function ULTRASONIC() {
  const el = document.getElementById("nilai-sensor-jarak"); // Ambil Element
  if (el) dbRead("sensor/jarak", val => el.textContent = `Jarak : ${val} cm`); // Baca Nilai Sensor Jarak Dari DB , Lalu Tampilkan Di UI
}

function DHT() {
  const el = document.getElementById("nilai-sensor-dht"); // Ambil Element
  const elm = document.getElementById("nilai-lembab-dht"); // Ambil Element
  if (el) dbRead("sensor/suhu", val => el.textContent = `Suhu : ${val} °`); // Baca Nilai Sensor Suhu Dari DB , Lalu Tampilkan Di UI
  if (elm) dbRead("sensor/kelembaban", val => elm.textContent = `Kelembaban : ${val} %`); // Baca Nilai Sensor Lembab Dari DB , Lalu Tampilkan Di UI
}

function FIRE() {
  const el = document.getElementById("fire-safe"); // Ambil Element
  if (!el) return;
  dbRead("sensor/api", val => { // Baca Nilai Sensor Api Dari DB
    if (val === false) { // Jika Nilai Sensor == False 
      el.textContent = "AMAN"; 
      el.style.background = "green"; 
      addLog("Aman: Tidak ada api!"); // Tambahkan Ke Log-Box
    } else { // Jika Nilai Sensor == True 
      el.textContent = "KEBAKARAN";
      el.style.background = "red";
      addLog("KEBAKARAN!!!"); // Tambahkan Ke Log-Box
    }
  });
}

// Inisialisasi Semua Kontrol Saat Admin Login 
onAuthStateChanged(auth, (user) => {
  if (!user || user.uid !== ADMIN_UID) {
    window.location.replace("../../index.html");
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

  // Panggil Fungsi
  ULTRASONIC(); 
  DHT();
  FIRE();

  
// logout 
  const btnLogout = document.getElementById("logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.replace("../../index.html");
      } catch (err) {
        console.error("Logout gagal:", err);
      }
    });
  }
});
