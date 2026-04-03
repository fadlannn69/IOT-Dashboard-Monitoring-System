////////// Login.js //////////

import { auth, ADMIN_UID } from "./Web/Config/Fire_Auth.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

const msg = document.getElementById("msg");
const btn = document.getElementById("login");

btn.addEventListener("click", async () => {
  msg.textContent = "Checking...";
  btn.disabled = true;

  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    msg.textContent = "Field kosong";
    btn.disabled = false;
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    if (cred.user.uid !== ADMIN_UID) {
      await auth.signOut();
      msg.textContent = "Akses ditolak";
      btn.disabled = false;
      return;
    }

    window.location.replace("./Web/Dashboard/Ujikom.html");

  } catch (err) {
    console.error(err);
    msg.textContent = "Email / Password salah";
    btn.disabled = false;
  }
});
