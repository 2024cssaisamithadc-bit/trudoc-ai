import React, { useEffect, useRef, useState } from "react";
import "./ChatWidget.css";

const API_URL = "https://trudoc-ai-backend.onrender.com/api/chat";

export default function ChatWidget({ contractContext, contractKey }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm TruDoc AI. Ask me about contract terms, legal wording, documents, or any general doubt. How can I help?",
    },
  ]);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Automatically scroll to the latest chat message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isOpen]);

  // Reset the conversation when a new analysis becomes available.
  useEffect(() => {
    window.speechSynthesis?.cancel();

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsListening(false);
    setInput("");

    setMessages([
      {
        role: "assistant",
        content: contractContext
          ? `I've received the analysis for ${contractContext.filename}. You can ask me about its risk score, summary, or findings. My explanations are AI-generated and should be verified.`
          : "Hi! I'm TruDoc AI. Ask me about contracts or any general question.",
      },
    ]);
  }, [contractKey]);

  // Voice input using the browser's speech recognition.
  function startVoiceInput() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Try Chrome."
      );
      return;
    }

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  // Read the AI response aloud.
  function speakReply(text) {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  }

  // Send the user's question and current contract analysis to FastAPI.
  async function sendMessage(event) {
    event.preventDefault();

    const question = input.trim();

    if (!question || loading) return;

    const updatedMessages = [
      ...messages,
      { role: "user", content: question },
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.slice(-12),
          contract_context: contractContext,
        }),
      });

      
     
const data = await response.json();

if (!response.ok) {
  throw new Error(
    data?.detail || `Chat request failed: HTTP ${response.status}`
  );
}

if (!data || typeof data.reply !== "string" || !data.reply.trim()) {
  throw new Error(
    "The chatbot server returned an empty or invalid reply. Please check the backend."
  );
}

setMessages((previous) => [
  ...(previous || []),
  {
    role: "assistant",
    content: data.reply,
  },
]);

speakReply(data.reply);

    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't answer that right now. Please try again. " +
            (error.message || ""),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    if (loading) return;

    window.speechSynthesis?.cancel();

    setMessages([
      {
        role: "assistant",
        content: contractContext
          ? `Ask me about the analysis for ${contractContext.filename}.`
          : "Hi! I'm TruDoc AI. What would you like to know?",
      },
    ]);

    setInput("");
  }

  return (
    <div className="trudoc-chat-widget">
      {isOpen && (
        <section
          className="trudoc-chat-panel"
          aria-label="TruDoc AI chat"
        >
          <header className="trudoc-chat-header">
            <div className="trudoc-chat-brand">
              <div className="trudoc-chat-avatar">T</div>

              <div>
                <h2>TruDoc AI</h2>
                <p>
                  <span className="trudoc-chat-status" />
                  AI Assistant
                </p>
              </div>
            </div>

            <div className="trudoc-chat-actions">
              <button
                type="button"
                className="trudoc-chat-icon-button"
                onClick={startNewChat}
                disabled={loading}
                aria-label="Start a new chat"
                title="New chat"
              >
                ↻
              </button>

              <button
                type="button"
                className="trudoc-chat-icon-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                title="Close"
              >
                ×
              </button>
            </div>
          </header>

          <div
            className="trudoc-chat-messages"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  "trudoc-chat-row " +
                  (message.role === "user"
                    ? "trudoc-chat-user-row"
                    : "trudoc-chat-assistant-row")
                }
              >
                <div
                  className={
                    "trudoc-chat-bubble " +
                    (message.role === "user"
                      ? "trudoc-chat-user-bubble"
                      : "trudoc-chat-assistant-bubble") +
                    (message.isError ? " trudoc-chat-error" : "")
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="trudoc-chat-row trudoc-chat-assistant-row">
                <div className="trudoc-chat-bubble trudoc-chat-assistant-bubble">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            className="trudoc-chat-form"
            onSubmit={sendMessage}
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask TruDoc anything..."
              aria-label="Type your message"
              maxLength={3000}
              disabled={loading}
            />

            <button
              type="button"
              className="trudoc-chat-mic"
              onClick={startVoiceInput}
              disabled={loading}
              aria-label={
                isListening
                  ? "Stop microphone"
                  : "Speak your question"
              }
              title={
                isListening
                  ? "Stop listening"
                  : "Speak your question"
              }
            >
              {isListening ? "⏹" : "🎙️"}
            </button>

            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              title="Send message"
            >
              ↑
            </button>
          </form>

          <p className="trudoc-chat-disclaimer">
            AI can make mistakes. Verify important information.
          </p>
        </section>
      )}

      <button
        type="button"
        className="trudoc-chat-launcher"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={
          isOpen ? "Close TruDoc chat" : "Open TruDoc chat"
        }
        title="Ask TruDoc AI"
      >
        {isOpen ? "×" : "💬"}
      </button>
    </div>
  );
}
