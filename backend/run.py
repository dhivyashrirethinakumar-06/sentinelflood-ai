import os
import sys
import uvicorn

# Append current working directory to path to ensure app can be resolved correctly
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "app"))

if __name__ == "__main__":
    print("Initializing Flood Sentinel API Backend on port 8000...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
