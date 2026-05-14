import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  const fetchMessage = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/message");

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
      <h1>Frontend Running </h1>

      <button onClick={fetchMessage}>
        Fetch Backend Message
      </button>

      <p>{message}</p>
    </div>
  );
}

export default App;