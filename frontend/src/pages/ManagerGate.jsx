import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API_BASE_URL from "../config/apiBaseUrl";

const ManagerGate = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const loadStatus = async () => {
    setStatus("loading");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/manager-status`, {
        credentials: "include",
      });

      if (response.status === 401) {
        setStatus("unauthenticated");
        return;
      }

      if (response.status === 403) {
        setStatus("forbidden");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to verify manager access");
      }

      setStatus("authorized");
    } catch (err) {
      setError(err.message || "Unable to verify manager access");
      setStatus("error");
    }
  };

  useEffect(() => {
    const authResult = new URLSearchParams(location.search).get("auth");
    if (authResult === "denied") {
      setError("Invalid manager login. Use an approved email.");
    } else if (authResult === "failed") {
      setError("Manager login failed. Please try again.");
    }

    loadStatus();
  }, [location.search]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google?role=manager`;
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setStatus("unauthenticated");
  };

  if (status === "authorized") {
    return children;
  }

  return (
    <div className="page login-page">
      <div className="pin-card">
        <h1 className="pin-title">Manager Access</h1>

        {status === "loading" ? (
          <p className="pin-subtitle">Checking access...</p>
        ) : null}

        {status === "unauthenticated" ? (
          <>
            <p className="pin-subtitle">Sign in with Google to continue.</p>
            <button type="button" className="submit-btn" onClick={handleGoogleLogin}>
              Sign in with Google
            </button>
          </>
        ) : null}

        {status === "forbidden" ? (
          <>
            <p className="pin-error">Your account is not authorized for manager access.</p>
            <button type="button" className="submit-btn" onClick={handleLogout}>
              Sign out
            </button>
          </>
        ) : null}

        {status === "error" ? <p className="pin-error">{error}</p> : null}
      </div>
    </div>
  );
};

export default ManagerGate;
