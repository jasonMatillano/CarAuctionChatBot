const express = require('express');
const router = express.Router();

// Function to retrieve conversation history
async function getConversationHistory(username, dynamoDB) {
  const params = {
    TableName: 'UsersCloudCare',
    Key: { username }
  };

  try {
    const data = await dynamoDB.get(params).promise();
    return data.Item ? data.Item.conversations || [] : [];
  } catch (error) {
    console.error('Error retrieving conversation history:', error);
    return [];
  }
}

// New API endpoint to get conversation history
router.get('/get-history', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    const history = await getConversationHistory(username, req.app.get('dynamoDB'));
    res.status(200).json({ history });
  } catch (error) {
    console.error('Error in get-history:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

module.exports = router;