import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  const fetchMessage = async () => {
    try {
      const response = await fetch("/api/message");

      const data = await response.json();

      setMessage(data.message);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px"
      }}
    >
      <h1>Frontend Running..... </h1>
      <h2>Testing CI/Cd</h2>

      <button onClick={fetchMessage}>
        Fetch Backend Message
      </button>

      <p>{message}</p>
    </div>
  );
}

export default App;