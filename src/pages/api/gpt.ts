import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const gameMasterSystemPrompt = `You're a game master of a word-estimating-game.
From now, you will be asked a question on the theme word.
Please pick a proper response among the following options.
- 正解 if the question refers the theme word.
- はい if the question is logically related to the theme word.
- いいえ if the question is logically unrelated to the theme word.
- どちらとも言えない if the question is ambiguous.
- わからない if you don't know the answer or the input is not a question.

You must output only one of the above options, without any additional explanation.
`;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end(); // Method Not Allowed
  }

  if (
    typeof req.body.text !== "string" ||
    req.body.text.length >= 50 ||
    req.body.text.length === 0 ||
    typeof req.body.theme !== "string" ||
    req.body.theme.length === 0
  ) {
    return res.status(400).json({ error: "Invalid text" }); // Bad Request
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set");
    return res.status(500).end(); // Internal Server Error
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              gameMasterSystemPrompt +
              "The theme word for this game is " +
              req.body.theme,
          },
          { role: "user", content: req.body.text },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    res
      .status(200)
      .json({ text: response.data.choices[0].message.content.trim() });
  } catch (error) {
    console.error("Error fetching GPT response:", error);
    res.status(500).end(); // Internal Server Error
  }
}

export default handler;
