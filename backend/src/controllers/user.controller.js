import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import {Meeting} from "../models/meeting.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import twilio from "twilio";

const register = async (req, res) => {
    try{
        const {name, username, password} = req.body;
        if(!name || !username || !password){
            return res.status(httpStatus.UNAUTHORIZED).json({message: "Input fields are empty!"});
        }
        const existingUser = await User.findOne({username});
        if(existingUser){
            return res.status(httpStatus.CONFLICT).json({message: "User already exists!"});
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const createUser = new User({
            name: name,
            username: username,
            password: hashedPassword
        });
        await createUser.save();
        res.status(httpStatus.CREATED).json({message: "User registered successful"});
    }catch(err){
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Caught an error while register! ${err}`});
    }
};

const login = async (req, res) => {
    try{
        const {username, password} = req.body;
        if(!username || !password){
            return res.status(httpStatus.UNAUTHORIZED).json({message: "Input fields are empty!"});
        }
        const user = await User.findOne({username});
        if(!user){
            return res.status(httpStatus.UNAUTHORIZED).json({message: "Incorrect user!"});
        }
        const comparePassword = await bcrypt.compare(password, user.password);
        if(!comparePassword){
            return res.status(httpStatus.UNAUTHORIZED).json({message: "Incorrect password!"});
        }
        const randomString = crypto.randomBytes(120).toString('hex');
        user.token = randomString;
        await user.save();
        res.status(httpStatus.OK).json({message: "User logged in successful", token: randomString});
    }catch(err){
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Caught an error while login! ${err}`});
    }
};

const getHistory = async (req, res) => {
    try{
        const {token} = req.query;
        if(!token){
            return res.json({message: "Token does'nt exists"});
        }
        const user = await User.findOne({token: token});
        if(!user){
            return res.json({message: "User token does'nt exists"});
        }
        const meetings = await Meeting.find({userId: user.username});
        if(meetings){
            res.status(httpStatus.OK).json({meetings: meetings});
        }
    }catch(err){
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Caught an error while getting history ${err}`});
    }
};

const addHistory = async (req, res) => {
    try{
        const {token, meetingCode} = req.body;
        if(!token && !meetingCode){
            return res.json({message: "Token or meetingCode is empty!"});
        }
        const user = await User.findOne({token: token});
        if(!user){
            return res.json({message: "User does'nt exists"});
        }
        const newMeeting = new Meeting({
            userId: user.username,
            meetingCode: meetingCode
        });
        await newMeeting.save();
        res.status(httpStatus.CREATED).json({message: "Meeting details is added successful!"});
    }catch(err){
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Caught an error while adding history ${err}`});
    }
}

const turnServer = async (req, res) => {
    try{
        const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
        const token = await client.tokens.create();
        if(token){
            res.status(httpStatus.OK).json(token.iceServers);
        }
    }catch(err){
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Caught an error while getting turn server ${err}`});
    }
}

export {register, login, getHistory, addHistory, turnServer};