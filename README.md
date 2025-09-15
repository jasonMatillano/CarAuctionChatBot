# SerenitySync

A full-stack **Node.js + Express** application offering secure user authentication, interactive chatbot functionality, mood tracking, and chat history management.

## 📖 Overview

SerenitySync is a full-stack web application designed to empower users with tools for mental health and productivity enhancement. It offers a seamless experience through personalized wellness check-ins, mood tracking, and interactive chatbot conversations powered by AWS Bedrock AI. The application securely manages user data and chat history, featuring a robust backend with bycrypt encryption, a DynamoDB NoSQL database, and a lightweight static HTML frontend for accessibility and ease of use.

## 📂 Project Structure

```
SerenitySync/
├── public/                 # Frontend static HTML pages
│   ├── home.html           # Landing page
│   ├── login.html          # User login page
│   ├── signup.html         # User registration page
│   ├── mood_tracker.html   # Mood tracking interface
│   └── mood_graph.html     # Mood history visualization
├── routes/                 # Express route handlers
│   ├── agentRoutes.js      # Chatbot interaction routes
│   ├── authRoutes.js       # Authentication routes
│   ├── historyRoutes.js    # Chat history routes
│   └── moodRoutes.js       # Mood tracking routes
├── .env                    # Environment variables (not tracked in Git)
├── server.js               # Main application entry point
├── package.json            # Node.js dependencies and scripts
└── README.md               # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 14.x or higher
- **git**: Version 2.42.0 or higher
- **npm**: Version 6.x or higher
- **DynamoDB**: AWS account with DynamoDB configured
- **AWSBedrock**: AWS account with AWS Bedrock Agent configured
- **AWS CLI**: Configured with appropriate credentials (optional for local setup)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/serenitysync.git
   ```
2. Navigate to the project directory:
   ```bash
   cd serenitysync
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and configure the following variables:
   ```env
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   ```
5. Start the application:
   ```bash
   npm start
   ```
   The app will be available at `http://<instance_ip>:80`.

## ✨ Features
- **User Authentication**: Secure signup and login using bcrypt for password hashing.
- **Chatbot Interaction**: Engage with a chatbot and send messages via API.
- **Chat History**: Retrieve and view past chat interactions.
- **Mood Tracking**: Log and visualize user mood data post-login.
- **Static Frontend**: Lightweight HTML, CSS, and JavaScript-based interface.

## 🛠️ API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /signup`: Register a new user with email and password.
- `POST /login`: Authenticate user using credentials.

### Chatbot Routes (`/api/agent`)
- `POST /chat`: Send a message to the chatbot and receive a response.

### History Routes (`/api/get-history`)
- `GET /get-history`: Retrieve the user's chat history.

### Mood Routes (`/api/mood`)
- `POST /mood`: Log the user's mood after login.
- `GET /mood`: Retrieve the user's mood history for visualization.

## 🧰 Tech Stack
- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript
- **Database**: AWS DynamoDB
- **AI Chatbot**: AWS Bedrock Agent
- **Encyption**: Bcrypt
- **Environment**: dotenv for configuration

## 🔮 Future Improvements
- Enhance frontend with modern CSS frameworks (e.g., Tailwind CSS or Bootstrap) for improved styling and responsiveness.
- Utilize JavaScript Framework such as ReactJS or AngularJS for web application frontend.
- Implement unit and integration tests using frameworks like Jest or Mocha.
- Integrate Amazon Polly for voice-based chatbot interactions.
- Deploy the application on AWS with Application Load Balancer (ALB) and Auto Scaling to handle large-scale user traffic.
- Apply AWS Route53 and DNS service for production.
- Utilize AWS Simple Notification Service for data analytics for mood trends, chatbot usage, scheduled login and wellness check.

## 👥 Authors
- Jason
- Kiki
- Rasha
- Tony
- Negassi
