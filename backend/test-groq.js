require("dotenv").config();

async function testGroq() {
    try {
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-120b",
                    messages: [
                        {
                            role: "user",
                            content: "Hello! Give me a one-line response to confirm that you are working."
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 100
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.log("GROQ ERROR:");
            console.log(data);
            return;
        }

        console.log("GROQ SUCCESS:");
        console.log(data.choices[0].message.content);

    } catch (error) {
        console.log("GROQ CONNECTION ERROR:");
        console.log(error.message);
    }
}

testGroq();