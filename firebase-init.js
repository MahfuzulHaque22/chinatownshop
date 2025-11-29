import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-crKfYn4PUeQXLIMIpCrfOVuuUXb4dfs",
  authDomain: "chinatownshop.firebaseapp.com",
  projectId: "chinatownshop",
  storageBucket: "chinatownshop.firebasestorage.app",
  messagingSenderId: "444794925166",
  appId: "1:444794925166:web:d5ce731d58c090fa49767f"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, facebookProvider, db };



