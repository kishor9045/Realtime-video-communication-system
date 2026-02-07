import "./Home.css";
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import Button from '@mui/material/Button';
import { useState, useEffect } from "react";
import {useNavigate} from "react-router-dom";
import {useContext} from "react";
import {AuthContext} from "../contexts/AuthContext.jsx";

export const Home = () => {

  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const {addUserHistory} = useContext(AuthContext);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if(!token){
      navigate("/auth");
    }
  }, []);

  const handleMeetingCode = async () => {
    const addHistory = await addUserHistory(meetingCode);
    console.log(addHistory);
    navigate(`/meet/${meetingCode}`);
  }

  const handleKeyPress = (e) => {
    if(e.key === "Enter"){
      handleMeetingCode();
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    navigate("/");
  }
  
    return (
        <>
          <div className="homeOuterContainer">
            <div className="homeNavbar">
                <div>
                    <h2>Confexio Video meet</h2>
                </div>
                <div>
                    <Button startIcon={<HistoryIcon/>} variant="outlined" className="historyBtn" onClick={() => navigate("/history")}> History</Button>
                    <Button variant="outlined" endIcon={<LogoutIcon/>} color="error" className="logoutBtn" onClick={handleLogout}>Logout</Button>
                </div>
            </div>
            <div className="HomeMeetContiainer">
                <div className="HomeLeftPanel">
                    <h1>Provide Quality Video call & meetings</h1>
                       <div className="joinBox">
                         <input type="text" placeholder="Type meeting code" name="meetingId" onChange={e => setMeetingCode(e.target.value)} value={meetingCode} onKeyDown={handleKeyPress} autoComplete="off"/>
                         <button className="joinBtn" onClick={handleMeetingCode}>Join</button>
                       </div>
                </div>
                <div className="HomeRightPanel">
                    <img src="HomeVideoImg.png" alt="HomeVideoImg" height={400}/>
                </div>
            </div>
          </div>
        </>
    )
}