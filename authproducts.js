// ================== IMPORTS ==================
import { auth, googleProvider, facebookProvider } from './firebase-init.js';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const db = getFirestore();

// ================== LOGIN POPUP ==================
window.toggleLoginPopup = function () {
  document.getElementById("loginPopup")?.classList.toggle("show-popup");
};
window.closeLoginPopup = function () {
  document.getElementById("loginPopup")?.classList.remove("show-popup");
};

// ================== LOGIN LOGIC ==================
async function loginWith(provider) {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userInfo = {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    };

    localStorage.setItem("user", JSON.stringify(userInfo));
    updateUserUI(userInfo);
    closeLoginPopup();

    // ---- Firestore role check ----
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let role = "user";
    if (userSnap.exists()) {
      role = userSnap.data().role || "user";
    } else {
      // First time login → create user doc
      await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        gender: "",
        birthday: "",
        role: "user"
      });
    }

    // ---- Redirect based on role ----
    if (role === "admin") {
      window.location.href = "pos_home.html";
    } else {
      window.location.href = "products.html";
    }

  } catch (error) {
    console.error("Login failed", error);
    alert("Login failed. Try again.");
  }
}

// ================== LOGOUT ==================
async function logoutUser() {
  try {
    await signOut(auth);
    localStorage.removeItem("user");
    updateUserUI(null);
    closeUserDrawer();
  } catch (error) {
    console.error("Logout failed", error);
  }
}

// ================== UPDATE USER ICONS ==================
// function updateUserUI(user) {
//   const headerBtn = document.getElementById("userBtnInside");
//   const floatBtn = document.getElementById("floatingUser");

//   const html = user
//     ? `<img src="${user.photoURL}" class="icon-img" title="${user.name}" alt="User">`
//     : `<img src="assets/icons/user.png" class="icon-img" alt="User">`;

//   if (headerBtn) headerBtn.innerHTML = html;
//   if (floatBtn) floatBtn.innerHTML = html;
// }

// ================== AUTH CHECK ==================
function checkAuth() {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (savedUser) updateUserUI(savedUser);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const userInfo = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      };
      localStorage.setItem("user", JSON.stringify(userInfo));
      updateUserUI(userInfo);

      // 🔄 Start realtime listener for user profile
      startRealtimeUserListener(user.uid);
    }
  });
}

// ================== REALTIME FIRESTORE LISTENER ==================
let unsubscribeUser = null;

function startRealtimeUserListener(uid) {
  if (unsubscribeUser) unsubscribeUser(); // stop previous listener

  const userRef = doc(db, "users", uid);
  unsubscribeUser = onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();

      // Update drawer fields live
      const phoneEl = document.getElementById("userPhone");
      const addressEl = document.getElementById("userAddress");
      const genderEl = document.getElementById("userGender");
      const birthdayEl = document.getElementById("userBirthday");

      if (phoneEl) phoneEl.value = data.phone || "";
      if (addressEl) addressEl.value = data.address || "";
      if (genderEl) genderEl.value = data.gender || "";
      if (birthdayEl) birthdayEl.value = data.birthday || "";
    }
  });
}

// ================== USER DRAWER ==================
window.openUserDrawer = async function () {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    toggleLoginPopup();
    return;
  }

  // Profile image
  const imgEl = document.getElementById("drawerProfileImg");
  if (imgEl) imgEl.src = user.photoURL || "assets/icons/user.png";

  // Name (fix: use textContent for <h3>)
  const nameEl = document.getElementById("drawerName");
  if (nameEl) nameEl.textContent = user.name || "User Name";

  // Email
  const emailEl = document.getElementById("drawerEmail");
  if (emailEl) emailEl.textContent = user.email || "No email";

  // Show drawer
  document.getElementById("userDrawer")?.classList.add("open");
  document.getElementById("drawerOverlay")?.classList.add("show");
};

window.closeUserDrawer = function () {
  document.getElementById("userDrawer")?.classList.remove("open");
  document.getElementById("drawerOverlay")?.classList.remove("show");
};

// ================== SAVE USER INFO ==================
window.saveUserInfo = async function () {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const name = document.getElementById("drawerName").value.trim();
  const phone = document.getElementById("userPhone").value.trim();
  const address = document.getElementById("userAddress").value.trim();
  const gender = document.getElementById("userGender").value;
  const birthday = document.getElementById("userBirthday")?.value || "";

  try {
    await setDoc(doc(db, "users", user.uid),
      { name, phone, address, gender, birthday },
      { merge: true }
    );

    user.name = name;
    localStorage.setItem("user", JSON.stringify(user));

    alert("Information saved successfully.");
  } catch (error) {
    console.error("Save failed", error);
    alert("Failed to save.");
  }
};

// ================== PHONE VERIFY (WITH MODAL) ==================
window.verifyPhone = function () {
  const phone = document.getElementById("userPhone").value.trim();
  if (!phone) return alert("Please enter your phone number first.");

  window.currentPhone = phone;
  document.getElementById("phoneVerifyModal").style.display = "block";
};

window.closePhoneVerifyModal = function() {
  document.getElementById("phoneVerifyModal").style.display = "none";
};

window.verifyViaWhatsApp = function() {
  const phone = window.currentPhone.replace(/\D/g, '');
  const message = encodeURIComponent(`Hello China Town Shop, please verify my number: +${phone}`);
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  closePhoneVerifyModal();
};

window.verifyViaTelegram = function() {
  alert("Telegram verification is coming soon!");
  closePhoneVerifyModal();
};

window.onclick = function(event) {
  const modal = document.getElementById("phoneVerifyModal");
  if (event.target == modal) modal.style.display = "none";
};

// ================== EVENTS ==================
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();

  document.querySelectorAll('#userBtnInside, #floatingUser').forEach(btn => {
    btn.addEventListener('click', openUserDrawer);
  });

  const closeBtn = document.querySelector("#loginPopup button[onclick*='closeLoginPopup']");
  if (closeBtn) {
    closeBtn.addEventListener("click", window.closeLoginPopup);
  }
});

// ================== EXPORTS ==================
window.loginGoogle = () => loginWith(googleProvider);
window.loginFacebook = () => loginWith(facebookProvider);
window.logoutUser = logoutUser;





function updateUserUI(user) {
  const headerBtn = document.getElementById("userArea");

  const html = user
    ? `<img src="${user.photoURL || 'assets/icons/user.png'}" 
             class="icon-img" 
             title="${user.name}" 
             alt="User" 
             style="width: 32px; height: 32px; border-radius: 50%; cursor:pointer;" />`
    : `<lord-icon src="https://cdn.lordicon.com/kdduutaw.json" trigger="hover"
          colors="primary:#c71f16,secondary:#e83a30"
          style="width:32px;height:32px;cursor:pointer;">
       </lord-icon>`;

  if (headerBtn) {
    headerBtn.innerHTML = html;

    // still attach click event
    headerBtn.onclick = openUserDrawer;
  }
}
