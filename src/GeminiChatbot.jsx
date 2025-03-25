import React, { useState, useRef, useEffect } from 'react';

const GeminiChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const prebuiltQuestions = [
    "How do I send an item through your service?",
    "What are the delivery options available?",
    "How is the price calculated?",
    "What items can I send?",
    "How do I track my shipment?",
    "What are the delivery time estimates?",
    "How do I become a delivery partner?",
    "What are the payment methods accepted?",
    "What are the weight and size limits?",
    "How do I calculate shipping costs?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePrebuiltQuestion = (question) => {
    setInput(question);
  };

  const handleHome = () => {
    setMessages([]);
    setInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      console.log('Sending request to Gemini API...');
      
      // Create conversation history with system prompt for formatting
      const conversationHistory = [
        {
          role: 'user',
          parts: [{ 
            text: `You are a logistics assistant. Provide concise, well-formatted responses with bullet points or numbered lists when appropriate. Keep responses brief and to the point. Format your response as follows:
            - Use bullet points for lists
            - Use bold for important information
            - Keep paragraphs short (2-3 lines max)
            - Use emojis for better visual organization
            - Include relevant details only
            - Use clear headings when needed
            - Format numbers and prices clearly
            - Use line breaks for better readability`
          }]
        },
        ...messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: conversationHistory
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const text = data.candidates[0].content.parts[0].text;
        // Format the response text
        const formattedText = text
          .replace(/\n/g, '<br />') // Convert newlines to HTML line breaks
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **text** to bold
          .replace(/•/g, '• ') // Ensure proper bullet point spacing
          .replace(/(\d+\.)/g, '<br />$1 '); // Add line breaks before numbered lists

        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: formattedText,
          isFormatted: true 
        }]);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('Detailed error:', error);
      console.error('Error stack:', error.stack);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error. Please try again. Error: ${error.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-content">
          <h2>WeDeliver</h2>
          <button className="home-button" onClick={handleHome}>
            Home
          </button>
        </div>
      </div>
      
      <div className="chatbot-messages">
        {messages.length === 0 && (
          <div className="prebuilt-questions">
            <h3>Common Questions</h3>
            <div className="questions-grid">
              {prebuiltQuestions.map((question, index) => (
                <button
                  key={index}
                  className="question-button"
                  onClick={() => handlePrebuiltQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div 
              className="message-content"
              dangerouslySetInnerHTML={message.isFormatted ? { __html: message.content } : { __html: message.content }}
            />
          </div>
        ))}
        {isLoading && (
          <div className="message assistant-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chatbot-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>

      <style jsx>{`
        .chatbot-container {
          width: 100%;
          max-width: 400px;
          height: 500px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          position: relative;
          transform: translateY(0);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          overflow: hidden;
        }

        .chatbot-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(66, 133, 244, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(52, 168, 83, 0.1) 0%, transparent 50%),
            linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.1) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.1) 75%);
          background-size: 100% 100%, 100% 100%, 20px 20px, 20px 20px, 20px 20px, 20px 20px;
          background-position: 0 0, 0 0, 0 0, 0 10px, 0 -10px, 0 0;
          opacity: 0.5;
          pointer-events: none;
        }

        .chatbot-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, 
            rgba(66, 133, 244, 0.05),
            rgba(52, 168, 83, 0.05),
            rgba(251, 188, 5, 0.05),
            rgba(234, 67, 53, 0.05)
          );
          pointer-events: none;
        }

        .chatbot-header {
          padding: 15px;
          background: linear-gradient(135deg, #4285f4, #34a853);
          color: white;
          border-radius: 15px 15px 0 0;
          position: relative;
          overflow: hidden;
        }

        .chatbot-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
                      linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%);
          background-size: 20px 20px;
          opacity: 0.1;
          animation: shine 3s linear infinite;
        }

        @keyframes shine {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .chatbot-header h2 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 600;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .home-button {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
        }

        .home-button:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: transparent;
          position: relative;
          z-index: 1;
        }

        .prebuilt-questions {
          padding: 15px;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .prebuilt-questions h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .questions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .question-button {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 10px;
          text-align: left;
          cursor: pointer;
          font-size: 0.95rem;
          color: #495057;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .question-button:hover {
          background: rgba(255, 255, 255, 1);
          border-color: #4285f4;
          transform: translateX(5px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .message {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .user-message {
          align-items: flex-end;
        }

        .assistant-message {
          align-items: flex-start;
        }

        .message-content {
          max-width: 85%;
          padding: 12px 18px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: transform 0.2s ease;
          line-height: 1.5;
          border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .message-content:hover {
          transform: scale(1.02);
        }

        .message-content strong {
          color: #2c3e50;
          font-weight: 600;
        }

        .message-content br {
          margin-bottom: 8px;
        }

        .user-message .message-content {
          background: linear-gradient(135deg, #4285f4, #34a853);
          color: white;
          border: none;
        }

        .user-message .message-content strong {
          color: white;
        }

        .chatbot-input-form {
          padding: 20px;
          border-top: 1px solid rgba(0,0,0,0.1);
          display: flex;
          gap: 12px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 0 0 15px 15px;
          position: relative;
          z-index: 1;
        }

        input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid rgba(233, 236, 239, 0.8);
          border-radius: 10px;
          outline: none;
          transition: all 0.3s ease;
          font-size: 0.95rem;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
        }

        input:focus {
          border-color: #4285f4;
          box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
        }

        button {
          padding: 12px 24px;
          background: linear-gradient(135deg, #4285f4, #34a853);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .typing-indicator {
          display: flex;
          gap: 6px;
          padding: 12px 18px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 18px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #4285f4;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        /* Custom scrollbar */
        .chatbot-messages::-webkit-scrollbar {
          width: 8px;
        }

        .chatbot-messages::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .chatbot-messages::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
          transition: background 0.3s ease;
        }

        .chatbot-messages::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default GeminiChatbot; 