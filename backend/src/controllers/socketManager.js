import {Server} from "socket.io";

const connections = {};
const timeOnline = {};
let messages = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ['GET', 'POST', 'PUT'],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("user connected", socket.id);

        socket.on("join-room", (roomId, userId, path) => {
            if(connections[path] === undefined){
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();
            
            socket.join(roomId);
            socket.broadcast.to(roomId).emit("user-connected", userId);

            if(messages[path] !== undefined){
                for(let a = 0; a < messages[path].length; ++a){
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'], messages[path][a]['sender'], messages[path][a]['socket-id-sender']);
                }
            }

            socket.on("disconnect", () => {
                socket.to(roomId).emit("user-disconnected", userId);
                messages = {};
            })
        });

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections).reduce(([room, isFound], [roomKey, roomValue]) => {
                if(!isFound && roomValue.includes(socket.id)){
                    return [roomKey, true];
                }
                return [room, isFound];
            }, ['', false]);
            if(found === true){
                if(messages[matchingRoom] === undefined){
                    messages[matchingRoom] = [];
                }
                messages[matchingRoom].push({"sender": sender, "data": data, "socket-id-sender": socket.id});
                connections[matchingRoom].forEach((el) => {
                    io.to(el).emit("chat-message", data, sender, socket.id);
                })
            }
        });

        socket.on("disconnect", () => {
            let diffTime = Math.abs(timeOnline[socket.id] - new Date());
            let key;
            for(const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))){
                for(let a = 0; a < v.length; ++a){
                    if(v[a] === socket.id){
                        key = k;
                        // notify other users that this user has left
                        for(let a = 0; a < connections[key].length; ++a){
                            io.to(connections[key][a]).emit('user-left', socket.id);
                        }
                        // ṛemove user from room
                        let index = connections[key].indexOf(socket.id)
                        connections[key].splice(index, 1);
                        // if room is empty delete it
                        if(connections[key].length === 0){
                            delete connections[key];
                        }
                    }
                }
            }
        });
    })
    return io;
};