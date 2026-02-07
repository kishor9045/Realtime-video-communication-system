import "dotenv/config";
import express from "express";
import {createServer} from "node:http";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import {peerManager} from "./controllers/peerManager.js";
import router from "./routes/user.routes.js";
import cors from "cors";

const app = express();
const server = createServer(app);


app.use(cors({
    origin: "http://localhost:5174",
    methods: ["GET", "POST", "PUT"],
    credentials: true
}));

app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({extended: true, limit: "40kb"}));

connectToSocket(server);
peerManager(app, server);

main().then(() => {
    console.log("connected to mongoDB successful!");
}).catch((err) => {
    console.log(err);
})

async function main() {
    await mongoose.connect(process.env.MONGODB_STRING);
}

app.get("/", (req, res) => {
    res.send("Hello world");
});

app.use("/api/v1/users", router);

app.set("port", process.env.PORT || 8080);
server.listen(app.get("port"), () => {
    console.log(`Listening to port http://localhost:${app.get("port")}`);
});