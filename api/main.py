from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import teams, overview, health, dashboard, webhook
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Team Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(teams.router)
app.include_router(overview.router)
app.include_router(health.router)
app.include_router(dashboard.router)
app.include_router(webhook.router)

@app.get("/")
def root():
    return {"message": "Team Dashboard API", "version": "1.0.0"}