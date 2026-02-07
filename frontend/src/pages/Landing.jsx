import { useState, useEffect } from "react";
import "./Landing.css";
import {Link, useNavigate} from "react-router-dom";

export const Landing = () => {
  const [heading, setHeading] = useState("");
  const [guestMeetCode, setGuestMeetCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if(sessionStorage.getItem("token")){
      navigate("/home");
    }
  }, []);

  const randText = () => {
    const text = [
                  "with Your Loved Ones...",
                  "with Your Team",
                  "without Limits",
                  "Beyond Boundaries",
                  "Anytime, Anywhere",
                  "Without Limits",
                  "Seamlessly Across Devices",
                  "in Real Time",
                  "with Clarity",
                  "Face to Face",
                  "and Collaborate",
                  "and Communicate Smarter",
                  "and Share Moments",
                  "Across the Globe",
                  "Across Distances",
                  "Without Barriers",
                  "with Confidence",
                  "Instantly",
                  "the Way You Want",
                  "and Experience Together",
                  "Made Simple"
            ];
  const genRandWord = Math.floor(Math.random() * 21);
  return text[genRandWord];
  }

  useEffect(() => {
    setHeading(randText());
    const interval = setInterval(() => {
      setHeading(randText());
    }, 5500);

    return () => clearInterval(interval);
  }, []);

  const JoinAsGuest = () => {
    try{
      if(sessionStorage.getItem("token")){
        sessionStorage.removeItem("token");
      } else{
        sessionStorage.setItem("token", guestMeetCode);
        navigate(`/meet/${guestMeetCode}`);
      }
    }catch(err){
      console.log(err);
    }
  }

  useEffect(() => {
    if(guestMeetCode !== ""){
      JoinAsGuest();
    }
  }, [guestMeetCode]);

  const handleJoinAsGuest = () => {
    const token = Math.random().toString(36).substring(2);
    setGuestMeetCode(token);
  }

  return (
    <div className="landingPageContainer">
      <nav className="navbar">
        <div><h2>Confexio Video Meet</h2></div>
        <div className="navlist">
          <Link to="/" onClick={handleJoinAsGuest}>Join as Guest</Link>
          <Link to="/auth">Register</Link>
          <Link role="button" to={"/auth"}><button>Login</button></Link>
        </div>
      </nav>
      <main>
        <div className="outer-wrap">
          <div className="wrapper">
            <h1><span>Connect</span>&nbsp;</h1>
            <ul className="dynamicText">
              <li><h1 className="dynamicHeadingText">{heading}</h1></li>
            </ul>
          </div>
          <p>Cover a distance by confexio video meet</p>
          <button onClick={() => navigate("/auth")}>Get Started.</button>
        </div>
        <img src="mobile.png" alt="mobileImg" height="600" className="mobileImg"/>
      </main>
    </div>
  )
}