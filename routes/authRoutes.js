const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Function to save user signup to DynamoDB
async function saveUser(firstname, lastname, email, password, dynamoDB) {
  const userId = uuidv4();
  const emailCheck = await dynamoDB.query({
    TableName: 'CloudCareUsers',
    IndexName: 'EmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email }
  }).promise();
  if (emailCheck.Items.length > 0) {
    return { success: false, error: 'Email already exists' };
  }

  const params = {
    TableName: 'CloudCareUsers',
    Item: {
      userId,
      firstname,
      lastname,
      email,
      password, // In production, hash the password
      signupTimestamp: new Date().toISOString(),
      conversations: []
    }
  };

  try {
    await dynamoDB.put(params).promise();
    console.log('User signed up:', email);
    return { success: true, userId, firstname, lastname, email };
  } catch (error) {
    console.error('Error saving user to DynamoDB:', error);
    return { success: false, error: 'Failed to save user' };
  }
}

// Function to check user login
async function checkUser(email, password, dynamoDB) {
  const params = {
    TableName: 'CloudCareUsers',
    IndexName: 'EmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email }
  };

  try {
    const data = await dynamoDB.query(params).promise();
    if (data.Items.length > 0 && data.Items[0].password === password) {
      console.log('User logged in:', email);
      return {
        success: true,
        message: 'Login successful',
        userId: data.Items[0].userId,
        firstname: data.Items[0].firstname,
        lastname: data.Items[0].lastname,
        email: data.Items[0].email
      };
    } else {
      return { success: false, error: 'Invalid email or password' };
    }
  } catch (error) {
    console.error('Error checking user:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// API Endpoint for Signup
router.post('/signup', async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required' });
    }

    const result = await saveUser(firstname, lastname, email, password, req.app.get('dynamoDB'));
    if (result.success) {
      res.status(200).json({
        message: 'Signup successful',
        userId: result.userId,
        firstname: result.firstname,
        lastname: result.lastname,
        email: result.email
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Signup error:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Endpoint for Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await checkUser(email, password, req.app.get('dynamoDB'));
    if (result.success) {
      res.status(200).json({
        message: result.message,
        userId: result.userId,
        firstname: result.firstname,
        lastname: result.lastname,
        email: result.email
      });
    } else {
      res.status(401).json({ error: result.error });
    }
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;