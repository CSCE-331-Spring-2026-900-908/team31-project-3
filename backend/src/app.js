const express = require("express");
const cors = require("cors");

const dbTestRouter = require("./routes/db-test");
const employeesRouter = require("./routes/employees");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/db-test", dbTestRouter);
app.use("/employees", employeesRouter);

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;