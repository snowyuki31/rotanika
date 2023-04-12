import type { NextApiRequest, NextApiResponse } from "next";
import { words } from "@/models/theme";

// 配列からランダムな要素を取得する関数
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Next.js API ハンドラー関数
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end(); // Method Not Allowed
  }

  const randomWord = getRandomElement(words);

  res.status(200).json({ theme: randomWord });
}
