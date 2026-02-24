export default async function handler(req, res) {
  // CORSヘッダー
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const q = req.query.q;
  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: "SLACK_WEBHOOK_URL is not configured" });
  }

  const payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*新しい通知*\n${q}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `送信時刻: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
          },
        ],
      },
    ],
  };

  try {
    const slackRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!slackRes.ok) {
      const text = await slackRes.text();
      return res.status(502).json({ error: "Slack API error", detail: text });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to send", detail: err.message });
  }
}
