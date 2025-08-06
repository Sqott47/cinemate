import React, { useEffect } from "react";
import { v4 as uuidv4 } from "uuid"; // npm install uuid
import { API_BASE_URL } from "../config";

export default function TelegramLogin({ onAuthSuccess }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?7";
    script.setAttribute("data-telegram-login", "cinebot_bot_bot"); // Без @
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    document.getElementById("telegram-login-btn").appendChild(script);

    window.onTelegramAuth = (user) => {
  fetch(`${API_BASE_URL}/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "ok") {
        onAuthSuccess({ id: data.user_id, name: data.name }); // ✅
      } else {
        alert("Login failed: " + data.error);
      }
    });
};

  }, []);

  const handleGuestLogin = () => {
    const randomName = "Guest" + Math.floor(Math.random() * 1000);
    const randomId = uuidv4();
    onAuthSuccess({ id: randomId, name: randomName });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <h2>Login</h2>
      <div id="telegram-login-btn" style={{ marginBottom: "1rem" }}></div>
      <p>или</p>
      <button onClick={handleGuestLogin}>
        🚪 Войти как гость
      </button>
    </div>
  );
}
