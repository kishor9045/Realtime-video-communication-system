import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Snackbar } from '@mui/material';
import { SnackbarContent } from '@mui/material';
import { useState, useContext } from 'react';
import {useNavigate} from "react-router-dom";
import { AuthContext } from '../contexts/AuthContext';
import { useEffect } from 'react';

const defaultTheme = createTheme();

export function Authentication() {

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState();
  const [error, setError] = useState("");
  const [formState, setFormState] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const {handleRegister, handleLogin} = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if(sessionStorage.getItem("token")){
      navigate("/home");
    }
  }, []);

  const handleAuth = async () => {
    try{
      if(formState === 0){
        const login = await handleLogin(username, password);
        setMessage(login);
        setOpen(true);
        setUsername("");
        setPassword("");
        setError("");
        setTimeout(() => {
          navigate("/home");
        }, 900)
      }
      if(formState === 1){
        const register = await handleRegister(name, username, password);
        console.log(register);
        setMessage(register);
        setOpen(true);
        setFormState(0);
        setUsername("");
        setPassword("");
        setError("");
      }
    }catch(err){
      setError(err.response.data.message);
    }
  }

  const handleLoginKeyPress = (e) => {
    if(e.key === "Enter"){
      handleAuth()
    }
  }

  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid container>
        <CssBaseline />
        <Grid display={'flex'} flex={1}>
          <Box sx={{ my: 8, mx: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1'}}>
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <div style={{margin: "20px"}}>
              <Button variant={formState === 0 ? "contained": "text"} onClick={() => setFormState(0)} style={{marginRight:"10px"}}>Sign In</Button>
              <Button variant={formState === 1 ? "contained": "text"} onClick={() => setFormState(1)} style={{marginLeft:"10px"}}>Sign Up</Button>
            </div>
            <Box component="form" noValidate sx={{ mt: 1 }}>
              {formState === 1 ? <TextField margin="normal" required fullWidth label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off"/> : <></>}
              <TextField margin="normal" required fullWidth label="Username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off"/>
              <TextField margin="normal" required fullWidth name="password" label="Password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleLoginKeyPress}/>
              <p style={{ color: "red" }}>{error}</p>
              <FormControlLabel control={<Checkbox onClick={() => setShowPassword(!showPassword)} />} label="Show password"/>
              <Button type="button" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} onClick={handleAuth}>
                {formState === 0 ? "Login": "Register"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
      <Snackbar open={open} autoHideDuration={700} onClose={() => setOpen(false)}>
        <SnackbarContent message={message} />
      </Snackbar>
    </ThemeProvider>
    );
}