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

interface RoomState {
    problem: string;
    code: string;
    notes: string;
    whiteboard: {
        elements: []
    };
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
        throw new Error(`Room ${roomId} doesn't exist`);
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
                }
            });
        }

        const room = getRoom(roomId);

        socket.emit("room-state", room);
        await getOnlineUserIds(io, roomId);
    });

    socket.on('code-changed', ({roomId, code}) => {
        const room = getRoom(roomId);

        room.code = code;

        socket.to(roomId).emit('code-changed', code);
    });

    socket.on('problem-updated', ({roomId, problem}) => {
        const room = getRoom(roomId);

        room.problem = problem;

        socket.to(roomId).emit('problem-updated', problem);
    });

    socket.on('notes-updated', ({roomId, notes}) => {
        const room = getRoom(roomId);

        room.notes = notes;

        socket.to(roomId).emit('notes-updated', notes);
    });

    socket.on("whiteboard-updated", ({roomId, elements}) => {
        const room = getRoom(roomId);

        room.whiteboard = {
            elements: elements
        };

        socket.to(roomId).emit("whiteboard-updated", room.whiteboard);
    });

    socket.on("disconnect", async () => {
        // console.log(`${socket.id} disconnected`);
        const targetRoom = socket.data.roomId;
        
        if (targetRoom) {
            await getOnlineUserIds(io, targetRoom);
        }
    });
});


server.listen(PORT);
