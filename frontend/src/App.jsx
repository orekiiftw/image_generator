import { useState } from "react";
import axios from "axios";

function App() {
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendQuery = async () => {
    if (!inputQuery || isLoading) {
      return;
    }

    const userMessage = {
      role: "user",
      content: inputQuery,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputQuery("");
    setIsLoading(true);

    const aiMessagePlaceholder = {
      role: "assistant",
      content: "Generating Image, please wait...",
    };

    setMessages((prevMessages) => [...prevMessages, aiMessagePlaceholder]);

    try {
      const requestData = {
        inputQuery: inputQuery,
      };

      const apiResponse = await axios.post(
        "http://localhost:3000/imagine",
        requestData
      );
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1].content =
          apiResponse.data.image_url;
        return newMessages;
      });
    } catch (error) {
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1].content = `An error occurred: ${
          error.message || "Unknown error"
        }`;
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
        {/* Message Display Area */}
        <div
          className="flex-grow p-2 sm:p-4 overflow-y-auto text-white"
          style={{ paddingBottom: "100px" }}
        >
          {messages.map((msg, index) => (
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
          ))}
        </div>

        {/* Input Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-black py-3 flex justify-center z-10">
          <input
            type="text"
            placeholder={isLoading ? "Thinking..." : "Enter your prompt...."}
            className="rounded-3xl text-white py-3 px-5 w-[95vw] sm:w-[60%] md:w-[60%] lg:w-[40%] border border-cyan-100 bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyPress={handleInputKeyPress}
            disabled={isLoading}
          />
          <button
            className="bg-cyan-100 rounded-2xl p-3 ml-2 sm:ml-6 text-black font-semibold disabled:opacity-50"
            onClick={handleSendQuery}
            disabled={isLoading || !inputQuery.trim()}
          >
            imagine
          </button>
        </div>
      </div>
    </>
  );
}

export default App;