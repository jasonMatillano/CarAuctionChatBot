const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const AWS = require('aws-sdk');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Middleware
app.use(express.json());

// Bedrock Agent Integration
const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

const bedrockClient = new BedrockAgentRuntimeClient({
  region: 'us-east-1', // Match your agent's region
  apiVersion: '2023-09-30',
  // Use IAM role on EC2; no hardcoded credentials
});

// API Endpoints for Bedrock Agent
app.post('/invoke-agent', async (req, res) => {
  try {
    // Validate request body
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'A valid query string is required' });
    }

    const command = new InvokeAgentCommand({
      agentId: 'HKGQ3XA4CH', // Replace with your actual Agent ID if different
      agentAliasId: 'SXPWSDOLPK', // Replace with your actual Alias ID if different
      sessionId: 'user-session-' + Date.now(), // Unique session ID
      inputText: query,
      enableStreaming: true, // Explicitly enable streaming
    });

    const response = await bedrockClient.send(command);
    console.log('Raw response metadata:', JSON.stringify(response.$metadata, null, 2)); // Debug metadata

    let fullResponse = '';
    for await (const chunk of response.completion) {
      if (chunk.chunk && chunk.chunk.bytes) {
        const chunkText = Buffer.from(chunk.chunk.bytes).toString('utf-8');
        fullResponse += chunkText;
        console.log('Chunk received:', chunkText); // Debug each chunk
      }
    }

    // Attempt to parse as JSON, fallback to raw text
    let parsedResult = fullResponse;
    try {
      parsedResult = JSON.parse(fullResponse).results || fullResponse;
    } catch (e) {
      parsedResult = fullResponse; // Use raw text if parsing fails
    }

    res.status(200).json({ results: parsedResult });
  } catch (error) {
    console.error('Error:', error.message, error.stack); // Include stack trace
    res.status(500).json({ error: 'Failed to invoke agent', details: error.message });
  }
});

// Serve Static Page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/chatbot.html');
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});