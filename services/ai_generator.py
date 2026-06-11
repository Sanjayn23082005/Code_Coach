import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = "llama-3.3-70b-versatile"


def get_client():
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not set in your .env file.")
    return Groq(api_key=GROQ_API_KEY)


def build_learn_prompt(question, skill_level):
    return f"""You are CodeCoach, an expert programming tutor. A {skill_level} level student asks:
"{question}"

Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact structure:
{{
  "explanation": "A thorough, beginner-friendly explanation of the topic tailored to {skill_level} level. Use examples. At least 200 words.",
  "quiz": [
    {{
      "question": "Quiz question text",
      "options": {{
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      }},
      "correct": "A",
      "explanation": "Why this answer is correct"
    }},
    {{
      "question": "Quiz question text",
      "options": {{
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      }},
      "correct": "B",
      "explanation": "Why this answer is correct"
    }},
    {{
      "question": "Quiz question text",
      "options": {{
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      }},
      "correct": "C",
      "explanation": "Why this answer is correct"
    }},
    {{
      "question": "Quiz question text",
      "options": {{
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      }},
      "correct": "D",
      "explanation": "Why this answer is correct"
    }},
    {{
      "question": "Quiz question text",
      "options": {{
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      }},
      "correct": "A",
      "explanation": "Why this answer is correct"
    }}
  ],
  "assignment": {{
    "title": "Practice Assignment Title",
    "task": "Detailed task description for the student to complete",
    "expected_output": "What the output or result should look like",
    "learning_outcome": "What skill or concept this assignment reinforces"
  }},
  "next_topics": ["Topic 1", "Topic 2", "Topic 3"]
}}

Generate exactly 5 quiz questions. Each correct answer must be one of A, B, C, or D. Make quiz questions genuinely test understanding of the topic. All fields are required."""


def build_fix_prompt(code, skill_level):
    return f"""You are CodeCoach, an expert debugging assistant. A {skill_level} level student submitted this broken code:

```
{code}
```

Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact structure:
{{
  "corrected_code": "The fully corrected, working code here",
  "what_was_wrong": "Clear explanation of the bugs and issues found in the original code",
  "why_it_works": "Explanation of why the corrected code works correctly",
  "debug_challenge": {{
    "broken_code": "A new piece of broken code related to the same concept for the student to fix",
    "hint": "A helpful hint to guide the student toward the fix",
    "solution": "The correct fixed version of the broken_code",
    "fix_explanation": "Why this fix works"
  }}
}}

Be specific about each bug. Make the debug_challenge genuinely educational and related to the original topic."""


def safe_parse_json(raw_text):
    text = raw_text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.startswith("```")]
        text = "\n".join(lines).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON object
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass
    return None


def fallback_learn():
    return {
        "error": True,
        "message": "The AI returned an unexpected response. Please try rephrasing your question."
    }


def fallback_fix():
    return {
        "error": True,
        "message": "The AI returned an unexpected response. Please try again or simplify the code."
    }


def generate_learning_content(question, skill_level, mode):
    try:
        client = get_client()

        if mode == "fix":
            prompt = build_fix_prompt(question, skill_level)
        else:
            prompt = build_learn_prompt(question, skill_level)

        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are CodeCoach, a world-class programming tutor. Always respond with valid JSON only. No markdown, no code fences, no extra text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=3000,
        )

        raw = response.choices[0].message.content
        parsed = safe_parse_json(raw)

        if parsed is None:
            return fallback_learn() if mode == "learn" else fallback_fix()

        parsed["mode"] = mode
        return parsed

    except ValueError as e:
        return {"error": True, "message": str(e)}
    except Exception as e:
        err_msg = str(e)
        if "api_key" in err_msg.lower() or "authentication" in err_msg.lower():
            return {"error": True, "message": "Invalid or missing Groq API key. Check your .env file."}
        if "timeout" in err_msg.lower():
            return {"error": True, "message": "The request timed out. Please try again."}
        return {"error": True, "message": f"An error occurred: {err_msg}"}
