import { createContext, useState } from "react";
import axios from "axios";
import httpStatus from "http-status";

export const AuthContext = createContext();

const axiosBaseURL = axios.create({
    baseURL: "http://localhost:4000/api/v1/users"
})

const AuthProvider = ({children}) => {

    const [userData, setUserData] = useState("");

    const handleRegister = async (name, username, password) => {
        try{
            const register = await axiosBaseURL.post("/register", {
                name: name,
                username: username,
                password: password
            }, {withCredentials: true});
            if(register.status === httpStatus.CREATED){
                return register.data.message
            }
        } catch(err){
            throw err;
        }
    };

    const handleLogin = async (username, password) => {
        try{
            const login = await axiosBaseURL.post("/login", {
                username,
                password
            }, {withCredentials: true});
            if(login.status === httpStatus.OK){
                sessionStorage.setItem("token", login.data.token)
                return login.data.message
            }
        } catch(err){
            console.log(err);
            throw err;
        }
    }

    const getUserHistory = async () => {
        try{
            const getHistory = await axiosBaseURL.get("getAllActivity", {
                params: {
                    token: sessionStorage.getItem("token")
                }
            })

            return getHistory.data;
        }catch(err){
            throw err;
        }
    };

    const addUserHistory = async (meetingCode) => {
        try{
            const addHistory = await axiosBaseURL.post("addToActivity", {
                token: sessionStorage.getItem("token"),
                meetingCode: meetingCode
            });
            return addHistory.data;
        }catch(err){
            throw err;
        }
    }

    const handleIceServers = async () => {
        try{
            const iceServers = await axiosBaseURL.get("turnServer");
            return iceServers.data;
        }catch(err){
            throw err;
        }
    }

    const sendData = {userData, setUserData, handleRegister, handleLogin, getUserHistory, addUserHistory, handleIceServers};

    return(
        <AuthContext.Provider value={sendData}>
            {children}
        </AuthContext.Provider>
    )
};

export {axiosBaseURL, AuthProvider};