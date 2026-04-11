// FIREBASE INIT
import { initializeApp } from"https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getDatabase } from"https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

const firebaseConfig = {
apiKey: "AIzaSyASYEAnSMK81XvAJ9rh5CtsPzd3RP0W8V8",
authDomain: "ujikom-fadlann.firebaseapp.com",
databaseURL: "https://ujikom-fadlann-default-rtdb.asia-southeast1.firebasedatabase.app",
projectId: "ujikom-fadlann",
storageBucket: "ujikom-fadlann.firebasestorage.app",
messagingSenderId: "796931011810",
appId: "1:796931011810:web:8cd3cf1d86c60f902e5abb",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
