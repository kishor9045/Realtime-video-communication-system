import { useState, useRef, useEffect, useContext } from "react";
import {useNavigate, useParams} from "react-router-dom";
import "./VideoMeeting.css";
import IconButton from '@mui/material/IconButton';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import Badge from '@mui/material/Badge';
import SendIcon from '@mui/icons-material/Send';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import ScrollToBottom from "react-scroll-to-bottom";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import CloseIcon from '@mui/icons-material/Close';
import Snackbar from '@mui/material/Snackbar';
import { SnackbarContent } from '@mui/material';
import {io} from "socket.io-client";
import {Peer} from "peerjs";
import {AuthContext} from "../contexts/AuthContext.jsx";

export const VideoMeeting = () => {

    const navigate = useNavigate();
    
    let socketRef = useRef();
    let socketIdRef = useRef();
    let beforeVideoRef = useRef();
    let beforeLocalStreamRef = useRef();
    let localStreamRef = useRef();
    let peerRef = useRef();
    let videoRef = useRef();
    let allPeerRef = useRef({});
    const [videoAvailable, setVideoAvailable] = useState();
    const [audioAvailable, setAudioAvailable] = useState();
    const [screenAvailable, setScreenAvailable] = useState();
    const [video, setVideo] = useState();
    const [audio, setAudio] = useState();
    const [muteMic, setMuteMic] = useState(false);
    const [camera, setCamera] = useState(false);
    const [count, setCount] = useState(0);
    const [screenSharing, setScreenSharing] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [openMessageBox, setOpenMessageBox] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [newMessages, setNewMessages] = useState(0);
    const [currTime, setCurrTime] = useState(new Date());
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [allUsers, setAllUsers] = useState();
    const [info, setInfo] = useState(false);
    const [joinBoxOpen, setJoinBoxOpen] = useState(false);
    const [meetingCode, setMeetingCode] = useState("");
    const [snackOpen, setSnackOpen] = useState();

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if(!token){
          navigate("/auth");
        }
      }, []);

    const {roomId} = useParams();

    useEffect(() => {
        if(roomId){
            setMeetingCode(roomId);
        }
    }, []);

    const {handleIceServers} = useContext(AuthContext);

    const getPermissions = async () => {
        try{
            const videoPermission = await navigator.mediaDevices.getUserMedia({video: true});
            if(videoPermission){
                videoPermission.getTracks().forEach((track) => track.stop());
                setVideoAvailable(true);
            } else{
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({audio: true});
            if(audioPermission){
                audioPermission.getTracks().forEach((track) => track.stop());
                setAudioAvailable(true);
            } else{
                setAudioAvailable(false);
            }
            const screenShare = navigator.mediaDevices.getDisplayMedia;
            if(screenShare){
                setScreenAvailable(true);
            }else{
                setScreenAvailable(false);
            }
        }catch(err){
            setVideoAvailable(false);
            setAudioAvailable(false);
            console.log(err);
        }
    }

    useEffect(() => {
        getPermissions();
    }, []);

    useEffect(() => {
            if(videoAvailable || audioAvailable){
                navigator.mediaDevices.getUserMedia({video: videoAvailable, audio: audioAvailable}).then((userMediaStream) => {
                    if(userMediaStream){
                        beforeLocalStreamRef.current = userMediaStream;
                        if(beforeVideoRef.current !== undefined && beforeVideoRef.current !== null){
                            beforeVideoRef.current.srcObject = userMediaStream;
                        }
                    }
                }).catch((err) => {
                    console.log(err);
                });
            } else{
                let blackSilence = (...args) => new MediaStream([blackScreen(...args)]);
                beforeLocalStreamRef.current = blackSilence();
                beforeVideoRef.current.srcObject = beforeLocalStreamRef.current;
            }
    }, [videoAvailable, audioAvailable])

    
    // video meeting code
    const audioSilence = () => {
        let audioContext = new AudioContext();
        let oscillator = audioContext.createOscillator()
        let dst = oscillator.connect(audioContext.createMediaStreamDestination());
        oscillator.start();
        audioContext.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false});
    }

    const blackScreen = ({width = 640, height = 480} = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), {width, height});
        canvas.getContext('2d').fillRect(0, 0, width, height);
        const stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], {enabled: false});
    } 


    const addVideoStream = (video, stream) => {
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            video.play();
        };
        if(videoRef.current !== undefined && videoRef.current !== null){
            videoRef.current.appendChild(video);
            setCount(pervCount => pervCount + 1);
        }
    };

  const connectNewUser = (userId, stream) => {
    try{
        const call = peerRef.current.call(userId, stream);
        const video = document.createElement("video");
        call.on("stream", (remoteStream) => {
            addVideoStream(video, remoteStream);
        });

        call.on("error", (err) => {
            console.log("Call error: ", err);
        });

        call.on("close", () => {
          video.remove();
        })
        allPeerRef.current[userId] = call;
    }catch(err){
      console.log(err);
    }
  };

   const connectToSocketServer = async () => {
    try{
        if(socketRef.current) return;

        // socketRef.current = io("http://localhost:4000");
        socketRef.current = io("https://realtime-video-communication-system.onrender.com");

        const iceServers = await handleIceServers();

        peerRef.current = new Peer(undefined, {
            // host: "localhost",
            // path: "/peerjs",
            // port: '4000',
            // secure: false,
            host: "realtime-video-communication-system.onrender.com",
            path: "/peerjs",
            secure: true,
            config: {
                iceServers: iceServers,
                iceTransportPolicy: "all"
            }
        });
        
        if(socketRef.current.id){
            socketIdRef.current = socketRef.current.id;
        }
        socketRef.current.on("connect", () => {
            console.log(socketRef.current.id)
        })

        if((videoAvailable && video) || (audioAvailable && audio)){
          navigator.mediaDevices.getUserMedia({video: true, audio: true}).then((stream) => {
            localStreamRef.current = stream;
            const myVideo = document.createElement("video");
            addVideoStream(myVideo, stream);
    
            socketRef.current.on("user-connected", (userId) => {
                setTimeout(() => {
                  console.log("userId", userId);
                  connectNewUser(userId, stream);
              }, 1000);
            });

            socketRef.current.on("chat-message", (data, sender, senderSocketId) => {
                setMessages((pervMessage) => ([...pervMessage, {sender: sender, data: data, senderSocketId: senderSocketId}]));
                if(senderSocketId !== socketIdRef.current){
                    setNewMessages((prevMessages) => prevMessages + 1);
                }
            });
    
            peerRef.current.on("call", (call) => {
                call.answer(stream);
                const video = document.createElement("video");
                call.on("stream", (remoteStream) => {
                    addVideoStream(video, remoteStream);
                })
                
                call.on("close", () => {
                    video.remove();
                })
                const userId = call.peer;
                allPeerRef.current[userId] = call;
            });
          }).catch(err => console.log(err));
          
            peerRef.current.on("open", (id) => {
              console.log(id);
              socketRef.current.emit("join-room", roomId, id, window.location.href, username);
              window.peerId = id;
            });

            socketRef.current.on("allConnectedUsers", ({allUser}) => {
                setAllUsers(allUser);
            })

            socketRef.current.on("reconnect", () => {
                socketRef.current.emit("join-room", roomId, window.peerId);
            })

            peerRef.current.on("error", (err) => {
                console.log(err);
            })

          socketRef.current.on("user-disconnected", (userId) => {
            console.log("user disconnected", userId);
            if(allPeerRef.current[userId]){
                allPeerRef.current[userId].close();
                delete allPeerRef.current[userId];
                setCount(pervCount => pervCount - 2);
            }
            setMessages([]);
          });
        }
    }catch(err){
        console.log(err);
    }
  }

  useEffect(() => {
    if(video !== undefined && audio !== undefined){
        connectToSocketServer();
    }
  }, [video, audio]);

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
    }

    let connect = () => {
        try{
            beforeLocalStreamRef.current.getTracks().forEach((track) => track.stop());
        }catch(err){
            console.log(err);
        }
        setAskForUsername(false);
        getMedia();
    }

    const endCall = () => {
        try{
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => {
                    track.stop();
                    track.enabled = false;
                });
                localStreamRef.current = null;
            }
            Object.values(allPeerRef.current).forEach((callObj) => {
                callObj.close();
            });
            allPeerRef.current = {};
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
            if (videoRef.current) {
                videoRef.current.querySelectorAll("video").forEach((video) => {
                    video.srcObject = null;
                    video.pause();
                    video.load();
                });
                videoRef.current.innerHTML = "";
            }
            const miniLocalStream = document.querySelector(".miniLocalStream");
            const video = miniLocalStream.querySelector("video");
            if(video){
                video.srcObject = null;
                video.pause();
                video.load();
            }

            navigate("/home");
        }catch(err){
            console.log(err);
        }
    };

    const handleMuteMic = () => {
        setMuteMic(!muteMic);
        localStreamRef.current.getAudioTracks().forEach((track) => track.enabled = muteMic);
    };

    const handleVideo = () => {
        setCamera(!camera);
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if(!videoTrack) return;

        if(videoTrack){
            videoTrack.enabled = camera;
        }
    }

    function updateGridLayout() {
        try{
            if(count > 0){
                const videoGrid = document.querySelector(".videoGrid");
                const vidCount = videoGrid.querySelectorAll("video");
                if(count === 1){
                    const miniLocalStream = document.querySelector(".miniLocalStream");
                    const firstVid = videoGrid.querySelector("video");
                    if(miniLocalStream && firstVid){
                        miniLocalStream.appendChild(firstVid);
                    }
                }
            }
        }catch(err){
            console.log(err);
        }
    }

    useEffect(() => {
        updateGridLayout();
    }, [count]);

    const getDisplayMedia = () => {
        try{
            if(screenAvailable){
                if(screenSharing){
                    navigator.mediaDevices.getDisplayMedia({video: true, audio: true}).then((stream) => {
                        const screenTrack = stream.getVideoTracks()[0];
                        for(let peer in allPeerRef.current){
                            const sender = allPeerRef.current[peer].peerConnection.getSenders().find(s => s.track.kind === 'video');
                            sender.replaceTrack(screenTrack);
                        }
                        const oldVidTrack = localStreamRef.current.getVideoTracks()[0];
                        localStreamRef.current.removeTrack(oldVidTrack);
                        localStreamRef.current.addTrack(screenTrack);
                        const miniLocalStream = document.querySelector(".miniLocalStream");
                        miniLocalStream.querySelector("video").srcObject = localStreamRef.current;

                        screenTrack.onended = stopScreenShare;
                    }).catch((err) => {
                        setScreenSharing(false);
                        console.log(err);
                    });
                }
            }
        }catch(err){
            setScreenSharing(false);
            console.log(err);
        }
    }

    const stopScreenShare = () => {
        try{
            const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
            navigator.mediaDevices.getUserMedia({video: true}).then((videoStream) => {
                const videoTrack = videoStream.getVideoTracks()[0];
                for(let peer in allPeerRef.current){
                    const sender = allPeerRef.current[peer].peerConnection.getSenders().find(s => s.track.kind === 'video');
                    if(sender) sender.replaceTrack(videoTrack);
                    setScreenSharing(false);
                }
                localStreamRef.current.removeTrack(oldVideoTrack);
                localStreamRef.current.addTrack(videoTrack);
                const miniLocalStream = document.querySelector(".miniLocalStream");
                miniLocalStream.querySelector("video").srcObject = localStreamRef.current;
            }).catch((err) => console.log(err));
        }catch(err){
            console.log(err);
        }
    }

    useEffect(() => {
        if(screenSharing !== undefined){
            getDisplayMedia();
        }
    }, [screenSharing]);

    const handleMessageBoxOpen = () => {
        setOpenMessageBox(!openMessageBox);
        setNewMessages(0);
    }

    const sendMessage = () => {
        if(message !== "" && message !== " "){
            socketRef.current.emit("chat-message", message, username);
            setMessage("");
        }
    }
    
    const handleMsgKeyPress = (e) => {
        if(e.key === "Enter"){
            sendMessage();
        }
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrTime(new Date());
        }, 1000);

        return () => {
            clearInterval(timer);
        }
    }, []);

    const handleLinkCopy = () => {
        try{
            navigator.clipboard.writeText(window.location.href).then(() => {
                setSnackOpen(true);
            }).catch((err) => {
                console.log("caught an error", err);
            })
        }catch(err){
            console.log(err);
        }
    }

    const handleConnectKeyPress = (e) => {
        if(e.key === "Enter"){
            connect();
        }
    }

    useEffect(() => {
        const handleDropdownCloseOnOutsideClick = (event) => {
            const copyLink = document.querySelector(".copyLink");
            if(copyLink && !copyLink.contains(event.target)){
                setInfo(false);
                setJoinBoxOpen(false);
            }
        }
        document.addEventListener("mousedown", handleDropdownCloseOnOutsideClick);

        return () => document.removeEventListener("mousedown", handleDropdownCloseOnOutsideClick);
    }, []);

    return (
        <>
            {askForUsername === true ?
            <>
                <div className="beforeOuterContainer">
                    <h1>Video meetings for everyone</h1>
                    <div className="beforeContainer">
                        <div className="beforeVideoContainer">
                            <video ref={beforeVideoRef} style={{transform: "scaleX(-1)"}} className="beforeVideo" autoPlay muted playsInline></video>
                        </div>
                        <div className="beforeFormContainer">
                            <img src="/meetImg.png" alt="meetImg" height="40"/>
                            <h2>Ready to join?</h2>
                            <input placeholder="Type username.." value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" onKeyDown={handleConnectKeyPress}/>
                            <br /><br />
                            <button onClick={connect} className="btn">Connect</button>
                        </div>
                    </div>
                </div> 
            </> : <>
            <div className="meetVideoContainer">
                <div className="videoGridContainer">
                    <div className="vidMeetContainer">
                        <div className="miniLocalStream"></div>
                        <div className='videoGrid' ref={videoRef}></div>
                    </div>
                    <div className={`messageContainer ${darkMode === true ? "messageDarkContainer" : "messageLightContainer"}`} style={openMessageBox === true ? {display: "flex"} : {display: "none"}}>
                        <div className={`msgTopContainer`}>
                            <h2>In-call messages</h2>
                            <IconButton onClick={() => setDarkMode(!darkMode)} color="warning">
                                {darkMode === true? <LightModeIcon /> : <DarkModeIcon/>}
                            </IconButton>
                        </div>
                        <ScrollToBottom className={`msgMainContainer ${darkMode ? "msgDarkMainContainer" : ""}`}>
                            {
                                messages.length > 0 ? messages.map((item, index) => (
                                    <div key={index} className={`msgBox ${item.senderSocketId === socketIdRef.current ? "sender" : "receiver"}`}>
                                        <p>{item.sender}</p>
                                        <p>{item.data}</p>
                                    </div>
                                )) : <p style={{textAlign: "center"}}>No chat messages yet</p>
                            }
                        </ScrollToBottom>
                        <div className={`msgBottomContainer ${darkMode ? "msgDarkBottomContainer" : "msgLightBottomContainer"}`}>
                            <div>
                                <input type="text" placeholder="Send a message" onChange={e => setMessage(e.target.value)} value={message} onKeyDown={handleMsgKeyPress}/>
                                <IconButton color={darkMode === true ? "primary" : ""} onClick={sendMessage}>
                                    <SendIcon />
                                </IconButton>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bottomHorizontalContainer">
                    <div className="bottomLeftTimeContainer">
                        <p style={{color: "#fff"}}>{`${currTime.getHours()} : ${currTime.getMinutes()}`} | {meetingCode}</p>
                    </div>
                    <div className="btnsContainer">
                        <IconButton onClick={handleVideo}>
                            {camera === true ? <VideocamOffIcon sx={{fontSize: "45px"}} /> : <VideocamIcon sx={{fontSize: "45px"}} />}
                        </IconButton>
                        <IconButton onClick={handleMuteMic}>
                            {muteMic === true ? <MicOffIcon sx={{fontSize: "35px"}} /> : <MicIcon sx={{fontSize: "35px"}}/>}
                        </IconButton>
                        {
                        screenAvailable === true ? 
                            <IconButton onClick={() => setScreenSharing(!screenSharing)}>
                                {screenSharing === true ? <StopScreenShareIcon sx={{fontSize: "40px"}} /> : <ScreenShareIcon sx={{fontSize: "40px"}}/>}
                            </IconButton>: <></>
                        }
                        <Badge max={99} color="primary" overlap="circular" badgeContent={newMessages} anchorOrigin={{vertical: "top", horizontal: "right"}}>
                            <IconButton onClick={handleMessageBoxOpen}>
                                <ChatIcon sx={{fontSize: "38px"}} />
                            </IconButton>
                        </Badge>
                        <IconButton onClick={endCall} sx={{backgroundColor: "red"}} id="endcall">
                            <CallEndIcon sx={{color: "#fff"}}/>
                        </IconButton>
                    </div>
                    <div className="bottomRightInfoContainer">
                        <div className="copyLinkOuter">
                            <div className="copyLink" style={info ? {display: "block"} : {display: "none"}}>
                                <div>
                                    <h3>Your meeting's ready</h3>
                                    <IconButton onClick={() => setInfo(!info)}>
                                        <CloseIcon/>
                                    </IconButton>
                                </div>
                                <p>share this meeting link with others that you want to join.</p>
                                <div>
                                    <p>{window.location.href}</p>
                                    <IconButton onClick={handleLinkCopy}>
                                        <ContentCopyIcon/>
                                    </IconButton>
                                </div>
                            </div>
                        </div>
                        <div className="joinedUsersOuter">
                            <div className="joinedUsers" style={joinBoxOpen ? {display: "flex"} : {display: "none"}}>
                                <div>
                                    <h2>Joined users</h2>
                                    <IconButton onClick={() => setJoinBoxOpen(!joinBoxOpen)}>
                                        <CloseIcon />
                                    </IconButton>
                                </div>
                                <div className="allJoinedUsers">
                                    <ul>
                                        {
                                            allUsers ? allUsers.map((user, index) => (
                                                <li key={index}>{user.username} {user.peerId === peerRef.current.id ? "(You)": ""}</li>
                                            )) : <p style={{textAlign: "center"}}>No users has joined yet</p>
                                        }
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <p>
                           <IconButton onClick={() => setJoinBoxOpen(!joinBoxOpen)}>
                               <SupervisorAccountIcon sx={{color: "#fff"}}/>
                           </IconButton>
                           <IconButton onClick={() => setInfo(!info)} >
                               <InfoOutlineIcon sx={{color: "#fff"}}/>
                           </IconButton>
                        </p>
                    </div>
                </div>
                <Snackbar open={snackOpen} autoHideDuration={2000} onClose={() => setSnackOpen(false)}>
                    <SnackbarContent style={{backgroundColor: "#fff", color: "#000"}} message={"Link copied successful"} />
                </Snackbar>
            </div>
            </>}
        </>
    )
}