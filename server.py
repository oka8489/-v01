"""報酬改定システム APIサーバー（FastAPI + SQLite）"""
import json
import sqlite3
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'houshu.db')

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''CREATE TABLE IF NOT EXISTS pharmacy_data (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL
    )''')
    conn.commit()
    return conn


def get_default_data():
    return {
        "version": "1.0",
        "pharmacyName": "",
        "r6": {},
        "r8": {},
        "annualReward": 0,
        "annualDrugCost": 0,
        "tasks": {},
        "requirements": {},
        "drugPriceRate": 4.02,
        "drugPriceEnabled": True,
    }


@app.get("/api/data")
def read_data():
    conn = get_db()
    row = conn.execute("SELECT data FROM pharmacy_data WHERE id = 1").fetchone()
    conn.close()
    if row:
        return json.loads(row[0])
    return get_default_data()


class DataPayload(BaseModel):
    data: Any


@app.put("/api/data")
def save_data(payload: DataPayload):
    conn = get_db()
    json_str = json.dumps(payload.data, ensure_ascii=False)
    conn.execute(
        "INSERT INTO pharmacy_data (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = ?",
        (json_str, json_str)
    )
    conn.commit()
    conn.close()
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    uvicorn.run(app, host="127.0.0.1", port=8000)
