import { Hono } from "hono";

const app = new Hono();

// Handle CORS preflight requests
app.options("*", (c) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type");
  c.header("Access-Control-Max-Age", "86400");
  return c.text("", 204);
});

async function waitForImage(task_url, interval = 10000, maxAttempts = 10) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(task_url);
    // Safely get the response as text first
    const responseText = await response.text();

    let data;
    try {
      // Try to parse the text as JSON
      data = JSON.parse(responseText);
    } catch (e) {
      // If parsing fails, log the raw text and wait before retrying
      console.error(
        `[waitForImage] Attempt ${attempt}: Response was not valid JSON. Content: "${responseText}". Retrying...`
      );
      await new Promise(resolve => setTimeout(resolve, interval));
      continue; // Move to the next attempt
    }

    // Check for the successful condition in the valid JSON
    if (data.ok && data.url) {
      console.log("Image is ready:", data.url);
      return data.url;
    }

    console.log(
      `[waitForImage] Attempt ${attempt}: Status is "${data.status || 'unknown'}". Waiting...`
    );
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error("Image was not ready in time.");
}

app.post("/imagine", async (c) => {
  // Add CORS headers to the response
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { inputQuery } = await c.req.json();

    const url = new URL("https://api.paxsenix.biz.id/ai-image/gptimage1");
    url.searchParams.set("text", inputQuery);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });

    // --- KEY CHANGE: Safely parse the initial API response ---
    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      
      console.error("CRITICAL: The initial API response was not valid JSON.");
      console.error("RAW RESPONSE FROM API:", responseText);
      throw new Error("The external API did not return valid JSON.");
    }
    

    if (!data.task_url) {
      console.error("API response was JSON, but did not contain a 'task_url'. Response:", data);
      throw new Error("No task_url returned from image API.");
    }

    
    await new Promise(resolve => setTimeout(resolve, 60000));

    const imageUrl = await waitForImage(data.task_url);

    return c.json({
      image_url: imageUrl,
    });
  } catch (error) {
    console.error("Error in /imagine route:", error.message);
    return c.json(
      { error: "Failed to generate image.", details: error.message },
      500
    );
  }
});

app.get("/", (c) => {
  c.header("Access-Control-Allow-Origin", "*");
  return c.text("Worker is running!");
});

export default app;