// Fire_Auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyASYEAnSMK81XvAJ9rh5CtsPzd3RP0W8V8",
  authDomain: "ujikom-fadlann.firebaseapp.com",
  databaseURL: "https://ujikom-fadlann-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ujikom-fadlann",
  storageBucket: "ujikom-fadlann.appspot.com",
  messagingSenderId: "796931011810",
  appId: "1:796931011810:web:8cd3cf1d86c60f902e5abb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Admin UID
export const ADMIN_UID = "03ubYX7JlSThzpou2CP3jhVR0NA2";
