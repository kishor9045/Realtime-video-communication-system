import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import { Landing } from "./pages/Landing.jsx";
import {Authentication} from "./pages/Authentication.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { VideoMeeting } from "./pages/VideoMeeting.jsx";
import { PageNotFound } from "./pages/PageNotFound.jsx";
import { Home } from "./pages/Home.jsx";
import { History } from "./pages/History.jsx";

function App() {

  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route exact path="/" element={<Landing/>} />
            <Route path="/home" element={<Home/>} />
            <Route path="/auth" element={<Authentication/>} />
            <Route path="/history" element={<History/>} />
            <Route path="/meet/:roomId" element={<VideoMeeting/>} />
            <Route path="*" element={<PageNotFound/>}/>
          </Routes>
        </AuthProvider>
      </Router>
    </>
  )
}

export default App