"use client";

import { useState } from "react";

/**
 * Renders paragraphs, bold text, inline code, code blocks, and lists
 * from a pseudo-Markdown-like response.
 */
function formatMessageContent(content) {
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const chunks = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      chunks.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    chunks.push({ type: "code-block", value: match[1] });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    chunks.push({ type: "text", value: content.slice(lastIndex) });
  }

  return chunks.flatMap((chunk, i) => {
    if (chunk.type === "code-block") {
      return (
        <pre key={`codeblock-${i}`} className="bg-gray-800 text-gray-100 p-3 rounded-md my-2 text-sm overflow-auto">
          <code>{chunk.value.trim()}</code>
        </pre>
      );
    } else {
      const lines = chunk.value.split(/\r?\n/);

      return lines.map((line, idx) => {
        const trimmedLine = line.trim();
        const isBullet = /^\s*[-*]\s+/.test(trimmedLine);
        const isNumbered = /^\s*\d+\.\s+/.test(trimmedLine);

        if (isBullet) {
          const itemText = trimmedLine.replace(/^[-*]\s+/, "");
          return (
            <li className="list-disc list-inside" key={`bullet-${i}-${idx}`}>
              {renderInlineFormatting(itemText)}
            </li>
          );
        } else if (isNumbered) {
          const itemText = trimmedLine.replace(/^\d+\.\s+/, "");
          return (
            <li className="list-decimal list-inside" key={`numbered-${i}-${idx}`}>
              {renderInlineFormatting(itemText)}
            </li>
          );
        } else if (!trimmedLine) {
          return <br key={`linebreak-${i}-${idx}`} />;
        } else {
          return (
            <p key={`para-${i}-${idx}`} className="my-1">
              {renderInlineFormatting(line)}
            </p>
          );
        }
      });
    }
  });
}

/**
 * Handles inline code (`), bold (**), etc.
 */
function renderInlineFormatting(text) {
  const inlineRegex = /(\*\*[^*]+\*\*)|(`[^`]+`)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    const matchedStr = match[0];

    if (matchedStr.startsWith("**")) {
      const boldText = matchedStr.replace(/\*\*/g, "");
      parts.push({ type: "bold", value: boldText });
    } else if (matchedStr.startsWith("`")) {
      const codeText = matchedStr.replace(/`/g, "");
      parts.push({ type: "inline-code", value: codeText });
    }

    lastIndex = inlineRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts.map((part, i) => {
    switch (part.type) {
      case "bold":
        return (
          <strong key={`bold-${i}`} className="font-semibold">
            {part.value}
          </strong>
        );
      case "inline-code":
        return (
          <code key={`code-${i}`} className="bg-gray-300 px-1 rounded">
            {part.value}
          </code>
        );
      default:
        return <span key={`text-${i}`}>{part.value}</span>;
    }
  });
}

export default function HomePage() {
  const [userMessage, setUserMessage] = useState("");
  const [conversation, setConversation] = useState([]);

  const handleSend = async () => {
    if (!userMessage.trim()) return;

    setConversation((prev) => [...prev, { role: "user", content: userMessage }]);
    const currentMessage = userMessage;
    setUserMessage("");

    try {
      const response = await fetch("https://caretaker-ai.vercel.app/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const aiReply = data?.message || "No response from API";

      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: aiReply },
      ]);
    } catch (error) {
      console.error("Error fetching API:", error);
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
                  ${
                    isUser
                      ? "bg-blue-500 text-white self-end"
                      : "bg-gray-300 text-gray-800 self-start"
                  }
                `}
              >
                {formatMessageContent(msg.content)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Chat Input at Bottom */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-gray-200 flex justify-center items-center">
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
