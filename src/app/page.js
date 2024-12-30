"use client";

import { useState } from "react";

// Helper: Formats message content into paragraphs/lists
function formatMessageContent(content) {
  const lines = content.trim().split(/\r?\n/);

  return lines.map((line, idx) => {
    const isBullet = /^\s*[-*]\s+/.test(line);
    const isNumbered = /^\s*\d+\.\s+/.test(line);

    if (isBullet) {
      return (
        <li className="list-disc list-inside" key={idx}>
          {line.replace(/^[-*]\s+/, "")}
        </li>
      );
    } else if (isNumbered) {
      return (
        <li className="list-decimal list-inside" key={idx}>
          {line.replace(/^\d+\.\s+/, "")}
        </li>
      );
    } else {
      return <p key={idx}>{line}</p>;
    }
  });
}

export default function HomePage() {
  const [userMessage, setUserMessage] = useState("");
  const [conversation, setConversation] = useState([]);

  const handleSend = async () => {
    if (!userMessage.trim()) return;

    // Add user message immediately
    setConversation((prev) => [...prev, { role: "user", content: userMessage }]);

    const currentMessage = userMessage;
    setUserMessage("");

    // Call your backend /api/chat
    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const aiReply = data?.message || "No response from API";

      // Add AI response
      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: aiReply },
      ]);
    } catch (error) {
      console.error("Error fetching API:", error);
      // Optionally display an error in the conversation
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-200 text-black">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex justify-center">
        <div className="w-full max-w-xl flex flex-col space-y-4">
          {conversation.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={idx}
                className={`w-fit max-w-full p-4 rounded-lg whitespace-pre-wrap break-words
                  ${isUser ? "bg-blue-500 text-white self-end" : "bg-gray-300 text-gray-800 self-start"}
                `}
              >
                {formatMessageContent(msg.content)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Input (no footer element) */}
      <div className="p-4 flex justify-center items-center">
        <div className="w-full max-w-xl flex items-center space-x-2">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 rounded-full bg-gray-50 px-4 py-2
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 text-white px-6 py-2 rounded-full
                       hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
