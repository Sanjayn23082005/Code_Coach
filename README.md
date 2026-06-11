# CodeCoach 🧑‍💻

> AI-powered programming learning platform built with Python Flask and Groq API.

Learn concepts, fix bugs, practice quizzes, and improve your coding skills with AI.

---

## Features

- **Learn Topic Mode** — Get detailed explanations, 5-question quizzes with instant feedback, practice assignments, and topic recommendations
- **Fix My Code Mode** — Paste broken code, get corrected code with bug analysis and a debug challenge
- **Quiz Scoring** — Submit answers one by one, get instant feedback, calculate your final score
- **Dark Mode** — Toggle and persists via localStorage
- **Copy Code** — One-click copy for corrected code blocks
- **Responsive** — Works on desktop, tablet, and mobile

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Python 3.11, Flask 3.0              |
| AI         | Groq API (`llama-3.3-70b-versatile`)|
| Frontend   | HTML5, CSS3, Vanilla JS             |
| Font       | Google Fonts — Poppins              |

---

## Project Structure

```
codecoach/
├── app.py                    # Flask app & routes
├── services/
│   ├── __init__.py
│   └── ai_generator.py       # Groq API integration & prompt logic
├── templates/
│   └── index.html            # Main HTML template
├── static/
│   ├── style.css             # All styles
│   └── script.js             # All frontend logic
├── .env                      # API key 
├── .env.example              # template to share
├── requirements.txt
└── README.md
```

---

## Setup

### 1. Clone and enter the directory
```bash
cd codecoach
```

### 2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up your Groq API key
```bash
cp .env.example .env
# Edit .env and add your key:
# GROQ_API_KEY=your_actual_key_here
```

Get a free API key at [console.groq.com](https://console.groq.com).

### 5. Run the app
```bash
python app.py
```

Visit [http://localhost:5000](http://localhost:5000) in your browser.

---

## Usage

### Learn Topic
1. Select **Learn Topic** mode
2. Choose your skill level
3. Type something like: `Teach me Python list comprehensions`
4. Click **Generate Content**
5. Read the explanation, take the quiz, try the assignment

### Fix My Code
1. Select **Fix My Code** mode
2. Paste your broken code in the text area
3. Click **Generate Content**
4. Review the corrected code, bug analysis, and debug challenge

---

## Environment Variables

| Variable       | Description                        |
|----------------|------------------------------------|
| `GROQ_API_KEY` | Your Groq API key (required)       |

---

## License

MIT — free to use and modify.
