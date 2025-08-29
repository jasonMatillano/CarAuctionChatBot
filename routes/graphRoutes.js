const express = require('express');
const router = express.Router();

// GET route to fetch mood data for a user
router.get('/mood', async (req, res) => {
  const { userId } = req.query;

  // Validate request data
  if (!userId) {
    return res.status(400).json({ error: 'Missing required query parameter: userId' });
  }

  // DynamoDB parameters
  const params = {
    TableName: 'CloudCareUsers',
    Key: { userId: userId }
  };

  try {
    const dynamoDB = req.app.get('dynamoDB');
    const result = await dynamoDB.get(params).promise();
    if (!result.Item) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ mood: result.Item.mood || [] });
  } catch (error) {
    console.error('Error fetching mood data from DynamoDB:', error);
    res.status(500).json({ error: 'Failed to fetch mood data' });
  }
});

module.exports = router;