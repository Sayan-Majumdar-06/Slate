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

async function getOnlineUserIds(io: Server, roomId: string) {
  const sockets = await io.in(roomId).fetchSockets();
  const users = sockets.map(s => s.data.username).filter(Boolean);

  io.to(roomId).emit("user_list_updated", users);
}

io.on("connection", async (socket) => {
    const { id, username } = socket.handshake.auth; 

    if (!id || !username) {
        return socket.disconnect();
    }

    socket.data.username = username;
    socket.data.id = id;    

    socket.on("join-room", async (roomId: string) => {
        socket.join(roomId);

        console.log(`${socket.id} joined ${roomId}`);

        socket.to(roomId).emit("user-joined", socket.id);

        await getOnlineUserIds(io, roomId);
    });

    socket.on('code-changed', ({roomId, code}) => {
        socket.to(roomId).emit('code-changed', code);
    });

    socket.on('problem-updated', ({roomId, problem}) => {
        socket.to(roomId).emit('problem-updated', problem);
    });

    socket.on("disconnect", async () => {
        console.log(`${socket.id} disconnected`);
        const targetRoom = socket.data.id;
        
        if (targetRoom) {
            await getOnlineUserIds(io, targetRoom);
        }
    });
});


server.listen(PORT);
