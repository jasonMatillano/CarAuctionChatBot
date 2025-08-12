const express = require('express');
const router = express.Router();

// Function to retrieve conversation history
async function getConversationHistory(userId, dynamoDB) {
  const params = {
    TableName: 'CloudCareUsers',
    Key: { userId }
  };

  try {
    const data = await dynamoDB.get(params).promise();
    return data.Item ? data.Item.conversations || [] : [];
  } catch (error) {
    console.error('Error retrieving conversation history:', error);
    return [];
  }
}

// API endpoint to get conversation history
router.get('/get-history', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const history = await getConversationHistory(userId, req.app.get('dynamoDB'));
    res.status(200).json({ history });
  } catch (error) {
    console.error('Error in get-history:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

module.exports = router;