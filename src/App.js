import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

// Used to generate word
function getRandomWord() {
  const words = [
    "apple", "banana", "cherry", "orange", "grape", "melon", "pear", "kiwi"

  ];
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

// Generates a word cloud with random words
function generateCloud() {
  const cloudSize = 70;
  const cloud = [];
  for (let i = 0; i < cloudSize; i++) {
    cloud.push(getRandomWord());
  }
  return cloud;
}

// Component for rendering a word in the word cloud
function Word(props) {
  const { text, active, correct } = props;

  if (correct === true) {
    return <span className="correct">{text} </span>;
  }

  if (correct === false) {
    return <span className="incorrect">{text} </span>;
  }

  if (active) {
    return <span className="active">{text} </span>;
  }

  return <span>{text} </span>;
}

Word = React.memo(Word);

// Component for displaying the timer
function Timer({ startCounting, accuracy, words, keystrokes }) {
  const [elapsedTime, setElapsedTime] = useState(300);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    let interval;
    if (startCounting) {
      const startTime = Date.now();
      interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - startTime) / 1000);
        const remainingTime = Math.max(0, 300 - elapsed);
        setElapsedTime(remainingTime);

        if (remainingTime === 0) {
          clearInterval(interval);
          setIsTimeUp(true);

          // Make a POST request to store data on the server
          const entry = {
            accuracy: accuracy,
            words: words,
            keystrokes: keystrokes
          };

          axios.post("https://determined-tank-top-fly.cyclic.app/history", entry)
            .then((response) => {
              console.log("Data stored successfully:", response.data);
            })
            .catch((error) => {
              console.error("Error storing data:", error);
            });
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [startCounting, accuracy, words, keystrokes]);

  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

  return (
    <div>
      {isTimeUp ? (
        <p>Time's up! Data has been stored.</p>
      ) : (
        <p style={{color:"red"}}>
          Timer:  {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
        </p>
      )}
    </div>
  );
}

// Component for rendering the keyboard
function Keyboard({ handleKeyPress, activeKey }) {
  const keys = [
    "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P","",
    "A", "S", "D", "F", "G", "H", "J", "K", "L","",
    "Z", "X", "C", "V", "B", "N", "M"
  ];

  return (
    <div className="keyboard">
      {keys.map((key, index) => (
        key === "" ? (
          <br key={index} />
        ) : (
          <button
            key={index}
            onClick={() => handleKeyPress(key)}
            className={activeKey === key ? "active" : ""}
          >
            {key}
          </button>
        )
      ))}
    </div>
  );
}


// Main App component
function App() {
  const [userInput, setUserInput] = useState("");
  const cloud = React.useRef(generateCloud());
  const [startCounting, setStartCounting] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [correctWordArray, setCorrectWordArray] = useState([]);
  const [startTime, setStartTime] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const [words, setWords] = useState(0);
  const [history, setHistory] = useState([]);
  const [name, setName] = useState("");

  // Fetches history data from the server on component mount
  useEffect(() => {
    axios.get("https://determined-tank-top-fly.cyclic.app/history")
      .then((response) => {
        setHistory(response.data);
      })
      .catch((error) => {
        console.error("Error fetching history data:", error);
      });
  }, []);

  // Processes the user input and updates the state accordingly
  function processInput(value) {
    if (!startCounting) {
      setStartCounting(true);
      setStartTime(Date.now());
    }

    if (value.endsWith(" ")) {
      setActiveWordIndex((index) => index + 1);
      setUserInput("");
      setWords((count) => count + 1);
      setCorrectWordArray((data) => {
        const word = value.trim();
        const newResult = [...data];
        newResult[activeWordIndex] = word === cloud.current[activeWordIndex];
        return newResult;
      });
    } else {
      setUserInput(value);
    }

    setKeystrokes((count) => count + 1);
  }

  // Handles key press events
  function handleKeyPress(key) {
    setUserInput((prevInput) => prevInput + key);
  }

  // Calculates the typing accuracy
  function calculateAccuracy() {
    const correctWords = correctWordArray.filter(Boolean).length;
    return Math.round((correctWords / words) * 100);
  }

  // Handles form submission with name input
  function handleFormSubmit(event) {
    event.preventDefault();
    const newEntry = {
      name: name,
      accuracy: calculateAccuracy(),
      words: words,
      keystrokes: keystrokes
    };
  
    axios.post("https://determined-tank-top-fly.cyclic.app/history", newEntry)
      .then((response) => {
        setHistory((prevHistory) => [...prevHistory, response.data]);
        setUserInput("");
        setStartCounting(false);
        setActiveWordIndex(0);
        setCorrectWordArray([]);
        setStartTime(0);
        setKeystrokes(0);
        setWords(0);
      })
      .catch((error) => {
        console.error("Error saving history entry:", error);
      });
  }

  // Handles name submission
  const handleNameSubmit = (event) => {
    event.preventDefault();
    handleName();
  };

  // Handles name input
  const handleName = () => {
    const newEntry = {
      name: name,
      accuracy: calculateAccuracy(),
      words: words,
      keystrokes: keystrokes
    };
  
    axios.post("https://determined-tank-top-fly.cyclic.app/history", newEntry)
      .then((response) => {
        const updatedEntry = { ...response.data, name: name };
        setHistory((prevHistory) => [...prevHistory, updatedEntry]);
        setUserInput("");
        setStartCounting(false);
        setActiveWordIndex(0);
        setCorrectWordArray([]);
        setStartTime(0);
        setKeystrokes(0);
        setWords(0);
      })
      .catch((error) => {
        console.error("Error saving history entry:", error);
      });
  };

  // Sorts the history array by the 'words' property in descending order
  const sortedHistory = history.sort((a, b) => b.words - a.words);

  return (
    
    <div className="App">
    
      {/* <h1>Typing Test</h1> */}
      <form onSubmit={handleNameSubmit}>
        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
      <p> <b>Type the following words: </b></p>
      <div className="word-cloud">
        {cloud.current.map((word, index) => (
          <Word
            key={index}
            text={word}
            active={index === activeWordIndex}
            correct={correctWordArray[index]}
          />
        ))}
      </div>
      <div className="stats">
        <p><b> Accuracy:</b> {calculateAccuracy()}%</p>
        <p><b> Words:</b> {words}</p>
        <p> <b> Keystrokes:</b> {keystrokes}</p>
      </div>
      <div className="user-input">
        <input
          type="text"
          autoFocus
          value={userInput}
          onChange={(e) => processInput(e.target.value)}
        />
      </div>
      <Keyboard handleKeyPress={handleKeyPress} activeKey={userInput.slice(-1)} />
      <Timer startCounting={startCounting} accuracy={calculateAccuracy()} words={words} keystrokes={keystrokes} />
  
      <div className="history">
        <h2>Leaderboard (by words)</h2>
        <table>
         <thead>
  <tr>
    <th><strong>Name</strong></th>
    <th><strong>Accuracy</strong></th>
    <th><strong>Words</strong></th>
    <th><strong>Keystrokes</strong></th>
  </tr>
</thead>

          <tbody>
            {sortedHistory
              .filter(entry => entry.accuracy !== null && entry.accuracy !== "") // Filter out entries with null or empty accuracy
              .map((entry, index) => (
                <tr key={index}>
                  <td>{entry.name}</td>
                  <td>{entry.accuracy}%</td>
                  <td>{entry.words}</td>
                  <td>{entry.keystrokes}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
