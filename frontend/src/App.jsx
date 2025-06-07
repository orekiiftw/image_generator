import { useState } from "react";
import axios from "axios";
import { Sparkles } from "lucide-react"; // A nice icon for the title

// --- New Welcome Screen Component ---
// This component is shown only on the initial load.
const WelcomeScreen = ({ onExampleClick }) => {
  const examples = [
    "A synthwave style sunset over a retro-futuristic city",
    "A cute corgi wearing a tiny wizard hat",
    "Photorealistic image of a cup of coffee on a rainy day",
    "An astronaut playing a guitar on the moon, painted by Van Gogh",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-white p-4">
      <Sparkles className="w-16 h-16 mb-4 text-cyan-400" />
      <h1 className="text-4xl sm:text-5xl font-bold mb-2">Imagine AI</h1>
      <p className="text-lg text-gray-400 mb-10">
        What will you create today?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        {examples.map((text, index) => (
          <button
            key={index}
            onClick={() => onExampleClick(text)}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-left hover:bg-gray-700 transition-colors duration-200"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- This function handles clicks from the WelcomeScreen ---
  const handleExampleClick = (prompt) => {
    setInputQuery(prompt);
  };

  const handleSendQuery = async () => {
    if (!inputQuery.trim() || isLoading) {
      return;
    }

    const userMessage = {
      role: "user",
      content: inputQuery,
    };

    // Add user message and clear input
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const currentQuery = inputQuery; // Capture query before clearing
    setInputQuery("");
    setIsLoading(true);

    // Add placeholder for AI response
    const aiMessagePlaceholder = {
      role: "assistant",
      content: "Generating Image, please wait...",
    };
    setMessages((prevMessages) => [...prevMessages, aiMessagePlaceholder]);

    try {
      const requestData = {
        inputQuery: currentQuery, // Use the captured query
      };

      const apiResponse = await axios.post(
        "https://imagine.ojhadiwakar69.workers.dev/imagine",
        requestData
      );

      // Update the placeholder with the final image URL
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const lastMessageIndex = newMessages.length - 1;
        newMessages[lastMessageIndex].content = apiResponse.data.image_url;
        return newMessages;
      });
    } catch (error) {
      // Update the placeholder with the error message
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const lastMessageIndex = newMessages.length - 1;
        // Provide a more user-friendly error from the backend if possible
        const errorMessage =
          error.response?.data?.details ||
          error.message ||
          "Unknown error occurred";
        newMessages[lastMessageIndex].content = `An error occurred: ${errorMessage}`;
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendQuery();
    }
  };

  return (
    <>
      <div className="bg-black h-screen flex flex-col">
        {/* --- Main Display Area --- */}
        <div className="flex-grow p-2 sm:p-4 overflow-y-auto text-white" style={{ paddingBottom: "100px" }}>
          {/* --- CONDITIONAL RENDERING LOGIC --- */}
          {/* If there are no messages, show the WelcomeScreen. Otherwise, show the chat. */}
          {messages.length === 0 ? (
            <WelcomeScreen onExampleClick={handleExampleClick} />
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-3 flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`inline-block py-2 px-3 sm:py-3 sm:px-4 rounded-2xl border border-cyan-50 ${
                    msg.role === "user"
                      ? "bg-black font-bold break-words text-left max-w-[90vw] sm:max-w-[70%] mb-3 mt-3"
                      : "bg-black font-semibold ml-2 sm:ml-8 text-left break-words max-w-[90vw] sm:max-w-[70%]"
                  }`}
                  style={
                    msg.role === "assistant" && msg.content.startsWith("http")
                      ? {
                          padding: 0,
                          borderRadius: "1rem",
                          borderWidth: 2,
                          maxWidth: "90vw",
                          overflow: "hidden",
                        }
                      : {}
                  }
                >
                  {msg.role === "assistant" && msg.content.startsWith("http") ? (
                    <img
                      src={msg.content}
                      alt="Generated"
                      className="rounded-2xl max-w-[80vw] sm:max-w-full h-auto w-auto block"
                      style={{
                        display: "block",
                        borderRadius: "1rem",
                        maxHeight: 400,
                      }}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- Input Bar --- */}
        <div className="fixed bottom-0 left-0 right-0 bg-black py-3 flex justify-center z-10">
          <input
            type="text"
            placeholder={isLoading ? "Generating..." : "Enter your prompt...."}
            className="rounded-3xl text-white py-3 px-5 w-[95vw] sm:w-[60%] md:w-[60%] lg:w-[40%] border border-cyan-100 bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyPress={handleInputKeyPress}
            disabled={isLoading}
          />
          <button
            className="bg-cyan-400 rounded-2xl p-3 ml-2 sm:ml-6 text-black font-semibold disabled:opacity-50 hover:bg-cyan-300 transition-colors"
            onClick={handleSendQuery}
            disabled={isLoading || !inputQuery.trim()}
          >
            Imagine
          </button>
        </div>
      </div>
    </>
  );
}

export default App;