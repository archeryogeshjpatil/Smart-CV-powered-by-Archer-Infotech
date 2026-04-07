from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import shutil
import os
import json

from utils import extract_text_from_pdf, extract_text_from_docx, analyze_with_gemini, get_clarifying_questions, regenerate_resume
from database import init_db, create_user, get_user_by_email, save_resume_history, get_resume_history, delete_resume_history
from auth import hash_password, verify_password, create_token, verify_token

app = FastAPI(title='Smart CV powered by Archer Infotech')

# Initialize database on startup
init_db()

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://localhost:3001'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

TEMP_DIR = 'temp_uploads'
os.makedirs(TEMP_DIR, exist_ok=True)


# --- Helpers ---

def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    if not authorization or not authorization.startswith('Bearer '):
        return None
    token = authorization.split(' ', 1)[1]
    return verify_token(token)


# --- Auth Models ---

class AuthRequest(BaseModel):
    email: str
    password: str


# --- Routes ---

@app.get('/')
def read_root():
    return {'status': 'success', 'message': 'Smart CV API is running'}


@app.post('/auth/signup')
def signup(body: AuthRequest):
    if not body.email or not body.password:
        raise HTTPException(status_code=400, detail='Email and password are required.')

    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail='Password must be at least 6 characters.')

    pw_hash = hash_password(body.password)
    user = create_user(body.email.lower().strip(), pw_hash)

    if not user:
        raise HTTPException(status_code=409, detail='An account with this email already exists.')

    token = create_token(user['id'], user['email'])
    return {'token': token, 'user': {'id': user['id'], 'email': user['email']}}


@app.post('/auth/login')
def login(body: AuthRequest):
    user = get_user_by_email(body.email.lower().strip())
    if not user:
        raise HTTPException(status_code=401, detail='Invalid email or password.')

    if not verify_password(body.password, user['password_hash']):
        raise HTTPException(status_code=401, detail='Invalid email or password.')

    token = create_token(user['id'], user['email'])
    return {'token': token, 'user': {'id': user['id'], 'email': user['email']}}


@app.get('/auth/me')
def get_me(authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail='Not authenticated.')
    return {'user': {'id': user['user_id'], 'email': user['email']}}


@app.post('/analyze')
async def analyze_resume(file: UploadFile = File(...)):
    file_path = os.path.join(TEMP_DIR, file.filename)

    with open(file_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file_path)
        elif file.filename.lower().endswith('.docx'):
            text = extract_text_from_docx(file_path)
        else:
            raise HTTPException(status_code=400, detail='Unsupported file format. Use PDF or DOCX.')

        analysis_result = analyze_with_gemini(text)
        # Include raw text for regeneration
        analysis_result['_resume_text'] = text
        return analysis_result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@app.post('/history')
def save_history(
    file_name: str,
    ats_score: int,
    details: str,
    analysis: str,
    authorization: Optional[str] = Header(None)
):
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail='Not authenticated.')

    entry = save_resume_history(user['user_id'], file_name, ats_score, details, analysis)
    return entry


class SaveHistoryBody(BaseModel):
    file_name: str
    ats_score: int
    details: dict
    analysis: dict


@app.post('/history/save')
def save_history_json(body: SaveHistoryBody, authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail='Not authenticated.')

    entry = save_resume_history(
        user['user_id'],
        body.file_name,
        body.ats_score,
        json.dumps(body.details),
        json.dumps(body.analysis)
    )
    return entry


@app.get('/history')
def list_history(authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail='Not authenticated.')

    entries = get_resume_history(user['user_id'])
    # Parse JSON strings back to dicts
    for entry in entries:
        try:
            entry['details'] = json.loads(entry['details']) if isinstance(entry['details'], str) else entry['details']
            entry['analysis'] = json.loads(entry['analysis']) if isinstance(entry['analysis'], str) else entry['analysis']
        except (json.JSONDecodeError, TypeError):
            pass
    return entries


@app.delete('/history/{entry_id}')
def remove_history(entry_id: str, authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail='Not authenticated.')

    deleted = delete_resume_history(entry_id, user['user_id'])
    if not deleted:
        raise HTTPException(status_code=404, detail='Entry not found.')
    return {'status': 'deleted'}


class ClarifyRequest(BaseModel):
    resume_text: str
    details: dict
    defects: list
    recommendations: list


class RegenerateRequest(BaseModel):
    resume_text: str
    details: dict
    defects: list
    recommendations: list
    user_answers: dict


@app.post('/regenerate/questions')
def get_questions(body: ClarifyRequest, authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail='Login required to regenerate resume.')

    result = get_clarifying_questions(body.resume_text, body.details, body.defects, body.recommendations)
    if 'error' in result:
        raise HTTPException(status_code=500, detail=result['error'])
    return result


@app.post('/regenerate')
def regenerate(body: RegenerateRequest, authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail='Login required to regenerate resume.')

    result = regenerate_resume(body.resume_text, body.details, body.defects, body.recommendations, body.user_answers)
    if 'error' in result:
        raise HTTPException(status_code=500, detail=result['error'])
    return result


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
