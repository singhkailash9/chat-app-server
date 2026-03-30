const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const messageRoutes = require("./routes/messages");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5000",
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: "http://localhost:5000"}));
// app.use(cors({ origin: '*' }));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use('/api/messages', messageRoutes);

app.get("/", (req, res) => res.send("Chat server is running"));

io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if(!token){
        return next(new Error("No token provided"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.userId = decoded.id;
        socket.data.username = decoded.username;
        next();
    } catch (error) {
        return next(new Error("Invalid token"));
    }
});

io.on("connection", (socket)=> {
    console.log(`User connected: ${socket.id}`);

    socket.on("joinRoom", ({room})=>{
        socket.join(room);
        socket.data.room = room;
        
        const username = socket.data.username;
        console.log(`${username} joined the room: ${room}`);

        socket.to(room).emit("userJoined", {message: `${username} joined the chat`});
    });

    socket.on("sendMessage", async({text, room})=>{
        const Message = require("./models/Message");
        const username = socket.data.username;
        const userId = socket.data.userId;
        const saved = await Message.create({
            sender: userId,
            senderName: username,
            room,
            text
        });
        io.to(room).emit("receiveMessage", {
            _id: saved._id,
            senderName: username,
            text,
            room,
            createdAt: saved.createdAt
        });
    });
    socket.on("disconnect", ()=>{
        const {username, room} = socket.data;
        if(username && room) {
            socket.to(room).emit("userLeft", {message: `${username} left the chat`});
        }
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));