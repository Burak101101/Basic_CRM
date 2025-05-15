const axios = require('axios');

// Test direct connection to the registration endpoint
async function testRegistration() {
  try {
    // Create test user data
    const userData = {
      username: "testuser" + Math.floor(Math.random() * 10000),
      email: `testuser${Math.floor(Math.random() * 10000)}@example.com`,
      password: "testpassword123",
      password_confirm: "testpassword123",
      first_name: "Test",
      last_name: "User"
    };
    
    console.log("Attempting to register with data:", userData);
    
    // Try the request with the exact URL structure
    const response = await axios.post(
      'http://127.0.0.1:8000/api/v1/auth/register/', 
      userData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("Registration successful!", response.data);
  } catch (error) {
    console.error("Registration failed!");
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    console.error("Request URL:", error.config?.url);
    console.error("Request data:", error.config?.data);
  }
}

testRegistration();
