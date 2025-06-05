import { Hono } from "hono";
import { handle } from "hono/vercel";
import axios from "axios";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", cors());

async function waitForImage(task_url, interval = 10000, maxAttempts = 10) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await axios.get(task_url);
    const data = response.data;

    if (data.ok && data.url) {
      return data.url;
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error("Image was not ready in time.");
}

app.post("/imagine", async (c) => {
  try {
    const { inputQuery } = await c.req.json();

    const response = await axios.get(
      "https://api.paxsenix.biz.id/ai-image/gptimage1",
      {
        params: { text: inputQuery },
      }
    );

    if (!response.data.task_url) {
      throw new Error("No task_url returned from image API.");
    }

    await new Promise((r) => setTimeout(r, 60000));

    const imageUrl = await waitForImage(response.data.task_url);

    return c.json({
      image_url: imageUrl,
    });
  } catch (error) {
    return c.json(
      { error: "Failed to generate image." },
      500
    );
  }
});

export const handler = handle(app);