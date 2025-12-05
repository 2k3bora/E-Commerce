const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing login with default credentials...');
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@abc.com',
            password: 'admin@123'
        });
        console.log('Login SUCCESS!');
        console.log('Token:', res.data.token ? 'Received' : 'Missing');
        console.log('User:', res.data.user);
    } catch (err) {
        console.error('Login FAILED');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
}

testLogin();
