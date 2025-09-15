const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------ MIDDLEWARE ------------------ //

// Allow requests from your frontend (GitHub Pages)
app.use(cors({
  origin: "https://morarasospeter.github.io" // <- update to your frontend URL
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

// ------------------ EMAIL SETUP ------------------ //
// ⚠️ Replace YOUR_APP_PASSWORD with your Gmail App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "morarasospeter01@gmail.com",
    pass: "SoSpeter911@!"  // use 16-digit app password, not normal Gmail password
  }
});

// Send email to tutor (you)
async function notifyTutor(newQuestion) {
  try {
    await transporter.sendMail({
      from: `"V@StHelp" <morarasospeter01@gmail.com>`,
      to: "morarasospeter01@gmail.com", // your own email
      subject: "📩 New Assignment Question Submitted",
      text: `A new question was submitted:\n\nName: ${newQuestion.name}\nEmail: ${newQuestion.email}\nQuestion: ${newQuestion.question}\n\nSubmitted on: ${newQuestion.date}`
    });
    console.log("✅ Tutor notified by email");
  } catch (err) {
    console.error("❌ Failed to notify tutor:", err.message);
  }
}

// Send confirmation email to student
async function notifyStudent(newQuestion) {
  try {
    await transporter.sendMail({
      from: `"V@StHelp" <morarasospeter01@gmail.com>`,
      to: newQuestion.email,
      subject: "✅ Your Question Has Been Received",
      text: `Hello ${newQuestion.name},\n\nWe have received your question:\n"${newQuestion.question}"\n\nOur tutor will review it and reply soon.\n\nThank you,\nV@StHelp Team`
    });
    console.log("✅ Student notified by email");
  } catch (err) {
    console.error("❌ Failed to notify student:", err.message);
  }
}

// ------------------ ROUTES ------------------ //

// Student submits question
app.post("/api/questions", async (req, res) => {
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

  // send email notifications
  await notifyTutor(newQuestion);
  await notifyStudent(newQuestion);

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
