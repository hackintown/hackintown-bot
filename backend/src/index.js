require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const bot = require("./utils/telegram");
const apiRoutes = require("./routes/api");

const app = express();

connectDB();

app.use(express.json());

app.use("/api", apiRoutes);

app.post("/telegram", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
