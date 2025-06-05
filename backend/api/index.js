import axios from "axios";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { inputQuery } = req.body;

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

    res.status(200).json({
      image_url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate image." });
  }
}