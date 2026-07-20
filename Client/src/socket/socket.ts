import { io } from "socket.io-client";
const SERVER_URL = import.meta.env.SERVER_URL;

export const socket = io(`${SERVER_URL}`, {
    autoConnect: false,
});