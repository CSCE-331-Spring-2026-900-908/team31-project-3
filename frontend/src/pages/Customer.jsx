import React, { useEffect, useState } from "react";
import API_BASE_URL from "../config/apiBaseUrl";
import Chatbot from "./Chatbot";
import "./Customer.css";

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
    <div className="customer-page">
      <div className="customer-page__content">
        <h1 className="customer-page__title">Self Serve Kiosk</h1>

        {status === "loading" ? (
          <p className="customer-page__muted">Checking login...</p>
        ) : null}
        {error ? <p className="customer-page__error">{error}</p> : null}

        {user ? (
          <div className="customer-page__session">
            {user.picture_url ? (
              <img
                src={user.picture_url}
                alt="Profile"
                className="customer-page__avatar"
              />
            ) : null}
            <div>
              <div className="customer-page__name">{user.name || user.email}</div>
              <div className="customer-page__email">{user.email}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="customer-page__button customer-page__button--secondary"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="customer-page__button"
          >
            Sign in with Google
          </button>
        )}
      </div>

      <Chatbot />
    </div>
  );
};

export default Customer;
