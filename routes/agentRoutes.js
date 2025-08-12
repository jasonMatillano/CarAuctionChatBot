const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

// Initialize Bedrock client
const bedrockClient = new BedrockAgentRuntimeClient({
  region: 'us-east-1',
  apiVersion: '2023-09-30',
});

// Function to log conversation to DynamoDB
async function logConversation(userId, userQuery, botResponse, dynamoDB) {
  const params = {
    TableName: 'CloudCareUsers',
    Key: { userId },
    UpdateExpression: 'SET conversations = list_append(if_not_exists(conversations, :empty_list), :new_conversation)',
    ExpressionAttributeValues: {
      ':new_conversation': [{
        sessionId: 'user-session-' + Date.now(),
        timestamp: new Date().toISOString(),
        userQuery: userQuery,
        botResponse: botResponse
      }],
      ':empty_list': []
    },
    ReturnValues: 'UPDATED_NEW'
  };

  try {
    await dynamoDB.update(params).promise();
    console.log('Conversation logged to DynamoDB for user:', userId);
  } catch (error) {
    console.error('Error logging conversation to DynamoDB:', error);
  }
}

// API Endpoint for Bedrock Agent
router.post('/invoke-agent', async (req, res) => {
  try {
    const { query, userId } = req.body;
    if (!query || typeof query !== 'string' || !userId) {
      return res.status(400).json({ error: 'A valid query string and userId are required' });
    }

    const sessionId = 'user-session-' + Date.now();
    const params = {
      TableName: 'CloudCareUsers',
      Key: { userId }
    };
    const userData = await req.app.get('dynamoDB').get(params).promise();
    const conversations = userData.Item?.conversations || [];

    let context = '';
    if (conversations.length > 0) {
      const recentConversations = conversations.slice(-3).reverse();
      context = recentConversations.map(conv => `${conv.userQuery} - ${conv.botResponse}`).join('\n');
      context = `Previous context:\n${context}\nCurrent query: `;
    }

    const command = new InvokeAgentCommand({
      agentId: '7XR1XWUBMM',
      agentAliasId: 'WJFOTMGGOE',
      sessionId: sessionId,
      inputText: context + query,
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

    await logConversation(userId, query, parsedResult, req.app.get('dynamoDB'));
    res.status(200).json({ results: parsedResult });
  } catch (error) {
    console.error('Error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to invoke agent', details: error.message });
  }
});

module.exports = router;