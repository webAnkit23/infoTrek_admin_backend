
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header, such as server-to-server calls.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Keep your existing routes.
app.use("/api/admin", require("./routes/registrationRoutes"));

// If your admin frontend loads events, ensure this route exists too.
// app.use("/api/events", require("./routes/eventRoutes"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "InfoTrek Admin Backend Running",
  });
});

// Keep your existing MongoDB connection and startup code below.
