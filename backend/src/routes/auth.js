const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("../../server/db");

const router = express.Router();

const managerEmails = new Set(
  (process.env.MANAGER_EMAILS ||
    "nitheeshk@tamu.edu,longvo.work84@tamu.edu,abelasteway@tamu.edu,noahhiggins@tamu.edu,sanjitbhimanadham@tamu.edu")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

const isManagerEmail = (email) => {
  if (!email) return false;
  return managerEmails.has(String(email).trim().toLowerCase());
};

const toErrorMessage = (err) => {
  if (!err) return "Unknown error";
  if (Array.isArray(err.errors) && err.errors.length > 0) {
    return err.errors
      .map((nestedErr) => nestedErr?.message || String(nestedErr))
      .join("; ");
  }
  return err.message || String(err);
};

const normalizeRole = (raw) => {
  if (!raw) return null;
  const r = String(raw).toLowerCase();
  if (r === "cashier") return "Cashier";
  if (r === "manager") return "Manager";
  return null;
};

const clientUrl = process.env.CLIENT_URL || "https://team31-project3.vercel.app";

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query(
      "SELECT id, google_sub, email, name, picture_url FROM customer WHERE id = $1;",
      [id]
    );
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err);
  }
});

if (!passport._strategy("google")) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "https://api-team31-project3.vercel.app/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleSub = profile.id;
          const email = profile.emails?.[0]?.value || null;
          const name = profile.displayName || null;
          const pictureUrl = profile.photos?.[0]?.value || null;

          const existing = await pool.query(
            "SELECT id FROM customer WHERE google_sub = $1;",
            [googleSub]
          );

          if (existing.rowCount > 0) {
            const id = existing.rows[0].id;
            await pool.query(
              "UPDATE customer SET email = $1, name = $2, picture_url = $3 WHERE id = $4;",
              [email, name, pictureUrl, id]
            );

            return done(null, { id, google_sub: googleSub, email, name, picture_url: pictureUrl });
          }

          const inserted = await pool.query(
            "INSERT INTO customer (google_sub, email, name, picture_url) VALUES ($1, $2, $3, $4) RETURNING id;",
            [googleSub, email, name, pictureUrl]
          );

          return done(null, {
            id: inserted.rows[0].id,
            google_sub: googleSub,
            email,
            name,
            picture_url: pictureUrl,
          });
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

router.get("/google", (req, res, next) => {
  const role = String(req.query.role || "").toLowerCase();
  const state = role === "manager" ? "manager" : "customer";
  passport.authenticate("google", { scope: ["profile", "email"], state })(
    req,
    res,
    next
  );
});

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user) => {
    const role = String(req.query.state || "").toLowerCase();

    if (err || !user) {
      const failureTarget =
        role === "manager"
          ? `${clientUrl}/manager?auth=failed`
          : `${clientUrl}/customer?auth=failed`;
      return res.redirect(failureTarget);
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);

      if (role === "manager") {
        if (!isManagerEmail(user.email)) {
          return req.logout(() => {
            req.session?.destroy(() => {
              res.clearCookie("connect.sid");
              res.redirect(`${clientUrl}/manager?auth=denied`);
            });
          });
        }

        return res.redirect(`${clientUrl}/orders`);
      }

      return res.redirect(`${clientUrl}/customer?auth=success`);
    });
  })(req, res, next);
});

router.get("/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return res.json({ user: req.user });
});

router.get("/manager-status", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!isManagerEmail(req.user?.email)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  return res.json({ user: req.user, manager: true });
});

router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: toErrorMessage(err) });
    }

    req.session?.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });
});

router.post("/pin-login", async (req, res) => {
  try {
    const { pin, role } = req.body || {};

    if (!pin || typeof pin !== "string") {
      return res.status(400).json({ error: "PIN is required" });
    }

    const dbRole = normalizeRole(role);
    if (!dbRole) {
      return res.status(400).json({ error: "Role is required" });
    }

    if (dbRole === "Manager") {
      return res.status(403).json({ error: "Manager login requires Google OAuth" });
    }

    // Accept either:
    // - exact match (pin_hash = pin)
    // - hash-suffixed match (pin_hash = 'hash' + pin) to be robust to seed data.
    const query = `
      SELECT id, name, role, is_active
      FROM employee
      WHERE is_active = true
        AND role = $2
        AND (
          pin_hash = $1
          OR pin_hash = ('hash' || $1)
          OR pin_hash = ('Hash' || $1)
          OR pin_hash = ('HASH' || $1)
        )
      LIMIT 1
    `;

    const result = await pool.query(query, [pin, dbRole]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid PIN" });
    }

    return res.json({
      success: true,
      employee: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: toErrorMessage(err) });
  }
});

module.exports = router;

