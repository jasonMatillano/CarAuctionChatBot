const express = require('express');
const http = require('http');
const AWS = require('aws-sdk');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const server = http.createServer(app);

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10'
});

// Store dynamoDB client in app object
app.set('dynamoDB', dynamoDB);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Import routes
const agentRoutes = require('./routes/agentRoutes');
const authRoutes = require('./routes/authRoutes');
const historyRoutes = require('./routes/historyRoutes');
const moodRoutes = require('./routes/moodRoutes');
const graphRoutes = require('./routes/graphRoutes');

// Use routes
app.use('/api', agentRoutes);
app.use('/api', authRoutes);
app.use('/api', historyRoutes);
app.use('/api', moodRoutes);
app.use('/api', graphRoutes);

// Start the server
const port = process.env.PORT || 80;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});