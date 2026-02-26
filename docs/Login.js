import { auth, db, ADMIN_UID } from "../Config/Fire_Auth.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const msg = document.getElementById("msg");
const btn = document.getElementById("login");

btn.addEventListener("click", async () => {
  msg.textContent = "Checking...";
  btn.disabled = true;

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    msg.textContent = "Field kosong";
    btn.disabled = false;
    return;
  }

  try {
    // Ambil data admin
    const adminRef = doc(db, "admins", "admin");
    const snap = await getDoc(adminRef);

    if (!snap.exists()) {
      throw new Error("Admin config missing");
    }

    const { username: storedUsername, email } = snap.data();

    if (username !== storedUsername) {
      msg.textContent = "Username salah";
      btn.disabled = false;
      return;
    }

    // Firebase Auth 
    const cred = await signInWithEmailAndPassword(auth, email, password);
    
    //UID CHECK 
    if (cred.user.uid !== ADMIN_UID) {
      console.log("REAL UID:", cred.user.uid);
      await auth.signOut();
      msg.textContent = "Akses ditolak";
      btn.disabled = false;
      return;
    }

    window.location.replace("../Web/Dashboard/Ujikom.html");

  } catch (err) {
    console.error(err);
    msg.textContent = "Password Salah";
    btn.disabled = false;
  }
});

