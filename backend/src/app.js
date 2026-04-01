const express = require("express");
const cors = require("cors");

const dbTestRouter = require("./routes/db-test");
const employeesRouter = require("./routes/employees");
const inventoryRouter = require("./routes/inventory");
const productRouter = require("./routes/product");
const productModiferRouter = require("./routes/productmodifier");
<<<<<<< HEAD
const ordersRouter = require("./routes/orders");
=======
const authRouter = require("./routes/auth");
const reportsRouter = require("./routes/reports");
>>>>>>> a448ab0106d97a7f562ccde5175ec0a6cd09a69f

const app = express();

app.use(cors());
app.use(express.json());

app.use("/db-test", dbTestRouter);
app.use("/employees", employeesRouter);
app.use("/inventory", inventoryRouter);
app.use("/product", productRouter);
app.use("/productmodifier", productModiferRouter);
<<<<<<< HEAD
app.use("/orders", ordersRouter);
=======
app.use("/auth", authRouter);
app.use("/reports", reportsRouter);
>>>>>>> a448ab0106d97a7f562ccde5175ec0a6cd09a69f

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;