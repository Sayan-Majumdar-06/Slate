"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
}));
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Server is running");
});
app.post("/rooms", (req, res) => {
    const roomID = (0, uuid_1.v4)();
    rooms.set(roomID, {
        interviewerId: null,
        hostToken: req.body.hostToken,
        problem: "",
        code: "",
        notes: "",
        whiteboard: {
            elements: [],
        },
        timer: {
            endTime: null,
            remainingTime: null,
            isPaused: false,
            duration: 0,
        },
    });
    res.json({ roomID });
});
app.post("/run-code", async (req, res) => {
    try {
        const response = await axios_1.default.request({
            method: "POST",
            headers: {
                "Content-type": "application/json",
                "x-api-key": process.env.API_KEY,
            },
            url: 'https://api.onecompiler.com/v1/run',
            data: req.body
        });
        res.json(response.data);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
    },
});
const rooms = new Map();
const deletionTimers = new Map();
async function getOnlineUserIds(io, roomId) {
    const sockets = await io.in(roomId).fetchSockets();
    const users = sockets.map(s => ({ username: s.data.username, id: s.id })).filter(Boolean);
    io.to(roomId).emit("user_list_updated", users);
}
const getRoom = (roomId) => {
    const room = rooms.get(roomId);
    if (!room) {
        return;
    }
    return room;
};
app.get("/room/:roomid", (req, res) => {
    const { roomid } = req.params;
    res.json({
        exists: rooms.has(roomid)
    });
});
io.on("connection", async (socket) => {
    const { roomId, username } = socket.handshake.auth;
    if (!roomId || !username) {
        return socket.disconnect();
    }
    socket.data.username = username;
    socket.data.roomId = roomId;
    socket.on("join-room", async (roomId) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit("invalid-room");
            return;
        }
        socket.join(roomId);
        if (!room.interviewerId || room.hostToken === socket.handshake.auth.hostToken) {
            room.interviewerId = socket.id;
            const timer = deletionTimers.get(roomId);
            if (timer) {
                clearTimeout(timer);
                deletionTimers.delete(roomId);
            }
        }
        socket.emit("room-state", room);
        await getOnlineUserIds(io, roomId);
    });
    const isInterviewer = (roomId) => {
        const room = getRoom(roomId);
        return (room?.interviewerId === socket.id);
    };
    socket.on('code-changed', ({ roomId, code }) => {
        const room = getRoom(roomId);
        if (!room) {
            return;
        }
        room.code = code;
        socket.to(roomId).emit('code-changed', code);
    });
    socket.on('problem-updated', ({ roomId, problem }) => {
        const room = getRoom(roomId);
        if (!room) {
            return;
        }
        room.problem = problem;
        socket.to(roomId).emit('problem-updated', problem);
    });
    socket.on('notes-updated', ({ roomId, notes }) => {
        const room = getRoom(roomId);
        if (!room) {
            return;
        }
        room.notes = notes;
        socket.to(roomId).emit('notes-updated', notes);
    });
    socket.on("whiteboard-updated", ({ roomId, elements }) => {
        const room = getRoom(roomId);
        if (!room) {
            return;
        }
        room.whiteboard = {
            elements: elements
        };
        socket.to(roomId).emit("whiteboard-updated", room.whiteboard);
    });
    socket.on("start-timer", ({ roomId, duration }) => {
        const room = rooms.get(roomId);
        if (!room)
            return;
        if (!room.timer) {
            room.timer = { endTime: null, remainingTime: null, isPaused: false, duration: 0 };
        }
        const timer = room.timer;
        if (timer.isPaused && timer.remainingTime !== null) {
            timer.endTime = Date.now() + timer.remainingTime;
        }
        else {
            timer.duration = duration;
            timer.endTime = Date.now() + duration * 1000;
        }
        timer.remainingTime = null;
        timer.isPaused = false;
        io.to(roomId).emit("timer-updated", timer);
    });
    socket.on("pause-timer", ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room)
            return;
        if (!room.timer) {
            return;
        }
        const timer = room.timer;
        if (timer.endTime && !timer.isPaused) {
            timer.remainingTime = Math.max(0, timer.endTime - Date.now());
            timer.endTime = null;
            timer.isPaused = true;
            io.to(roomId).emit("timer-updated", timer);
        }
    });
    socket.on("stop-timer", ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room)
            return;
        room.timer = { endTime: null, remainingTime: null, isPaused: false, duration: 0 };
        io.to(roomId).emit("timer-updated", room.timer);
    });
    socket.on("add-time-timer", ({ roomId, extraTime }) => {
        const room = rooms.get(roomId);
        if (!room)
            return;
        if (!room.timer) {
            room.timer = { endTime: null, remainingTime: null, isPaused: false, duration: 0 };
        }
        const timer = room.timer;
        const extraMs = extraTime * 1000;
        if (timer.isPaused && timer.remainingTime !== null) {
            timer.remainingTime += extraMs;
        }
        else if (timer.endTime !== null) {
            timer.endTime += extraMs;
        }
        else {
            timer.duration = extraTime;
            timer.endTime = Date.now() + extraMs;
            timer.isPaused = false;
        }
        io.to(roomId).emit("timer-updated", timer);
    });
    function closeRoom(roomId) {
        io.to(roomId).emit("room-closed");
        io.in(roomId).socketsLeave(roomId);
        rooms.delete(roomId);
    }
    socket.on("end-room", ({ roomId }) => {
        if (!isInterviewer(roomId))
            return;
        closeRoom(roomId);
    });
    socket.on("disconnect", async () => {
        const targetRoom = socket.data.roomId;
        if (!targetRoom)
            return;
        if (!rooms.has(targetRoom))
            return;
        if (targetRoom) {
            if (isInterviewer(targetRoom)) {
                const timer = setTimeout(() => {
                    closeRoom(targetRoom);
                    deletionTimers.delete(targetRoom);
                }, 5000);
                deletionTimers.set(targetRoom, timer);
                return;
            }
            await getOnlineUserIds(io, targetRoom);
        }
    });
});
server.listen(PORT);
