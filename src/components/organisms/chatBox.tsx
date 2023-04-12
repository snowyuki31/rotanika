import React, { useEffect, useReducer, useState, useRef } from "react";
import axios from "axios";
import { ChatMessage, Sender } from "@/models/chatMessage";

type Props = {};

const MaxGameTurn = 10;
const defaultMessages = [
  {
    id: 0,
    message: "Welcome to Rokinator!",
    sender: "AI" as Sender,
  },
  {
    id: 1,
    message: `これからゲームを始めます。${MaxGameTurn}個までの質問で、お題の単語を当ててみてください！`,
    sender: "AI" as Sender,
  },
  {
    id: 2,
    message: "お題を生成中...",
    sender: "AI" as Sender,
  },
];

enum ActionType {
  ADD_MESSAGE = "ADD_MESSAGE",
  ADD_USER_TURN = "ADD_USER_TURN",
  SET_ODAI = "SET_ODAI",
  SET_GAME_FINISHED = "SET_GAME_FINISHED",
}

type Action =
  | { type: ActionType.ADD_MESSAGE; message: ChatMessage }
  | { type: ActionType.SET_ODAI; theme: string }
  | { type: ActionType.SET_GAME_FINISHED; finished: boolean }
  | { type: ActionType.ADD_USER_TURN; userTurn: number };

type State = {
  theme: string;
  messages: ChatMessage[];
  userTurn: number;
  isGameFinished: boolean;
};

const initialState: State = {
  theme: "",
  messages: [],
  userTurn: 0,
  isGameFinished: false,
};

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case ActionType.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.message],
      };
    case ActionType.ADD_USER_TURN:
      return {
        ...state,
        userTurn: state.userTurn + 1,
      };
    case ActionType.SET_ODAI:
      return {
        ...state,
        theme: action.theme,
      };
    case ActionType.SET_GAME_FINISHED:
      return {
        ...state,
        isGameFinished: action.finished,
      };
    default:
      return state;
  }
};

const ChatBox: React.FC<Props> = () => {
  const [inputValue, setInputValue] = useState("");
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);

  const updateGameStatus = (isCorrect: boolean, userTurn: number) => {
    if (isCorrect || userTurn >= MaxGameTurn) {
      dispatch({ type: ActionType.SET_GAME_FINISHED, finished: true });
    }
  };

  const addMessage = (message: ChatMessage) => {
    dispatch({ type: ActionType.ADD_MESSAGE, message: message });
  };

  const addUserTurn = (userTurn: number) => {
    dispatch({ type: ActionType.ADD_USER_TURN, userTurn: userTurn });
  };

  const setTheme = (theme: string) => {
    dispatch({ type: ActionType.SET_ODAI, theme: theme });
  };

  const generateOdai = async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    addMessage(defaultMessages[0]);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    addMessage(defaultMessages[1]);
    await new Promise((resolve) => setTimeout(resolve, 750));
    addMessage(defaultMessages[2]);

    try {
      const response = await axios.get("/api/theme");
      const theme = response.data.theme;
      const aiMessage: ChatMessage = {
        id: state.messages.length + 1,
        message: "準備完了！それではゲームスタート！",
        sender: "AI",
      };
      setTheme(theme);
      addMessage(aiMessage);
    } catch (error) {
      console.error("Error fetching AI response:", error);
    } finally {
      setIsWaitingResponse(false);
    }
  };
  useEffect(() => {
    generateOdai();
  }, []);

  const renderMessage = (message: ChatMessage, index: number) => {
    const isAI = message.sender === "AI";
    const chatBoxStyle = isAI
      ? "bg-blue-400 text-white"
      : "bg-gray-200 text-black";

    return (
      <div
        key={`message-${index}`}
        className={`my-2 py-2 px-4 rounded ${chatBoxStyle} ${
          isAI ? "text-left" : "text-right"
        } `}
      >
        <div>{message.message}</div>
      </div>
    );
  };

  const sendMessage = async () => {
    if (
      isWaitingResponse ||
      inputValue.trim() === "" ||
      inputValue.length > 50
    ) {
      setInputValue("");
      return;
    }

    const userMessage: ChatMessage = {
      id: state.messages.length + 1,
      message: inputValue,
      sender: "User",
    };

    addMessage(userMessage);
    addUserTurn(state.userTurn);
    setInputValue("");

    try {
      setIsWaitingResponse(true);

      const response = await axios.post("/api/gpt", {
        text: inputValue,
        theme: state.theme,
      });
      const aiText = response.data.text;

      if (aiText !== "正解") {
        addMessage({
          id: state.messages.length + 1,
          message: aiText,
          sender: "AI",
        });
      }

      updateGameStatus(aiText === "正解", state.userTurn);
      if (aiText === "正解" || state.userTurn + 1 >= MaxGameTurn) {
        const finalMessage =
          aiText === "正解"
            ? `正解！おめでとう！答えは${state.theme}でした！`
            : `残念！ゲームオーバー！答えは${state.theme}でした！`;
        addMessage({
          id: state.messages.length + 1,
          message: finalMessage,
          sender: "AI",
        });
        return;
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
    }
    setIsWaitingResponse(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isWaitingResponse || e.nativeEvent.isComposing || e.key !== "Enter")
      return;
    sendMessage();
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  return (
    <div className="w-full h-7/8 flex flex-col py-12">
      <div className="overflow-y-scroll">
        <div className="w-full divide-y divide-gray-300 flex-grow">
          {state.messages.map((message, index) =>
            renderMessage(message, index)
          )}
          <div ref={messagesEndRef}></div>
        </div>
      </div>
      <div
        className="w-full flex-none pb-6 pt-6 bg-black"
        style={{ position: "sticky", bottom: 0 }}
      >
        <div className="flex items-center">
          <input
            type="text"
            className="w-full mr-2 borde p-2 h-10 rounded text-black disabled:bg-gray-500 disabled:opacity-50"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={50}
            disabled={isWaitingResponse || state.isGameFinished}
            placeholder="それは食べ物ですか？"
          />
          <button
            className="bg-blue-500 text-white p-2 rounded h-10 disabled:opacity-50"
            onClick={() => sendMessage()}
            disabled={isWaitingResponse || state.isGameFinished}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
