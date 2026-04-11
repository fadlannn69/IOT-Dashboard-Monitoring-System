import { auth, ADMIN_UID } from "./Web/Config/Fire_Auth.js"; // Import Auth Config
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js"; // Import Firebase Auth 


const btn = document.getElementById("login"); 
const msg = document.getElementById("msg"); 

// Logic Listener If Button On Click
btn.addEventListener("click", async () => {
  const email = document.getElementById("username").value.trim(); // Ambil Username User Input
  const password = document.getElementById("password").value; // Ambil Password User Input

  // Logika Untuk Mengecek Kolom Yang Tidak Di Isi
  if (!email || !password) {
    msg.textContent = "Field kosong";
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Logika Untuk Membandingkan Kredensial Input User Dengan Kredensial Auth di Firebase
    if (cred.user.uid !== ADMIN_UID) {
      msg.textContent = "Akses ditolak";
      await auth.signOut();
      return;
    }
    
    msg.textContent = "Login berhasil!"; // Cetak Pesan Indikator Berhasil Di Tampilan Web
    window.location.replace("./Web/Dashboard/Ujikom.html"); // Buka Dashboard IOT
  } catch (err) {
    console.error(err); // Cetak Detail Error Di Console
    msg.textContent = "Email / Password salah";  // Cetak Pesan Indikator Kesalahan Di Tampilan Web
  }
});
