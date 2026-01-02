const API_BASE = "/api/r34";

export async function getRule34Posts(page = 0, tags = "", limit = 20) {
  try {
    const params = new URLSearchParams({
      limit,
      pid: page,
      tags,
    });

    // Note: In Vite dev, we might need full URL or proxy config.
    // Using direct localhost:3001 for now as per project pattern.
    const response = await fetch(`${API_BASE}/posts?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Failed to fetch rule34 posts");
    }

    return await response.json();
  } catch (error) {
    console.error("Rule34 Service Error:", error);
    return [];
  }
}

export async function getRule34Tags(limit = 20) {
  try {
    const response = await fetch(`${API_BASE}/tags?limit=${limit}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    return [];
  }
}
