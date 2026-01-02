import axios from "axios";

// Rule34 API (Standard Booru API) - JSON Mode (Trying with Auth)
// Creds: Validated
const API_URL =
  "https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=5&api_key=3e73144a2a715c380366a52084f878446dcf717cbac9e14e1f5421e64eb7f4e8237a5fef5fd33474d0fcd046623d4e471fbf9da3485f6b1d2ae1c29ce8fb8233&user_id=5762968";

async function testRule34() {
  try {
    console.log(`Fetching ${API_URL}...`);
    const response = await axios.get(API_URL, { responseType: "text" });

    console.log(`Status: ${response.status}`);
    console.log("Data Preview:", response.data.substring(0, 500));

    if (response.data.includes("<posts")) {
      console.log("PASS: Received XML posts.");
    } else {
      console.log("WARN: XML not valid or blocked.");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testRule34();
