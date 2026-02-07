import {register, login, getHistory, addHistory, turnServer} from "../controllers/user.controller.js";
import {Router} from "express";
const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/addToActivity").post(addHistory);
router.route("/getAllActivity").get(getHistory);
router.route("/turnServer").get(turnServer);

export default router;