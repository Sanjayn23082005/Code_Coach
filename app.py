from flask import Flask, render_template, request, jsonify
from services.ai_generator import generate_learning_content

app = Flask(__name__)


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()

    question = (data.get("question") or "").strip()
    skill_level = data.get("skill_level", "Beginner").strip()
    mode = data.get("mode", "learn").strip()

    if not question:
        return jsonify({"error": True, "message": "Please enter a question or paste some code first."}), 400

    if len(question) > 3000:
        return jsonify({"error": True, "message": "Input is too long. Please keep it under 3000 characters."}), 400

    valid_levels = ["Beginner", "Intermediate", "Advanced"]
    if skill_level not in valid_levels:
        skill_level = "Beginner"

    valid_modes = ["learn", "fix"]
    if mode not in valid_modes:
        mode = "learn"

    result = generate_learning_content(question, skill_level, mode)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
