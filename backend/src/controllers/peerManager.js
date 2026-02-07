// import {PeerServer} from "peer";

// export const peerManager = () => {
//     const peerServer = PeerServer({
//         port: 9000,
//         path: "/peerjs"
//     })
//     return peerServer;
// }

import {ExpressPeerServer} from "peer";

export const peerManager = (app, server) => {
    const peerServer = ExpressPeerServer(server, {
        path: "/",
        debug: false
    });

    app.use("/peerjs", peerServer);

    peerServer.on("connection", (client) => {
        console.log("peer connected: ", client.getId());
    });

    peerServer.on("disconnect", (client) => {
        console.log("peer disconnected!: ", client.getId());
    });
}