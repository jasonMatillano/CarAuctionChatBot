const express = require('express');
const router = express.Router();

// Function to save user signup to DynamoDB
async function saveUser(username, email, password, dynamoDB) {
  const params = {
    TableName: 'UsersCloudCare',
    Item: {
      username,
      email,
      password, // In production, hash the password
      signupTimestamp: new Date().toISOString(),
      conversations: []
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
async function checkUser(username, password, dynamoDB) {
  const params = {
    TableName: 'UsersCloudCare',
    Key: { username }
  };

  try {
    const data = await dynamoDB.get(params).promise();
    if (data.Item && data.Item.password === password) { // In production, compare hashed passwords
      console.log('User logged in:', username);
      return { success: true, message: 'Login successful', username };
    } else {
      return { success: false, error: 'Invalid username or password' };
    }
  } catch (error) {
    console.error('Error checking user:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// API Endpoint for Signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const result = await saveUser(username, email, password, req.app.get('dynamoDB'));
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
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await checkUser(username, password, req.app.get('dynamoDB'));
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

module.exports = router;