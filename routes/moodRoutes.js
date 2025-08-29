const express = require('express');
const router = express.Router();

// POST route to handle mood submission
router.post('/mood', async (req, res) => {
  const { userId, mood, timestamp } = req.body;

  // Validate request data
  if (!userId || !mood || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields: userId, mood, or timestamp' });
  }

  // DynamoDB parameters for updating the mood array
  const params = {
    TableName: 'CloudCareUsers',
    Key: { userId: userId },
    UpdateExpression: 'SET #mood = list_append(if_not_exists(#mood, :empty_list), :new_mood)',
    ExpressionAttributeNames: {
      '#mood': 'mood'
    },
    ExpressionAttributeValues: {
      ':new_mood': [{ mood: mood, timestamp: timestamp }],
      ':empty_list': []
    },
    ReturnValues: 'UPDATED_NEW'
  };

  try {
    const dynamoDB = req.app.get('dynamoDB');
    await dynamoDB.update(params).promise();
    res.status(200).json({ message: 'Mood saved successfully' });
  } catch (error) {
    console.error('Error saving mood to DynamoDB:', error);
    res.status(500).json({ error: 'Failed to save mood' });
  }
});

module.exports = router;