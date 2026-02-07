import { useContext, useState, useEffect } from "react";
import {useNavigate} from "react-router-dom";
import {AuthContext} from "../contexts/AuthContext.jsx";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

export const History = () => {
    const [meetings, setMeetings] = useState([]);
    const {getUserHistory} = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if(!token){
        navigate("/auth");
        }
    }, []);

    useEffect(() => {
        async function fetchUser(){
            try{
                const getHistory = await getUserHistory();
                getHistory.meetings.forEach((meeting) => {
                    setMeetings((prevMeeting) => [...prevMeeting, meeting]);
                })
            }catch(err){
                console.log(err);
            }
        }
        fetchUser();
    }, []);

    return (
        <>
          <div>
            <div style={{borderBottom: "1px solid #161616"}}>
                <IconButton onClick={() => navigate("/home")}>
                    <HomeIcon/>
                </IconButton>
            </div>
            {
                meetings.length > 0 ? meetings.map((meeting, idx) => {
                    return (
                        <Card key={idx} sx={{borderBottom: "1px solid #161616"}}>
                            <CardContent>
                                <Typography sx={{ mb:1 }}>{meeting.userId}</Typography>
                                <Typography sx={{ mb: 1.5 }}>Meeting code: {meeting.meetingCode}</Typography>
                                <Typography variant="body2" sx={{color: 'text.secondary'}}>{meeting.date}</Typography>
                            </CardContent>
                        </Card>
                    );
                }) : <p style={{textAlign: "center"}}>No meetings is recorded yet!</p>
            }
          </div>
        </>
    );
}