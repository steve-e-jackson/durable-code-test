#!/usr/bin/env python3
"""
Purpose: Simple FastAPI backend service for development and testing
Scope: HTTP API server providing basic endpoints for frontend integration testing
Overview: Lightweight FastAPI application that serves as a backend testing service for development environments.
    Provides essential REST endpoints including health checks, root status, and test data endpoints.
    Configured with CORS middleware for cross-origin requests and runs on configurable host and port.
    Designed for rapid prototyping, development testing, and continuous integration pipeline validation.
Dependencies: fastapi, uvicorn, fastapi.middleware.cors
"""

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
