import sqlite3
import os
import uuid
from datetime import datetime
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(__file__), 'smartcv.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS resume_history (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            file_name TEXT NOT NULL,
            ats_score INTEGER DEFAULT 0,
            details TEXT DEFAULT '{}',
            analysis TEXT DEFAULT '{"defects":[],"recommendations":[]}',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_resume_user ON resume_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_resume_date ON resume_history(created_at DESC);
    ''')
    conn.commit()
    conn.close()


# --- User operations ---

def create_user(email: str, password_hash: str) -> dict:
    conn = get_db()
    user_id = str(uuid.uuid4())
    try:
        conn.execute(
            'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
            (user_id, email, password_hash)
        )
        conn.commit()
        return {'id': user_id, 'email': email}
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def get_user_by_email(email: str) -> Optional[dict]:
    conn = get_db()
    row = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


# --- Resume history operations ---

def save_resume_history(user_id: str, file_name: str, ats_score: int, details: str, analysis: str) -> dict:
    conn = get_db()
    entry_id = str(uuid.uuid4())
    conn.execute(
        'INSERT INTO resume_history (id, user_id, file_name, ats_score, details, analysis) VALUES (?, ?, ?, ?, ?, ?)',
        (entry_id, user_id, file_name, ats_score, details, analysis)
    )
    conn.commit()
    conn.close()
    return {'id': entry_id}


def get_resume_history(user_id: str) -> list:
    conn = get_db()
    rows = conn.execute(
        'SELECT * FROM resume_history WHERE user_id = ? ORDER BY created_at DESC',
        (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def delete_resume_history(entry_id: str, user_id: str) -> bool:
    conn = get_db()
    cursor = conn.execute(
        'DELETE FROM resume_history WHERE id = ? AND user_id = ?',
        (entry_id, user_id)
    )
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted
