app.post("/imagine", async (c) => {
  // CORS…
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type");

  try {
    const body = await c.req.json();
    console.log("Incoming body:", body);
    const { inputQuery } = body;
    if (!inputQuery) {
      return c.json({ error: "Missing inputQuery in request body" }, 400);
    }

    // 1) Make sure we POST JSON (not GET with ?text=…)
    const apiUrl = "https://api.paxsenix.biz.id/ai-image/gptimage1";
    const init = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept":       "application/json",
      },
      body: JSON.stringify({ text: inputQuery }),
    };
    console.log("Calling image API:", apiUrl, init);

    const res = await fetch(apiUrl, init);
    const raw = await res.text();
    console.log("Image API response status:", res.status, res.statusText);
    console.log("Image API raw body:", raw);

    if (!res.ok) {
      // bubble the 403/400/whatever up to the client
      return c.json(
        { error: `Image API failed: HTTP ${res.status} ‑ ${res.statusText}`, body: raw },
        502
      );
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return c.json({ error: "Invalid JSON from image API", body: raw }, 502);
    }

    if (!data.task_url) {
      return c.json({ error: "No task_url in image API response", data }, 502);
    }

    // wait + poll…
    await new Promise((r) => setTimeout(r, 60_000));
    const imageUrl = await waitForImage(data.task_url);
    return c.json({ image_url: imageUrl });
  } catch (err) {
    // log full stack
    console.error("Worker mistake:", err);
    return c.json(
      { error: err.message, stack: err.stack },
      500
    );
  }
});