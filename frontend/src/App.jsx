import { useState, useEffect, useRef } from "react"; // Added useEffect and useRef
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
    <div className="flex flex-col items-center justify-center h-full text-center text-neutral-200 p-6">
      <Sparkles className="w-20 h-20 mb-6 text-cyan-500" />
      <h1 className="text-5xl sm:text-6xl font-bold mb-3 text-white">Imagine AI</h1>
      <p className="text-xl text-neutral-400 mb-12">
        What will you create today?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-5xl">
        {examples.map((text, index) => (
          <button
            key={index}
            onClick={() => onExampleClick(text)}
            className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 text-left hover:bg-neutral-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <p className="text-neutral-300 text-lg">{text}</p>
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
  const messagesEndRef = useRef(null); // Ref for scrolling to bottom

  // Scroll to bottom effect for new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // --- This function handles clicks from the WelcomeScreen ---
  const handleExampleClick = (prompt) => {
    setInputQuery(prompt);
    // Optionally, you could immediately submit the prompt or just populate the input
    // For now, just populating the input
  };

  const handleSendQuery = async () => {
    if (!inputQuery.trim() || isLoading) {
      return;
    }

    const userMessage = {
      role: "user",
      content: inputQuery,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const currentQuery = inputQuery;
    setInputQuery("");
    setIsLoading(true);

    const aiMessagePlaceholder = {
      role: "assistant",
      content: "🎨 Generating your masterpiece...", // More engaging loading text
    };
    setMessages((prevMessages) => [...prevMessages, aiMessagePlaceholder]);

    try {
      const requestData = {
        inputQuery: currentQuery,
      };

      const apiResponse = await axios.post(
        "https://imagine.ojhadiwakar69.workers.dev/imagine",
        requestData
      );

      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const lastMessageIndex = newMessages.length - 1;
        newMessages[lastMessageIndex].content = apiResponse.data.image_url;
        return newMessages;
      });
    } catch (error) {
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const lastMessageIndex = newMessages.length - 1;
        const errorMessage =
          error.response?.data?.details ||
          error.message ||
          "Oops! Something went wrong.";
        newMessages[lastMessageIndex].content = `⚠️ An error occurred: ${errorMessage}`;
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { // Send on Enter, allow Shift+Enter for newline
      e.preventDefault();
      handleSendQuery();
    }
  };

  return (
    <>
      <div className="bg-neutral-900 h-screen flex flex-col font-sans"> {/* Changed bg to darker neutral, added font */}
        {/* --- Main Display Area --- */}
        <div className="flex-grow p-4 sm:p-6 overflow-y-auto text-neutral-200" style={{ paddingBottom: "120px" }}> {/* Increased padding */}
          {messages.length === 0 ? (
            <WelcomeScreen onExampleClick={handleExampleClick} />
          ) : (
            <div className="space-y-6"> {/* Added space-y for consistent message spacing */}
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  } message-enter message-enter-active`} // Added animation classes
                >
                  <div
                    className={`inline-block py-3 px-5 rounded-2xl shadow-md transition-all duration-300 ease-out ${ /* Adjusted padding, added shadow, added transition */
                      msg.role === "user"
                        ? "bg-cyan-600 hover:bg-cyan-500 text-white break-words max-w-[85vw] sm:max-w-[65%] " // User message style
                        : "bg-neutral-700 hover:bg-neutral-600 text-neutral-100 break-words max-w-[85vw] sm:max-w-[65%]" // AI message style
                    }`}
                    style={
                      msg.role === "assistant" && msg.content.startsWith("http")
                        ? {
                            padding: 0, // Remove padding for image container
                            borderRadius: "1rem", // Ensure consistent border radius
                            overflow: "hidden", // Clip image to rounded corners
                            border: "2px solid #4A5568" // Neutral border for images
                          }
                        : {}
                    }
                  >
                    {msg.role === "assistant" && msg.content.startsWith("http") ? (
                      <img
                        src={msg.content}
                        alt="Generated AI Art" // More descriptive alt text
                        className="max-w-full h-auto block rounded-lg" // Ensure image is responsive and fits container
                        style={{
                          display: "block",
                           maxHeight: "60vh", // Limit image height
                        }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p> // Ensure text wraps and preserves whitespace
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} /> {/* Element to scroll to */}
        </div>

        {/* --- Input Bar --- */}
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/80 backdrop-blur-sm p-4 flex items-center justify-center z-10 border-t border-neutral-700 transition-all duration-300 ease-in-out"> {/* Frosted glass effect, border, added transition */}
          <textarea // Changed to textarea for multi-line input
            rows="1" // Start with one row
            placeholder={isLoading ? "Conjuring pixels..." : "Describe your vision..."} // More creative placeholder
            className="rounded-xl text-neutral-200 py-3 px-5 w-[90vw] sm:w-[70%] md:w-[60%] lg:w-[50%] bg-neutral-800 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none border border-neutral-700 transition-shadow duration-200 focus:shadow-cyan-500/30" // Added border, resize-none, focus shadow transition
            value={inputQuery}
            onChange={(e) => {
              setInputQuery(e.target.value);
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = (e.target.scrollHeight) + 'px';
            }}
            onKeyPress={handleInputKeyPress}
            disabled={isLoading}
            style={{ maxHeight: "150px", overflowY: "auto" }} // Limit max height
          />
          <button
            className="bg-cyan-500 hover:bg-cyan-400 rounded-xl p-3 ml-3 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center shadow-lg" // Adjusted colors, added shadow
            onClick={handleSendQuery}
            disabled={isLoading || !inputQuery.trim()}
            style={{ minWidth: "100px" }} // Ensure button has a decent width
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> // Simple spinner
            ) : (
              "Imagine"
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default App;