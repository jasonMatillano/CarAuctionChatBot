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

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10'
});

// Initialize S3 client
const s3 = new AWS.S3({
  apiVersion: '2006-03-01'
});

// Function to log conversation to DynamoDB (for chat)
async function logConversation(sessionId, userQuery, botResponse) {
  const params = {
    TableName: 'ChatConversations',
    Item: {
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      userQuery: userQuery,
      botResponse: botResponse,
    }
  };

  try {
    await dynamoDB.put(params).promise();
    console.log('Conversation logged to DynamoDB:', sessionId);
  } catch (error) {
    console.error('Error logging to DynamoDB:', error);
  }
}

// Function to sync conversation to S3 for agent knowledge base
async function syncToS3(sessionId, userQuery, botResponse) {
  const conversationData = {
    sessionId: sessionId,
    timestamp: new Date().toISOString(),
    userQuery: userQuery,
    botResponse: botResponse,
  };

  const params = {
    Bucket: 'cloudcare-knowledge-base', // Replace with your S3 bucket name
    Key: `conversations/${sessionId}.json`,
    Body: JSON.stringify(conversationData),
    ContentType: 'application/json'
  };

  try {
    await s3.putObject(params).promise();
    console.log('Conversation synced to S3:', sessionId);
  } catch (error) {
    console.error('Error syncing to S3:', error);
  }
}

// Function to save user signup to DynamoDB
async function saveUser(username, email, password) {
  const params = {
    TableName: 'UsersCloudCare',
    Item: {
      username: username, // Primary key
      email: email,
      password: password, // In production, hash the password
      signupTimestamp: new Date().toISOString(),
    }
  };

  try {
    await dynamoDB.put(params).promise();
    console.log('User signed up:', username);
    return { success: true };
  } catch (error) {
    console.error('Error saving user to DynamoDB:', error);
    return { success: false, error: 'Failed to save user' };
  }
}

// Function to check user login
async function checkUser(username, password) {
  const params = {
    TableName: 'UsersCloudCare',
    Key: {
      username: username
    }
  };

  try {
    const data = await dynamoDB.get(params).promise();
    if (data.Item && data.Item.password === password) { // In production, compare hashed passwords
      console.log('User logged in:', username);
      return { success: true, message: 'Login successful', username: username };
    } else {
      return { success: false, error: 'Invalid username or password' };
    }
  } catch (error) {
    console.error('Error checking user:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Middleware
app.use(express.json());

// Serve all files in public directory
app.use(express.static('public'));

// Bedrock Agent Integration
const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

const bedrockClient = new BedrockAgentRuntimeClient({
  region: 'us-east-1',
  apiVersion: '2023-09-30',
});

// API Endpoints for Bedrock Agent
app.post('/invoke-agent', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'A valid query string is required' });
    }

    const sessionId = 'user-session-' + Date.now();
    const command = new InvokeAgentCommand({
      agentId: '34HFK8OK8K',
      agentAliasId: 'FAQFIH9VHC',
      sessionId: sessionId,
      inputText: query,
      enableStreaming: true,
    });

    const response = await bedrockClient.send(command);
    console.log('Raw response metadata:', JSON.stringify(response.$metadata, null, 2));

    let fullResponse = '';
    for await (const chunk of response.completion) {
      if (chunk.chunk && chunk.chunk.bytes) {
        const chunkText = Buffer.from(chunk.chunk.bytes).toString('utf-8');
        fullResponse += chunkText;
        console.log('Chunk received:', chunkText);
      }
    }

    let parsedResult = fullResponse;
    try {
      parsedResult = JSON.parse(fullResponse).results || fullResponse;
    } catch (e) {
      parsedResult = fullResponse;
    }

    await logConversation(sessionId, query, parsedResult);
    await syncToS3(sessionId, query, parsedResult); // Sync with S3
    res.status(200).json({ results: parsedResult });
  } catch (error) {
    console.error('Error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to invoke agent', details: error.message });
  }
});

// API Endpoint for Signup
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body; // Updated to include username
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const result = await saveUser(username, email, password);
    if (result.success) {
      res.status(200).json({ message: 'Signup successful' });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Signup error:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Endpoint for Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body; // Changed from email to username
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await checkUser(username, password);
    if (result.success) {
      res.status(200).json({ message: result.message, username: result.username });
    } else {
      res.status(401).json({ error: result.error });
    }
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});