const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------ MIDDLEWARE ------------------ //

// Allow requests from your frontend
app.use(cors({
  origin: "https://morarasospeter.github.io" // replace with your GitHub Pages URL
}));

app.use(express.json());

// ------------------ FILE PATHS ------------------ //

const QUESTIONS_FILE = path.join(__dirname, "questions.json");

// Tutor login details
const tutorUser = {
  username: "tutor",
  password: "secret123"
};

// ------------------ HELPERS ------------------ //

// Ensure questions.json exists
function loadQuestions() {
  if (!fs.existsSync(QUESTIONS_FILE)) {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(QUESTIONS_FILE));
}

function saveQuestions(questions) {
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
}

// ------------------ ROUTES ------------------ //

// Student submits question
app.post("/api/questions", (req, res) => {
  const { name, email, question } = req.body;

  if (!name || !email || !question) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const questions = loadQuestions();
  const newQuestion = {
    id: Date.now(),
    name,
    email,
    question,
    answer: null,
    date: new Date().toISOString()
  };

  questions.push(newQuestion);
  saveQuestions(questions);

  res.json({ success: true, message: "Question submitted successfully" });
});

// Tutor login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === tutorUser.username && password === tutorUser.password) {
    return res.json({ success: true, message: "Login successful" });
  }

  res.status(401).json({ success: false, message: "Invalid login" });
});

// Tutor gets all questions
app.get("/api/questions", (req, res) => {
  const questions = loadQuestions();
  res.json(questions);
});

// Tutor answers a question
app.post("/api/questions/:id/answer", (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  let questions = loadQuestions();
  let question = questions.find(q => q.id == id);

  if (!question) {
    return res.status(404).json({ success: false, message: "Question not found" });
  }

  question.answer = answer;
  saveQuestions(questions);

  res.json({ success: true, message: "Answer saved" });
});

// ------------------ START SERVER ------------------ //
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
