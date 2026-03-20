const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: "http://localhost:5173"}));
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => res.send("Chat server is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));