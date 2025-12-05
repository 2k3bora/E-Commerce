import React, { useContext, useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { TextField, Button, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post('/api/auth/google', {
        token: credentialResponse.credential,
      });
      console.log('Login Success:', res.data);
      // Save token and user to auth context and redirect
      if (res.data && res.data.token) {
        login(res.data);
        if (res.data.user?.mustChangePassword) {
          navigate('/change-password');
          return;
        }

        // Role-based redirection
        const role = res.data.user.role;
        if (role === 'admin') navigate('/admin/settings');
        else if (role === 'distributor') navigate('/distributor');
        else if (role === 'branch') navigate('/branch');
        else if (role === 'customer') {
          navigate('/catalog');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Login Failed:', error);
    }
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await axios.post('/api/auth/register', { email, password, name: email.split('@')[0] });
        alert('Registered. Please login with your credentials.');
        setIsRegister(false);
      } else {
        const res = await axios.post('/api/auth/login', { email, password });
        if (res.data && res.data.token) {
          login(res.data);
          if (res.data.user?.mustChangePassword) {
            navigate('/change-password');
            return;
          }

          const role = res.data.user.role;
          if (role === 'admin') navigate('/admin/settings');
          else if (role === 'distributor') navigate('/distributor');
          else if (role === 'branch') navigate('/branch');
          else if (role === 'customer') navigate('/catalog');
          else navigate('/');
        }
      }
    } catch (err) {
      console.error('Email auth error', err);
      alert(err.response?.data?.message || 'Auth failed');
    }
  };

  const handleLoginError = () => {
    console.log('Login Failed');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>
        <h2>Login with Google</h2>
        <Box component="form" onSubmit={handleEmailLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 320 }}>
          <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <TextField label="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" required />
          <Button type="submit" variant="contained">{isRegister ? 'Register' : 'Login'}</Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button variant="text" size="small" onClick={() => setIsRegister(!isRegister)}>{isRegister ? 'Login instead' : "Register"}</Button>
            {!isRegister && <Button variant="text" size="small" onClick={() => navigate('/forgot-password')}>Forgot Password?</Button>}
          </Box>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>Or login with Google</Typography>
          <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginError} />
          </GoogleOAuthProvider>
        </Box>
      </div>
    </div>
  );
};

export default LoginPage;
