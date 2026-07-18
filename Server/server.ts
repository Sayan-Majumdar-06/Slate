import express, { Request, Response } from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

app.use(
    cors({
        origin: "http://localhost:5173",
    })
);

app.get("/", (req: Request, res: Response) => {
    res.send("Server is running");
});

app.post("/rooms", (req, res) => {
    const roomID = uuidv4();

    res.json({roomID});
})

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

interface TimerState {
    endTime: number | null;        
    remainingTime: number | null;  
    isPaused: boolean;
    duration: number;             
}

interface RoomState {
    problem: string;
    code: string;
    notes: string;
    whiteboard: {
        elements: []
    };
    timer: TimerState;
}

const rooms = new Map<string, RoomState>();

async function getOnlineUserIds(io: Server, roomId: string) {
  const sockets = await io.in(roomId).fetchSockets();
  const users = sockets.map(s => s.data.username).filter(Boolean);

  io.to(roomId).emit("user_list_updated", users);
}

const getRoom = (roomId: string) => {
    const room = rooms.get(roomId);

    if(!room) {
        return;
    }

    return room;
}

io.on("connection", async (socket) => {
    const { roomId, username } = socket.handshake.auth; 

    if (!roomId || !username) {
        return socket.disconnect();
    }

    socket.data.username = username;
    socket.data.roomId = roomId;    

    socket.on("join-room", async (roomId: string) => {
        socket.join(roomId);

        // console.log(`${socket.id} joined ${roomId}`);

        if(!rooms.has(roomId)) {
            rooms.set(roomId, {
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
        }

        const room = getRoom(roomId);

        socket.emit("room-state", room);
        await getOnlineUserIds(io, roomId);
    });

    socket.on('code-changed', ({roomId, code}) => {
        const room = getRoom(roomId);
        if(!room) {
            return;
        }

        room.code = code;

        socket.to(roomId).emit('code-changed', code);
    });

    socket.on('problem-updated', ({roomId, problem}) => {
        const room = getRoom(roomId);

        if(!room) {
            return;
        }

        room.problem = problem;

        socket.to(roomId).emit('problem-updated', problem);
    });

    socket.on('notes-updated', ({roomId, notes}) => {
        const room = getRoom(roomId);

        if(!room) {
            return;
        }

        room.notes = notes;

        socket.to(roomId).emit('notes-updated', notes);
    });

    socket.on("whiteboard-updated", ({roomId, elements}) => {
        console.log("whiteboard update for", roomId);
        const room = getRoom(roomId);

        if(!room) {
            return;
        }

        room.whiteboard = {
            elements: elements
        };

        socket.to(roomId).emit("whiteboard-updated", room.whiteboard);
    });

    socket.on("start-timer", ({ roomId, duration }) => {
        const room = rooms.get(roomId);
        if(!room) return;

        if (!room.timer) {
            room.timer = { endTime: null, remainingTime: null, isPaused: false, duration: 0 };
        }

        const timer = room.timer;

        if (timer.isPaused && timer.remainingTime !== null) {
            timer.endTime = Date.now() + timer.remainingTime;
        } else {
            timer.duration = duration;
            timer.endTime = Date.now() + duration * 1000;
        }
        
        timer.remainingTime = null;
        timer.isPaused = false;

        io.to(roomId).emit("timer-updated", timer);
    });

    socket.on("pause-timer", ({ roomId }: { roomId: string }) => {
        const room = rooms.get(roomId);
        if (!room) return;

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

    socket.on("stop-timer", ({ roomId }: { roomId: string }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        room.timer = { endTime: null, remainingTime: null, isPaused: false, duration: 0 };

        io.to(roomId).emit("timer-updated", room.timer);
    });

    socket.on("add-time-timer", ({ roomId, extraTime }: { roomId: string; extraTime: number }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        if (!room.timer) {
            room.timer = { endTime: null, remainingTime: null, isPaused: false, duration: 0 };
        }

        const timer = room.timer;

        const extraMs = extraTime * 1000;

        if (timer.isPaused && timer.remainingTime !== null) {
            timer.remainingTime += extraMs;
        } else if (timer.endTime !== null) {
            timer.endTime += extraMs;
        } else {
            timer.duration = extraTime;
            timer.endTime = Date.now() + extraMs;
            timer.isPaused = false;
        }

        io.to(roomId).emit("timer-updated", timer);
    });

    socket.on("end-room", ({roomId}) => {
        console.log("Received end-room:", roomId);
        io.to(roomId).emit("end-room");

        rooms.delete(roomId);
    });

    socket.on("disconnect", async () => {
        // console.log(`${socket.id} disconnected`);
        const targetRoom = socket.data.roomId;

        if(!targetRoom) return;

        if(!rooms.has(targetRoom)) return;
        
        if(targetRoom) {
            await getOnlineUserIds(io, targetRoom);
        }
    });
});


server.listen(PORT);
