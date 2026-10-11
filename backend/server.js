require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/api/health", (req, res) => {
    res.json({
        status: "CuriousLenz backend is running"
    });
});

app.post("/api/analyze", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: "No image uploaded"
        });
    }

    try {
        console.log("Image received:", req.file.originalname);

        // Read uploaded image
        const fs = require("fs");

        const imageBuffer = fs.readFileSync(req.file.path);

        const base64Image = imageBuffer.toString("base64");

        // Detect image type
        const mimeType = req.file.mimetype;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
                },

                body: JSON.stringify({
                    model: "qwen/qwen3.8-27b",

                    messages: [
                        {
                            role: "user",

                            content: [
                                {
                                    type: "text",

                                    text: `
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
2. The fact must be interesting, educational, and relevant to the image.
3. The quiz must contain exactly THREE statements.
4. Exactly TWO statements must be true and ONE must be false.
5. "answer" must be 1, 2, or 3, corresponding to the false statement.
6. "explanation" must explain why that statement is false.
7. "lookAgain" must now be an OUTDOOR QUEST related to the uploaded image.
8. The quest must encourage the user to step outside, observe their surroundings, or discover something in the real world related to the image.
9. Give ONE clear action that can be completed in 2–5 minutes.
10. Make the quest specific to the image's main object or subject, not a generic activity.
11. Example: If the image contains a leaf, ask the user to find another leaf nearby and compare its shape or edges.
12. Example: If the image contains a bicycle, ask the user to observe a parked bicycle and identify two different parts.
13. If the image shows an animal, ask the user to observe it from a safe distance without disturbing or approaching it.
14. Never instruct the user to touch unknown plants, approach wildlife, enter private property, cross roads unsafely, or handle dangerous objects.
15. If going outside is unsafe or impossible, suggest an equivalent observation task from a window or another safe location.
16. Use friendly, concise language and address the user directly.
17. Do not include markdown.
18. Return valid JSON only, using the exact requested structure.
`
                                },

                                {
                                    type: "image_url",

                                    image_url: {
                                        url: `data:${mimeType};base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],

                    temperature: 0.7,

                    max_tokens: 1000
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Groq API error:", data);

            return res.status(500).json({
                error:
                    data.error?.message ||
                    "Groq AI analysis failed."
            });
        }

        let aiText = data.choices?.[0]?.message?.content;

        if (!aiText) {
            return res.status(500).json({
                error: "AI returned an empty response."
            });
        }

        console.log("AI response:");
        console.log(aiText);

        // Remove possible markdown code fences
        aiText = aiText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        let result;

        try {
            result = JSON.parse(aiText);
        } catch (parseError) {
            console.error("JSON parsing failed:", parseError);

            return res.status(500).json({
                error: "AI returned invalid JSON."
            });
        }

        res.json({
            ...result,
            filename: req.file.originalname
        });

    } catch (error) {
        console.error("Server error:", error);

        res.status(500).json({
            error: "Unable to analyze image."
        });
    }
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(
        `CuriousLenz backend running on http://localhost:${PORT}`
    );
});