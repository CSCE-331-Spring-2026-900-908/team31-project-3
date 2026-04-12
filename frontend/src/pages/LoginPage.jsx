import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API_BASE_URL from "../config/apiBaseUrl";

const PIN_LENGTH = 4;

const normalizeRole = (raw) => {
  if (!raw) return null;
  const r = String(raw).toLowerCase();
  if (r === "cashier") return "cashier";
  if (r === "manager") return "manager";
  return null;
};

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const role = useMemo(
    () => normalizeRole(searchParams.get("role")),
    [searchParams]
  );

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayRole =
    role === "cashier"
      ? "Cashier"
      : role === "manager"
      ? "Manager"
      : "Unknown Role";

  const handleManagerGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google?role=manager`;
  };

  const handleNumberClick = (value) => {
    if (pin.length >= PIN_LENGTH) return;
    setPin((prev) => `${prev}${value}`);
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!role) {
      setError("Login role is missing.");
      return;
    }
    if (role === "manager") {
      setError("Manager login uses Google sign-in.");
      return;
    }
    if (pin.length !== PIN_LENGTH || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/pin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Role-specific redirect
      navigate(role === "cashier" ? "/cashier" : "/manager");
    } catch (err) {
      setError(err.message || "Unable to login");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;

      if (/^\d$/.test(key)) {
        handleNumberClick(key);
        return;
      }

      if (key === "Backspace") {
        handleBackspace();
        return;
      }

      if (key === "Escape") {
        handleClear();
        return;
      }

      if (key === "Enter") {
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, isSubmitting, role]);

  return (
    <div className="page login-page">
      <div className="pin-card">
        <h1 className="pin-title">Boba POS Login</h1>
        <p className="pin-subtitle">
          Enter {PIN_LENGTH}-digit PIN ({displayRole})
        </p>
        {!role ? (
          <p className="pin-error">
            Please return to the portal and choose Cashier or Manager.
          </p>
        ) : null}

        {role === "manager" ? (
          <>
            <p className="pin-subtitle">Manager access uses Google sign-in.</p>
            <button type="button" className="submit-btn" onClick={handleManagerGoogleLogin}>
              Sign in with Google
            </button>
          </>
        ) : (
          <>
            <div
              className="pin-dots"
              aria-label="PIN entry"
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                marginBottom: "18px",
              }}
            >
              {Array.from({ length: PIN_LENGTH }).map((_, index) => (
                <span
                  key={index}
                  className={`pin-dot ${index < pin.length ? "filled" : ""}`}
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    borderRadius: "9999px",
                    border: "1px solid #9ca3af",
                    background: index < pin.length ? "#111827" : "transparent",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>

            <div className="pin-pad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <button
                  key={number}
                  type="button"
                  className="pin-btn"
                  onClick={() => handleNumberClick(number)}
                >
                  {number}
                </button>
              ))}
              <button type="button" className="pin-btn alt" onClick={handleClear}>
                Clear
              </button>
              <button
                type="button"
                className="pin-btn"
                onClick={() => handleNumberClick(0)}
              >
                0
              </button>
              <button
                type="button"
                className="pin-btn alt"
                onClick={handleBackspace}
              >
                Del
              </button>
            </div>

            <button
              type="button"
              className="submit-btn"
              onClick={handleSubmit}
              disabled={pin.length !== PIN_LENGTH || isSubmitting}
            >
              {isSubmitting ? "Checking..." : "Continue"}
            </button>
          </>
        )}

        {error ? <p className="pin-error">{error}</p> : null}
      </div>
    </div>
  );
};

export default LoginPage;

