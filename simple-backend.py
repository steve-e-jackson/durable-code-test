from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from Backend API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/test")
def test_endpoint():
    return {"data": "Test response from backend"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
