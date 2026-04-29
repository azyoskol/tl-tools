from fastapi import FastAPI
from routes import teams, overview, health
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Team Dashboard API", version="1.0.0")

app.include_router(teams.router)
app.include_router(overview.router)
app.include_router(health.router)

@app.get("/")
def root():
    return {"message": "Team Dashboard API", "version": "1.0.0"}