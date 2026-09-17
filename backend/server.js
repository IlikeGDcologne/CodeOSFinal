import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
    console.error("❌ No OPENROUTER_API_KEY found in .env");
    process.exit(1);
}

app.get("/", (req, res) => {
    res.json({
        ok: true,
        message: "CodeOS backend is running 👾"
    });
});

app.post("/api/ai", async (req, res) => {

    try {

        const {
            messages,
            model = "openrouter/free"
        } = req.body;

        if (!Array.isArray(messages)) {

            return res.status(400).json({
                ok: false,
                error: "messages must be an array."
            });

        }

        console.log(
            "🤖 AI request received"
        );

        console.log(
            "🤖 Model:",
            model
        );

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Bearer ${API_KEY}`,

                    "Content-Type":
                        "application/json",

                    "X-Title":
                        "CodeOS"
                },

                body: JSON.stringify({
                    model,
                    messages,
                    stream: false
                })
            }
        );

        const rawText =
            await response.text();

        console.log(
            "🤖 OpenRouter HTTP:",
            response.status
        );

        console.log(
            "🤖 OpenRouter response:",
            rawText
        );

        let data;

        try {

            data =
                JSON.parse(rawText);

        } catch {

            return res.status(502).json({
                ok: false,
                error:
                    "OpenRouter returned invalid JSON.",
                providerStatus:
                    response.status,
                providerResponse:
                    rawText
            });

        }

        if (!response.ok) {

            return res
                .status(response.status)
                .json({

                    ok: false,

                    error:
                        data?.error?.message ||
                        data?.error ||
                        "OpenRouter request failed.",

                    providerStatus:
                        response.status,

                    providerError:
                        data?.error || null

                });

        }

        const answer =
            data?.choices?.[0]
                ?.message
                ?.content;

        if (!answer) {

            return res.status(502).json({
                ok: false,
                error:
                    "AI returned no message.",
                providerResponse:
                    data
            });

        }

        return res.json({
            ok: true,
            answer
        });

    } catch (error) {

        console.error(
            "❌ AI backend error:",
            error
        );

        return res.status(500).json({
            ok: false,
            error:
                error.message ||
                "Internal AI backend error."
        });

    }

});

app.listen(PORT, "0.0.0.0", () => {
    console.log("");

    console.log("👾 CodeOS Backend");

    console.log(
        `🚀 Backend running on port ${PORT}`
    );

    console.log(
        `🤖 AI endpoint: /api/ai`
    );

    console.log("");
});