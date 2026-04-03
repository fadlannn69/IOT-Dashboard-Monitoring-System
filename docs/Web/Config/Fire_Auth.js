// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyASYEAnSMK81XvAJ9rh5CtsPzd3RP0W8V8",
  authDomain: "ujikom-fadlann.firebaseapp.com",
  projectId: "ujikom-fadlann",
  appId: "1:796931011810:web:8cd3cf1d86c60f902e5abb",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// ADMIN UID
export const ADMIN_UID = "03ubYX7JlSThzpou2CP3jhVR0NA2";
