# Multi-Level Sales & Commission App

## 1. Overview

This project is a full-stack application designed to manage a multi-level sales network. It features a React PWA frontend and a Node.js/Express backend with a MongoDB Atlas database. The core of the application is its ACID-compliant transaction logic, which ensures data integrity when processing purchases and distributing commissions through multiple levels of the sales hierarchy.

This README provides a complete guide for setting up, configuring, and running the application for both development and production environments.

---

## 2. Prerequisites

Before you begin, ensure you have the following software installed on your system:

- **Node.js**: Version 18.x or higher. You can download it from [nodejs.org](https://nodejs.org/).
- **npm**: Node Package Manager, which comes with Node.js.
- **Git**: For cloning the repository. You can get it from [git-scm.com](https://git-scm.com/).
- **MongoDB Atlas Account**: A cloud-hosted MongoDB service is required. You can create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).

---

## 3. Installation & Setup

Follow these steps to get the project running on your local machine.

**Step 1: Clone the Repository**

Open your terminal and clone the project repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd <PROJECT_DIRECTORY>
```

**Step 2: Install Backend Dependencies**

Navigate to the backend directory and install the required npm packages.

```bash
cd backend
npm install
```

**Step 3: Install Frontend Dependencies**

In a separate terminal, navigate to the frontend directory and install its dependencies.

```bash
cd frontend
npm install
```

---

## 4. Configuration (Crucial)

The backend server requires environment variables to connect to the database and manage security settings.

**Step 1: Create a `.env` File**

In the `/backend` directory, create a new file named `.env`.

**Step 2: Add Environment Variables**

Copy the contents of the example block below into your `.env` file and replace the placeholder values with your actual credentials.

**.env.example**
```
# MongoDB Atlas Connection String
# Replace with your actual connection string from your Atlas dashboard
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

# JSON Web Token Secret
# Used for signing and verifying tokens for authentication
JWT_SECRET=your_super_secret_jwt_key_that_is_long_and_random

# Server Port
# The port the Node.js server will run on
PORT=5000
```

---

## 5. Running the Application

The application is designed to run with the frontend and backend servers operating concurrently in development.

### Development Mode

**1. Run the Backend Server:**

Navigate to the `/backend` directory and run the development server. This uses `nodemon` to automatically restart the server on file changes.

```bash
cd backend
npm run dev
```
The backend will be running at `http://localhost:5000`.

**2. Run the Frontend Development Server:**

In a separate terminal, navigate to the `/frontend` directory and start the React development server.

```bash
cd frontend
npm start
```
The React app will open automatically in your browser at `http://localhost:3000`.

### Production Mode

In a production environment, the React app is first built into a static bundle, which is then served directly by the Express server.

**1. Build the React Application:**

From the `/frontend` directory, run the build script.

```bash
cd frontend
npm run build
```
This will create a `build` folder in the `/frontend` directory containing the optimized, static assets.

**2. Start the Production Server:**

From the `/backend` directory, run the start script.

```bash
cd backend
npm start
```
The Express server will now serve the React application from `frontend/build`. You can access the production-ready application at `http://localhost:5000`.

---

## 6. Key API Endpoints

The following table summarizes the core API routes available in this application.

| Method | Endpoint         | Description                                       | Request Body Example                               |
|--------|------------------|---------------------------------------------------|----------------------------------------------------|
| `POST` | `/api/purchase`  | Processes a new purchase and triggers the commission distribution logic. Requires a valid `userId` and a positive `amount`. | `{ "userId": "60d5f1b3e6b3f1b3e6b3f1b3", "amount": 50.00 }` |
