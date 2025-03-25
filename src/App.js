import React from 'react';
import GeminiChatbot from './GeminiChatbot';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>My Website</h1>
      </header>
      <main>
        <div className="chatbot-wrapper">
          <GeminiChatbot />
        </div>
      </main>
    </div>
  );
}

export default App;
