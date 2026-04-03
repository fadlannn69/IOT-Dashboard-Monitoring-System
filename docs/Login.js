// login.js
import { auth, ADMIN_UID } from "/Web/Config/Fire_Auth.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

const btn = document.getElementById("login");
const msg = document.getElementById("msg");

btn.addEventListener("click", async () => {
  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    msg.textContent = "Field kosong";
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    if (cred.user.uid !== ADMIN_UID) {
      msg.textContent = "Akses ditolak";
      await auth.signOut();
      return;
    }

    msg.textContent = "Login berhasil!";
    window.location.replace("./Ujikom.html"); // buka dashboard
  } catch (err) {
    console.error(err);
    msg.textContent = "Email / Password salah";
  }
});
