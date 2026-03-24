const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AIDoc Express API' });
});

// Updated to remove MySQL dependency
app.get('/check-connection', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'API server is running',
      server_info: 'Express API Server'
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

// Removed MySQL-dependent endpoints (get-patients, get-patient, add-patient, update-patient, etc.)

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app; 