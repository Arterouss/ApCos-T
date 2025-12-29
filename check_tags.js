// No need to import fetch in Node 18+
async function checkTags() {
  try {
    console.log("Fetching creators...");
    const creators = await fetch("http://localhost:3001/api/creators").then(
      (res) => res.json()
    );
    if (!creators || creators.length === 0) {
      console.log("No creators found");
      return;
    }

    // Try to find a creator that might have tags.
    // Randomly checking the first 3
    for (const creator of creators.slice(0, 3)) {
      console.log(
        `Checking posts for ${creator.name} (${creator.service}/${creator.id})`
      );
      const posts = await fetch(
        `http://localhost:3001/api/posts/${creator.service}/${creator.id}`
      ).then((res) => res.json());

      if (posts && posts.length > 0) {
        console.log(`-- Post ${posts[0].id} Tags:`, posts[0].tags);
      } else {
        console.log("-- No posts or empty.");
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

checkTags();
