require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const app = express();
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

const db = require('./db');
app.get('/api/health', (req, res) => {
  res.json({
    message: 'BuildTrack backend is running'
  });
});



const PORT = 5000;

const server = app.listen(PORT, () => {
  console.log(`BuildTrack backend running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('SERVER ERROR:', error);
});

process.on('exit', (code) => {
  console.log('Node process exited with code:', code);
});