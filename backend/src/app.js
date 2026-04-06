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

const app = express();

const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: clientOrigin,
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

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;