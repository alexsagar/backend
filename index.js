import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import apiRoutes from "./routes/api.js";
import mongoose from "mongoose";

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api", apiRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port :${PORT}`);
});
