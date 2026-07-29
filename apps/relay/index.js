const express = require('express');
const { exec } = require('child_process');
require('dotenv').config({ path: '../../.env' }); // Load the key from a .env file

const app = express();
app.use(express.json());

const API_KEY = process.env.RELAY_API_KEY;

// Middleware to check the key
const authenticate = (req, res, next) => {
  const userKey = req.headers['relay-api-key'];
  if (!userKey || userKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  next();
};

app.post('/execute', authenticate, (req, res) => {
  const { script } = req.body;
  
  // Use a heredoc to prevent shell injection/escaping issues
  exec(`osascript <<'APPLESCRIPT'\n${script}\nAPPLESCRIPT`, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json({ output: stdout.trim() });
  });
});

const PORT = 3100;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Relay secured with API Key on port ${PORT}`);
});