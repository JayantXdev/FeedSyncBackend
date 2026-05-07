const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const errorHandler = require("./src/middleware/errorHandler");

dotenv.config();

// Connect DB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Make io accessible in routes
app.set("io", io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", require("./src/routes/AuthRoutes.js"));
app.use("/api/food", require("./src/routes/FoodRoutes.js"));
app.use("/api/ngo", require("./src/routes/NGORoutes.js"));
app.use("/api/requests", require("./src/routes/RequestRoutes.js"));
app.use("/api/ratings", require("./src/routes/RatingRoutes.js"));
app.use("/api/notifications", require("./src/routes/NotificationRoutes.js"));
app.use("/api/admin", require("./src/routes/AdminRoutes.js"));

// Health check
app.get("/", (req, res) => res.json({ message: "🌿 FeedSync API is running!", version: "1.0.0" }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found." }));

// Global error handler
app.use(errorHandler);

// ─── Socket.io Real-time ─────────────────────────────────────────────────────
const connectedUsers = {}; // userId -> socketId

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Register user socket
  socket.on("register", (userId) => {
    connectedUsers[userId] = socket.id;
    console.log(`👤 User ${userId} registered to socket ${socket.id}`);
  });

  // Join a room (e.g., for food tracking)
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`📦 Socket ${socket.id} joined room: ${roomId}`);
  });

  // Send real-time notification to specific user
  socket.on("notify_user", ({ userId, notification }) => {
    const targetSocket = connectedUsers[userId];
    if (targetSocket) {
      io.to(targetSocket).emit("new_notification", notification);
    }
  });

  // Food status update broadcast
  socket.on("food_status_update", ({ foodId, status }) => {
    io.to(`food_${foodId}`).emit("status_changed", { foodId, status });
  });

  socket.on("disconnect", () => {
    // Remove from connected users
    for (const [userId, sId] of Object.entries(connectedUsers)) {
      if (sId === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Export io for use in controllers
module.exports.io = io;
module.exports.connectedUsers = connectedUsers;

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 FeedSync Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 http://localhost:${PORT}\n`);
});