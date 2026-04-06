const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");

const dbTestRouter = require("./routes/db-test");
const employeesRouter = require("./routes/employees");
const inventoryRouter = require("./routes/inventory");
const productRouter = require("./routes/product");
const productModiferRouter = require("./routes/productmodifier");
const ordersRouter = require("./routes/orders");
const authRouter = require("./routes/auth");
const reportsRouter = require("./routes/reports");
const gemniAiRouter = require("./routes/gemniAi");


const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://team31-project3.vercel.app",
]);

if (process.env.CLIENT_URL) {
  allowedOrigins.add(process.env.CLIENT_URL);
}

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .forEach((origin) => allowedOrigins.add(origin));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin/server-side requests without an Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/db-test", dbTestRouter);
app.use("/employees", employeesRouter);
app.use("/inventory", inventoryRouter);
app.use("/product", productRouter);
app.use("/productmodifier", productModiferRouter);
app.use("/orders", ordersRouter);
app.use("/auth", authRouter);
app.use("/reports", reportsRouter);
app.use("/gemniAi", gemniAiRouter);

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;