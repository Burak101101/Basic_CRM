// debug-register.js
const axios = require('axios');

// Function to create a test user with specific data format
async function testRegister() {
  try {
    const userData = {
      username: "testuser" + Math.floor(Math.random() * 10000),
      email: `testuser${Math.floor(Math.random() * 10000)}@example.com`,
      password: "Password123!",
      password_confirm: "Password123!",
      first_name: "Test",
      last_name: "User"
    };

    console.log("Sending registration request with data:", JSON.stringify(userData, null, 2));

    const response = await axios.post(
      'http://127.0.0.1:8000/api/v1/auth/register/',
      userData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("Registration successful!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Registration failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
      console.error("Headers:", JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error:", error.message);
    }
    console.error("Request config:", JSON.stringify({
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
      data: JSON.parse(error.config?.data || '{}')
    }, null, 2));
  }
}

testRegister();
