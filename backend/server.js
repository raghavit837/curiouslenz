require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "CuriousLenz backend is running",
  });
});

// Image analysis
app.post("/api/analyze", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "No image uploaded",
    });
  }

  try {
    console.log("Image received:", req.file.originalname);

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || !apiKey.trim()) {
      return res.status(500).json({
        error: "GROQ_API_KEY is missing from the backend environment.",
      });
    }

    const mimeType = req.file.mimetype;

    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return res.status(400).json({
        error: "Please upload a JPG, PNG, or WEBP image.",
      });
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString("base64");

    const prompt = `
You are CuriousLenz, an AI that turns ordinary photographs into
small interactive learning experiences.

Analyze the uploaded image carefully.

Return ONLY valid JSON in exactly this structure:

{
  "object": "name of the main object",
  "fact": "one genuinely interesting and surprising fact about it",
  "quiz": [
    "true or false statement 1",
    "true or false statement 2",
    "true or false statement 3"
  ],
  "answer": 1,
  "explanation": "Explain why the selected answer is the lie.",
  "lookAgain": "A practical, safe, image-specific outdoor quest that takes 2-5 minutes."
}

Rules:
1. Identify the main visible object accurately.
2. Make the fact interesting and educational.
3. Return exactly three quiz statements.
4. Exactly two statements must be true and one false.
5. The answer must be 1, 2, or 3, identifying the false statement.
6. Explain why that statement is false.
7. Make lookAgain an outdoor quest related to the image.
8. Encourage observation and discovery.
9. Give one clear action taking 2-5 minutes.
10. Make the quest specific to the main subject.
11. For a leaf, compare another leaf's shape or edges.
12. For a bicycle, observe a parked bicycle and identify two parts.
13. For an animal, observe it from a safe distance.
14. Never encourage touching unknown plants, disturbing wildlife,
entering private property, unsafe road crossing, or handling dangerous objects.
15. If going outside is unsafe or impossible, suggest a safe observation
from a window or another location.
16. Use friendly, concise language and address the user directly.
17. Do not include Markdown.
18. Return valid JSON only, with the exact requested structure.
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          // Use the vision model that you verified works locally.
          model: "qwen/qwen3.8-27b",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);

      return res.status(500).json({
        error: data.error?.message || "Groq AI analysis failed.",
      });
    }

    let aiText = data.choices?.[0]?.message?.content;

    if (typeof aiText !== "string" || !aiText.trim()) {
      console.error("Unexpected Groq response:", data);

      return res.status(500).json({
        error: "AI returned an empty or invalid response.",
      });
    }

    aiText = aiText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let result;

    try {
      result = JSON.parse(aiText);
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError.message);

      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }

    if (
      !result.object ||
      !result.fact ||
      !Array.isArray(result.quiz) ||
      result.quiz.length !== 3 ||
      ![1, 2, 3].includes(result.answer) ||
      !result.explanation ||
      !result.lookAgain
    ) {
      console.error("Invalid AI response structure:", result);

      return res.status(500).json({
        error: "AI response is missing required fields. Please try again.",
      });
    }

    return res.json({
      result,
      filename: req.file.originalname,
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Unable to analyze image. Please try again.",
    });
  } finally {
    if (req.file?.path) {
      fs.promises.unlink(req.file.path).catch((error) => {
        console.error(
          "Temporary image cleanup failed:",
          error.message
        );
      });
    }
  }
});

// Works locally and on Render
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`CuriousLenz backend running on port ${PORT}`);
  console.log(
    "Groq API key loaded:",
    Boolean(process.env.GROQ_API_KEY)
  );
});
