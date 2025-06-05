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
    try {
      // Create a clean request without Cloudflare headers that might interfere
      const cleanRequest = new Request(task_url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0)',
          'Accept': 'application/json, text/plain, */*'
        }
      });

      const response = await fetch(cleanRequest);
      
      if (!response.ok) {
        console.log(`Attempt ${attempt}: HTTP ${response.status} - ${response.statusText}`);
        await new Promise(resolve => setTimeout(resolve, interval));
        continue;
      }

      const text = await response.text();
      console.log(`Attempt ${attempt}: Raw response:`, text);
      
      // Handle both JSON and text responses
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.log(`Attempt ${attempt}: Non-JSON response: ${text}`);
        // If it's an error message, throw it
        if (text.includes('error code')) {
          throw new Error(`API Error: ${text}`);
        }
        await new Promise(resolve => setTimeout(resolve, interval));
        continue;
      }

      if (data.ok && data.url) {
        console.log("Image is ready:", data.url);
        return data.url;
      }

      console.log(`Attempt ${attempt}: Status is "${data.status}". Waiting...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      console.log(`Attempt ${attempt}: Error - ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  throw new Error("Image was not ready in time.");
}

app.post("/imagine", async (c) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { inputQuery } = await c.req.json();

    const url = new URL("https://api.paxsenix.biz.id/ai-image/gptimage1");
    url.searchParams.set("text", inputQuery);
    
    // Create a clean request without potentially problematic headers
    const cleanRequest = new Request(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0)',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    
    const response = await fetch(cleanRequest);
    
    if (!response.ok) {
      throw new Error(`Initial API call failed: HTTP ${response.status} - ${response.statusText}`);
    }

    const text = await response.text();
    console.log("Initial API response:", text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Initial API returned invalid JSON: ${text}`);
    }

    if (!data.task_url) {
      throw new Error("No task_url returned from image API.");
    }

    await new Promise(resolve => setTimeout(resolve, 60000));

    const imageUrl = await waitForImage(data.task_url);

    return c.json({
      image_url: imageUrl,
    });
  } catch (error) {
    console.error("Detailed error:", error.message);
    return c.json(
      { error: `Failed to generate image: ${error.message}` },
      500
    );
  }
});

app.get("/", (c) => {
  c.header("Access-Control-Allow-Origin", "*");
  return c.text("Worker is running!");
});

export default app;