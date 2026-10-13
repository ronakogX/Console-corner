import { firebaseConfig, apiBaseUrl } from "./firebase-config.js";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const prices = { "PS5": 200, "PS4": 150, "Racing Simulator": 250 };
const passes = {
  "Starter Pass": { price: 570, hours: 3 },
  "Gamer Pass": { price: 930, hours: 5 },
  "Ultimate Pass": { price: 1799, hours: 10 },
  "Legend Pass": { price: 2650, hours: 15 }
};
let confirmation = null;
let currentUser = null;
let currentIdToken = null;
let recaptcha = null;
let firebaseReady = false;
let firebaseAuth = null;
let confirmationResult = null;
let accountPoints = 0;

$("#year").textContent = new Date().getFullYear();

const menuToggle = $(".menu-toggle");
const nav = $(".main-nav");
menuToggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
$$(".main-nav a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3200);
}
function openDialog(id) {
  const d = $(id);
  if (d && !d.open) d.showModal();
}
function closeDialog(id) {
  const d = $(id);
  if (d?.open) d.close();
}
function setMessage(selector, message, isError = false) {
  const el = $(selector);
  el.textContent = message;
  el.style.background = isError ? "#f9e8e5" : "#f1f2e9";
  el.style.color = isError ? "#8a3326" : "";
}
function currency(n) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n); }

function setStation(station) {
  $("#booking-station").value = station;
  updateTotal();
  $("#booking").scrollIntoView({ behavior: "smooth" });
}
function updateTotal() {
  const station = $("#booking-station").value;
  const duration = Number($("#booking-duration").value || 1);
  $("#booking-total").textContent = currency((prices[station] || 200) * duration);
}
$("#booking-station").addEventListener("change", updateTotal);
$("#booking-duration").addEventListener("change", updateTotal);
$$(".book-station").forEach(btn => btn.addEventListener("click", () => setStation(btn.dataset.station)));
$$(".book-pass").forEach(btn => btn.addEventListener("click", () => {
  const pass = passes[btn.dataset.pass];
  if (!pass) return;
  const message = `Hi Console Corner! I'd like to book the ${btn.dataset.pass} (₹${pass.price.toLocaleString("en-IN")}, ${pass.hours} hours). Please confirm availability and terms.`;
  window.open(`https://wa.me/918878821377?text=${encodeURIComponent(message)}`, "_blank", "noopener");
}));
const dateInput = $("#booking-datetime");
const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
dateInput.min = now.toISOString().slice(0, 16);
dateInput.value = now.toISOString().slice(0, 16);

$("#booking-form").addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const name = String(data.get("name") || "").trim();
  const station = String(data.get("station") || "");
  const duration = Number(data.get("duration") || 1);
  const date = String(data.get("datetime") || "");
  const notes = String(data.get("notes") || "").trim();
  if (!name || !prices[station] || !date) return showToast("Please complete the required booking details.");
  const cost = prices[station] * duration;
  const message = [
    "Hi Console Corner! I'd like to request a booking.",
    `Name: ${name}`,
    `Setup: ${station}`,
    `Duration: ${duration} hour${duration > 1 ? "s" : ""}`,
    `Estimated total: ${currency(cost)}`,
    `Preferred time: ${new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`,
    notes ? `Notes: ${notes}` : "",
    "Please confirm availability. I understand this is a request, not a confirmed booking."
  ].filter(Boolean).join("\n");
  window.open(`https://wa.me/918878821377?text=${encodeURIComponent(message)}`, "_blank", "noopener");
});

$("#open-login").addEventListener("click", () => openDialog("#login-modal"));
$("#open-redeem").addEventListener("click", () => {
  openDialog("#redeem-modal");
  if (currentUser) setMessage("#redeem-message", "Enter the code provided by Console Corner staff.");
});
$("#account-redeem").addEventListener("click", () => {
  closeDialog("#login-modal");
  openDialog("#redeem-modal");
});
$("#sign-out").addEventListener("click", async () => {
  try {
    if (firebaseAuth) {
      const { signOut } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      await signOut(firebaseAuth);
    }
  } catch {}
  currentUser = null;
  currentIdToken = null;
  $("#account-panel").classList.add("hidden");
  $("#phone-number").disabled = false;
  $("#send-otp").classList.remove("hidden");
  $("#otp-area").classList.add("hidden");
  setMessage("#login-message", "Signed out.");
});

async function initFirebase() {
  const valid = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("REPLACE_") &&
    firebaseConfig.projectId && !firebaseConfig.projectId.startsWith("REPLACE_");
  if (!valid) {
    setMessage("#login-message", "Phone login isn't configured yet. Add your Firebase web app values in firebase-config.js and enable Phone Authentication.");
    return false;
  }
  try {
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    firebaseAuth = getAuth(app);
    firebaseReady = true;
    setMessage("#login-message", "Enter your mobile number to receive a verification code.");
    return true;
  } catch (e) {
    setMessage("#login-message", "Firebase could not initialize. Check your Firebase configuration and internet connection.", true);
    return false;
  }
}

$("#send-otp").addEventListener("click", async () => {
  const phone = $("#phone-number").value.replace(/\D/g, "");
  if (!/^[6-9]\d{9}$/.test(phone)) {
    setMessage("#login-message", "Enter a valid 10-digit Indian mobile number.", true);
    return;
  }
  if (!(await initFirebase())) return;
  try {
    const { RecaptchaVerifier, signInWithPhoneNumber } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    if (!recaptcha) {
      recaptcha = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", { size: "normal" });
      await recaptcha.render();
    }
    confirmationResult = await signInWithPhoneNumber(firebaseAuth, `+91${phone}`, recaptcha);
    $("#otp-area").classList.remove("hidden");
    $("#send-otp").classList.add("hidden");
    setMessage("#login-message", "OTP sent. Check your SMS and enter the 6-digit code.");
  } catch (e) {
    setMessage("#login-message", e?.message || "Could not send OTP. Check Firebase Phone Authentication and authorized domains.", true);
    if (recaptcha) { try { await recaptcha.clear(); } catch {} recaptcha = null; }
  }
});

$("#verify-otp").addEventListener("click", async () => {
  const code = $("#otp-code").value.trim();
  if (!/^\d{6}$/.test(code)) return setMessage("#login-message", "Enter the 6-digit verification code.", true);
  try {
    const result = await confirmationResult.confirm(code);
    currentUser = result.user;
    currentIdToken = await currentUser.getIdToken(true);
    $("#phone-number").disabled = true;
    $("#otp-area").classList.add("hidden");
    $("#send-otp").classList.add("hidden");
    $("#account-panel").classList.remove("hidden");
    $("#account-phone").textContent = currentUser.phoneNumber || "";
    setMessage("#login-message", "Phone verified successfully.");
    await refreshAccount();
  } catch (e) {
    setMessage("#login-message", e?.message || "Verification failed. Check the code and try again.", true);
  }
});

async function api(path, body) {
  if (!apiBaseUrl) throw new Error("The secure rewards API isn't configured yet. Deploy the Cloudflare Worker and set apiBaseUrl in firebase-config.js.");
  if (!currentIdToken) throw new Error("Please sign in first.");
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${currentIdToken}` },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed. Please try again.");
  return data;
}
async function refreshAccount() {
  try {
    const data = await api("/api/me");
    accountPoints = Number(data.points || 0);
    $("#points-balance").textContent = accountPoints.toLocaleString("en-IN");
    $("#reward-balance-copy").textContent = `You have ${accountPoints.toLocaleString("en-IN")} points available. Choose a reward to discuss with staff.`;
    setMessage("#login-message", "You're signed in. Your balance is up to date.");
  } catch (e) {
    $("#points-balance").textContent = "—";
    setMessage("#login-message", e.message);
  }
}
$("#submit-redeem").addEventListener("click", async () => {
  const code = $("#redeem-code").value.trim();
  if (!code) return setMessage("#redeem-message", "Enter the code you received from staff.", true);
  if (!currentUser || !currentIdToken) {
    setMessage("#redeem-message", "Please sign in with your phone number first.", true);
    closeDialog("#redeem-modal"); openDialog("#login-modal"); return;
  }
  try {
    const data = await api("/api/redeem-code", { code });
    setMessage("#redeem-message", `Success! ${data.pointsAdded} points were added to your account.`);
    $("#redeem-code").value = "";
    await refreshAccount();
  } catch (e) {
    setMessage("#redeem-message", e.message, true);
  }
});
$$(".reward-option").forEach(btn => btn.addEventListener("click", () => {
  if (!currentUser) {
    closeDialog("#reward-modal"); openDialog("#login-modal");
    return setMessage("#login-message", "Sign in to check your balance and use your rewards.");
  }
  const kind = btn.dataset.reward;
  if (kind === "food") {
    setMessage("#reward-message", "Show your balance to staff before payment. Staff can apply up to ₹1 per point on eligible food and beverage items; discount cannot exceed the eligible bill.");
  } else {
    const minutes = Math.floor(accountPoints / 200) * 60;
    setMessage("#reward-message", `${accountPoints} points currently equal ${minutes} minutes of gaming time. Staff must confirm availability and apply the reward.`);
  }
}));
$("#open-redeem").addEventListener("click", () => {
  if (!currentUser) setMessage("#redeem-message", "Sign in with your phone number first. Your code can only be credited once.");
});

if (!apiBaseUrl) {
  $("#submit-redeem").title = "Requires the secure Cloudflare Worker API to be deployed";
}
