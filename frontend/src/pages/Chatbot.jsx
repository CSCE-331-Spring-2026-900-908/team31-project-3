import './Chatbot.css';
import { useState, useRef, useEffect } from 'react';
import { sendGemniMessage } from './ChatbotGemni';
import bobamascot from "../assets/bobamascot.png";
import sendIcon from "../assets/sendIcon.png";
import cancelIcon from "../assets/cancelIcon.png";

const Chatbot = () => {
    const [userPosts, setUserPosts] = useState([]);
    const [aiPosts, setAiPosts] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [isVisible, setVisible] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    
    // Auto-scroll to bottom of chat
    const messagesEndRef = useRef(null);
    const combinedMessages = [];

    for (let i = 0; i < userPosts.length; i++) {
        combinedMessages.push({ sender: "user", text: userPosts[i] });

        if (aiPosts[i] !== undefined) {
            combinedMessages.push({ sender: "ai", text: aiPosts[i] });
        }
    }

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [combinedMessages, isTyping, isVisible]);

    async function handleSend() {
        if (!userInput.trim()) return;

        const currentInput = userInput;
        setUserInput("");
        setUserPosts((prev) => [...prev, currentInput]);
        setIsTyping(true);

        try {
            const reply = await sendGemniMessage(currentInput);
            setAiPosts((prev) => [...prev, reply]);
        }
        catch (error) {
            if (error.message && (error.message.includes("429") || error.message.includes("quota"))) {
                setAiPosts((prev) => [
                    ...prev,
                    "The chatbot is temporarily busy because the Gemini API quota was exceeded. Please wait a bit and try again.",
                ]);
            } else {
                setAiPosts((prev) => [
                    ...prev,
                    "The chatbot encountered an error while connecting. Please try again later.",
                ]);
            }
        } finally {
            setIsTyping(false);
        }
    }

    function handleEnter(e) {
        if (e.key === "Enter") {
            handleSend();
        }
    }

    return (
        <div className="chatbot-root">
            {isVisible && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="chatbot-header-left">
                            <div className="chatbot-header-avatar">
                                <img src={bobamascot} alt="Boju avatar" />
                            </div>
                            <div className="chatbot-header-info">
                                <h2>Talk to Boju!</h2>
                                <p> Boba Assistant</p>
                            </div>
                        </div>
                        <button className="chatbot-close-btn" onClick={() => setVisible(false)} aria-label="Close">
                            <img src={cancelIcon} alt="Close chatbot" />
                        </button>
                    </div>

                    <div className="chatbot-messages">
                        {combinedMessages.length === 0 && (
                            <div className="chatbot-empty-state">
                                <img src={bobamascot} alt="Boju" className="empty-state-img" />
                                <h3>How can I help you today?</h3>
                                <p>Ask me about our menu, store hours, or any other questions!</p>
                            </div>
                        )}
                        {combinedMessages.map((msg, index) => (
                            <div key={index} className={`message-row ${msg.sender === "user" ? "user-row" : "ai-row"}`}>
                                {msg.sender === "ai" && (
                                    <div className="message-avatar">
                                        <img src={bobamascot} alt="Bot" />
                                    </div>
                                )}
                                <div className={`message-bubble ${msg.sender === "user" ? "user-bubble" : "ai-bubble"}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="message-row ai-row">
                                <div className="message-avatar">
                                    <img src={bobamascot} alt="Bot typing" />
                                </div>
                                <div className="message-bubble ai-bubble typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chatbot-input-area">
                        <div className="chatbot-input-wrapper">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Message Boju..."
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={handleEnter}
                            />
                            <button className="chatbot-send-btn" onClick={handleSend} disabled={!userInput.trim() || isTyping}>
                                <img src={sendIcon} alt="Send" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {!isVisible && (
                <button className="chatbot-toggle-btn" onClick={() => setVisible(true)} aria-label="Open chatbot">
                    <div className="toggle-btn-badge">1</div>
                    <img src={bobamascot} alt="Open chatbot" />
                </button>
            )}
        </div>
    );
};

export default Chatbot;
