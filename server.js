//server.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'VUCoWL9sZTYm4Zr65uUf6l0J6E53QagC';

//Enable CORS for frontend (e.g., Live Server pm port 5500)

app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500']
}));

app.use(express.json());//middleware to parse JSON

// in memory database
let user = [
    { id: 1, username: 'admin', password: '$2a$10$...', role: 'admin' },
    { id: 2, username: 'alice', password: '$2a$10$...', role: 'user'}
];

if (!user[0].password.includes($2a$)) {
    user[0].password = bcrypt.hashSync('admin123', 10);
    user[1].password = bcrypt.hashSync('user123', 10);
}

//AUTH ROUTES

//POST /api/register
app.post('/api/register', async (req, res) => {
    const {username, password, role = 'user' } = req.body;

    if (!username || !password) {
        return res.status(400).json({error: 'Username and password required'});
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: user.length + 1,
        username,
        password: hashedPassword,
        role 
    };

    user.push(newUser);
    res.status(201).json({ message: 'User registered', username, role});
});

//POST /api/login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const user = user.find(u => u.username === username);
    if(!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ error: 'Invalid Credentials' });
    }

    //Generate JWT token
    const token = jwt.sign(
        { id: user.id, username: user.username, role: role.role },
        SECRET_KEY,
        { expiresIn: '1m'}
    );

    res.json({ token, user: {username: user.username, role: user.role} });
});

// Undocumented
// PROTECTED ROUTE: Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// ROLE-BASED PROTECTED ROUTE; Admin-only
app.get('/api/admin/dashboar', authenticateToken, autorizeRole('admin'), (req, res) => {
    res.json({ message: 'Welcome to admin dashboard', data: 'Secret admin info'
     });
});

// PUBLIC ROUTE: Guest content
app.get('/api/content/guest', (req, res) => {
    res.json({ message: 'Public content for all visitors' });
});

// Middleware

// Token Authentication
function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; //Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {

    })
}