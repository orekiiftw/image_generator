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
    const data = await response.json();

    if (data.ok && data.url) {
      console.log("Image is ready:", data.url);
      return data.url;
    }

    console.log(
      `Attempt ${attempt}: Status is "${data.status}". Waiting...`
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
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.task_url) {
      throw new Error("No task_url returned from image API.");
    }

    await new Promise(resolve => setTimeout(resolve, 60000));

    const imageUrl = await waitForImage(data.task_url);

    return c.json({
      image_url: imageUrl,
    });
  } catch (error) {
    console.error(error);
    return c.json(
      { error: "Failed to generate image." },
      500
    );
  }
});

// Add a test route
app.get("/", (c) => {
  c.header("Access-Control-Allow-Origin", "*");
  return c.text("Worker is running!");
});

export default app;