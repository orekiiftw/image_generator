import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", cors());

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
  try {
    const { inputQuery } = await c.req.json();

    // Use fetch instead of axios
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

export default app;