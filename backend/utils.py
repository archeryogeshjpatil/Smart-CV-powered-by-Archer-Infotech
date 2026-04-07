import os
from pypdf import PdfReader
from docx import Document
from google import genai
from dotenv import load_dotenv
import json
import re

load_dotenv()

# Configure Gemini
api_key = os.getenv('GEMINI_API_KEY')
client = None
if api_key and api_key != 'your_api_key_here':
    client = genai.Client(api_key=api_key)


def extract_text_from_pdf(file_path):
    reader = PdfReader(file_path)
    text = ''
    for page in reader.pages:
        text += page.extract_text()
    return text


def extract_text_from_docx(file_path):
    doc = Document(file_path)
    text = '\n'.join([para.text for para in doc.paragraphs])
    return text


def _call_gemini(prompt):
    """Call Gemini with model fallback and return raw text."""
    models_to_try = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']
    response = None
    last_err = None

    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            break
        except Exception as err:
            last_err = err
            if '429' in str(err) or 'RESOURCE_EXHAUSTED' in str(err):
                continue
            raise err

    if response is None:
        raise last_err
    return response.text


def analyze_with_gemini(text):
    if not client:
        return {
            'error': 'Gemini API Key not configured.',
            'details': {
                'name': 'Configure API Key',
                'college_name': 'Check .env file',
                'mobile_number': 'N/A',
                'email_id': 'N/A',
                'github_link': 'N/A',
                'other_links': [],
                'skills': []
            },
            'ats_score': 0,
            'analysis': {
                'defects': ['Missing Gemini API Key in backend/.env'],
                'recommendations': ['Add a valid GEMINI_API_KEY to start analysis.']
            }
        }

    prompt = """Analyze the following resume text and provide a structured JSON response.

1. Extract student details: name, college_name, mobile_number, email_id, github_link, other_social_links.
2. Extract ALL technical skills mentioned in the resume (programming languages, frameworks, tools, databases, libraries, platforms, methodologies). Be thorough — scan the entire resume including projects, experience, and skills sections.
3. Calculate an ATS Score (0-100) based on readability, impact, keyword optimization, and standard formatting.
4. Identify defects (faults) in the resume - be specific and actionable.
5. Provide recommendations to improve the ATS score - be specific and actionable.

Resume Text:
\"\"\"
""" + text + """
\"\"\"

IMPORTANT: Respond with ONLY valid JSON, no markdown formatting, no code blocks. Use this exact format:
{
  "details": {
    "name": "",
    "college_name": "",
    "mobile_number": "",
    "email_id": "",
    "github_link": "",
    "other_links": [],
    "skills": ["Python", "React", "MongoDB", "Docker"]
  },
  "ats_score": 0,
  "analysis": {
    "defects": ["defect1", "defect2"],
    "recommendations": ["recommendation1", "recommendation2"]
  }
}"""

    try:
        response_text = _call_gemini(prompt)
        parsed = _parse_json_response(response_text)
        if parsed is not None:
            return parsed
        return {'error': 'Failed to parse AI response as JSON', 'raw': response_text[:500]}
    except Exception as e:
        return {'error': 'Gemini API Error: ' + str(e)}


def _parse_json_response(text):
    """Try multiple strategies to extract valid JSON from AI response."""
    # Strategy 1: Direct parse
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass

    # Strategy 2: Extract from markdown code blocks
    code_block = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if code_block:
        try:
            return json.loads(code_block.group(1))
        except json.JSONDecodeError:
            pass

    # Strategy 3: Find outermost JSON object using brace matching
    start = text.find('{')
    if start != -1:
        depth = 0
        for i in range(start, len(text)):
            if text[i] == '{':
                depth += 1
            elif text[i] == '}':
                depth -= 1
                if depth == 0:
                    candidate = text[start:i + 1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        # Strategy 4: Fix common JSON issues
                        fixed = _fix_json(candidate)
                        try:
                            return json.loads(fixed)
                        except json.JSONDecodeError:
                            pass
                    break

    return None


def _fix_json(text):
    """Attempt to fix common JSON formatting issues from AI responses."""
    # Remove trailing commas before } or ]
    text = re.sub(r',\s*([}\]])', r'\1', text)
    # Remove control characters
    text = re.sub(r'[\x00-\x1f\x7f]', ' ', text)
    # Fix single quotes to double quotes (simple cases)
    # Only if there are no double quotes already
    if '"' not in text and "'" in text:
        text = text.replace("'", '"')
    return text


def get_clarifying_questions(resume_text, details, defects, recommendations):
    """Analyze defects/recommendations and generate questions for missing info."""
    if not client:
        return {'error': 'Gemini API Key not configured.'}

    prompt = """You are a resume improvement assistant. A user's resume has been analyzed and defects/recommendations were found.

Your job: Figure out what SPECIFIC information is MISSING from the resume that you need from the user to fix the defects and apply the recommendations. Only ask questions for information that CANNOT be inferred or made up — things only the user knows.

Resume details extracted:
""" + json.dumps(details, indent=2) + """

Defects found:
""" + json.dumps(defects, indent=2) + """

Recommendations:
""" + json.dumps(recommendations, indent=2) + """

Original resume text:
\"\"\"
""" + resume_text + """
\"\"\"

Generate a JSON response with questions the user must answer. Each question should have an id, the question text, a short placeholder hint, and the type (text, textarea, or url).

IMPORTANT: Respond with ONLY valid JSON, no markdown, no code blocks. Use this exact format:
{
  "questions": [
    {"id": "q1", "question": "What is your GitHub profile URL?", "placeholder": "https://github.com/username", "type": "url"},
    {"id": "q2", "question": "Can you describe a quantifiable achievement from your TCS internship?", "placeholder": "e.g., Improved API response time by 30%", "type": "textarea"}
  ]
}

Rules:
- Only ask 3-8 questions maximum
- Only ask for information NOT already in the resume
- Focus on what's needed to fix defects and apply recommendations
- If the resume already has everything needed, return {"questions": []}
- Be specific and helpful in your questions"""

    try:
        response_text = _call_gemini(prompt)
        parsed = _parse_json_response(response_text)
        if parsed is not None:
            return parsed
        return {'error': 'Failed to parse questions', 'raw': response_text[:500]}
    except Exception as e:
        return {'error': 'Gemini API Error: ' + str(e)}


def regenerate_resume(resume_text, details, defects, recommendations, user_answers):
    """Generate an improved resume using original data + user's answers to fill gaps."""
    if not client:
        return {'error': 'Gemini API Key not configured.'}

    prompt = """You are an expert resume writer and ATS optimization specialist. Your job is to generate an IMPROVED, ATS-optimized resume based on the original resume, its defects, recommendations, and additional information provided by the user.

Original resume text:
\"\"\"
""" + resume_text + """
\"\"\"

Extracted details:
""" + json.dumps(details, indent=2) + """

Defects that must be fixed:
""" + json.dumps(defects, indent=2) + """

Recommendations to apply:
""" + json.dumps(recommendations, indent=2) + """

Additional information from user (answers to clarifying questions):
""" + json.dumps(user_answers, indent=2) + """

Generate a complete, improved resume in structured JSON format that can be used to fill a CV template form. Fix ALL defects and apply ALL recommendations. Use strong action verbs, quantify achievements where possible, and ensure ATS-friendly formatting.

IMPORTANT: Respond with ONLY valid JSON, no markdown, no code blocks. Use this exact format:
{
  "name": "Full Name",
  "title": "Professional Title / Target Role",
  "email": "email@example.com",
  "phone": "1234567890",
  "location": "City, State",
  "github": "https://github.com/username",
  "linkedin": "https://linkedin.com/in/username",
  "summary": "A compelling 3-4 sentence professional summary highlighting key skills, experience, and career goals.",
  "skills": "Skill1, Skill2, Skill3, Skill4, Skill5",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Month Year - Month Year",
      "description": "Strong bullet-point style description with quantified achievements. Use action verbs."
    }
  ],
  "education": [
    {
      "degree": "Degree Name (e.g., B.Tech in Computer Science)",
      "institution": "College/University Name",
      "year": "Graduation Year"
    }
  ]
}

Rules:
- Use ALL information from the original resume AND the user's additional answers
- Fix every defect listed above
- Apply every recommendation listed above
- Use strong, professional action verbs (Developed, Implemented, Optimized, Led, etc.)
- Quantify achievements wherever possible
- Keep the summary concise but impactful (3-4 sentences)
- Skills should be comma-separated
- Experience descriptions should be achievement-focused, not task-focused
- Do NOT make up information that wasn't in the original resume or user's answers"""

    try:
        response_text = _call_gemini(prompt)
        parsed = _parse_json_response(response_text)
        if parsed is not None:
            return parsed
        return {'error': 'Failed to parse regenerated resume', 'raw': response_text[:500]}
    except Exception as e:
        return {'error': 'Gemini API Error: ' + str(e)}
