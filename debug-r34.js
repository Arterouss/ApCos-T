import fetch from "node-fetch";

const R34_USER_ID = "5762968";
const R34_API_KEY =
  "3e73144a2a715c380366a52084f878446dcf717cbac9e14e1f5421e64eb7f4e8237a5fef5fd33474d0fcd046623d4e471fbf9da3485f6b1d2ae1c29ce8fb8233";

async function checkRule34() {
  const url = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=1&tags=video&user_id=${R34_USER_ID}&api_key=${R34_API_KEY}`;
  console.log("Fetching: " + url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0) {
      const video = data[0];
      console.log("Sample Video Post:");
      console.log("ID:", video.id);
      console.log("File URL:", video.file_url);
      console.log("Sample URL:", video.sample_url);
      console.log("Preview URL:", video.preview_url);
      console.log(
        "Sample Width/Height:",
        video.sample_width,
        video.sample_height
      );
      console.log("Width/Height:", video.width, video.height);
    } else {
      console.log("No hits.");
    }
  } catch (e) {
    console.error(e);
  }
}

checkRule34();
