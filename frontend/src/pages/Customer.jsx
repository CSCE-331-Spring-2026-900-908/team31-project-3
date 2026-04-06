import React, { useEffect, useState } from "react";
import API_BASE_URL from "../config/apiBaseUrl";

const Customer = () => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const loadSession = async () => {
    setStatus("loading");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        setStatus("ready");
        return;
      }

      const data = await response.json();
      setUser(data.user || null);
      setStatus("ready");
    } catch (err) {
      setError("Unable to load session");
      setStatus("error");
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <div style={{ padding: "24px" }}>
      <h1>Customer View</h1>

      {status === "loading" ? <p>Checking login...</p> : null}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

      {user ? (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user.picture_url ? (
            <img
              src={user.picture_url}
              alt="Profile"
              style={{ width: "40px", height: "40px", borderRadius: "9999px" }}
            />
          ) : null}
          <div>
            <div style={{ fontWeight: 600 }}>{user.name || user.email}</div>
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{user.email}</div>
          </div>
          <button type="button" onClick={handleLogout} style={{ marginLeft: "16px" }}>
            Sign out
          </button>
        </div>
      ) : (
        <button type="button" onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
      )}
    </div>
  );
};

export default Customer;
