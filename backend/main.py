from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Smart CV powered by Archer Infotech")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "success", "message": "Smart CV API is running"}

@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    # Logic for extraction and ATS scoring will go here
    return {"filename": file.filename, "status": "processing"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
