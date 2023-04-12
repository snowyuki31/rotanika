export type ChatMessage = {
  id: number;
  message: string;
  sender: Sender;
};

export type Sender = "AI" | "User";
