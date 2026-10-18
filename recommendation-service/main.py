"""
FastAPI Microservice for SkillSwap Hybrid Recommendation Engine
Exposes high-performance recommendation endpoints to the Express.js backend.
Developer: Sanjeeviraj
"""

import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from recommender import HybridRecommender

app = FastAPI(
    title="SkillSwap Recommendation Microservice",
    description="Hybrid content-based and collaborative skill matching engine for SkillSwap",
    version="1.0.0"
)

# Enable CORS for local services
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WeightsConfig(BaseModel):
    skill_compatibility: Optional[float] = 0.50
    text_similarity: Optional[float] = 0.25
    availability: Optional[float] = 0.15
    preferences: Optional[float] = 0.10

class RecommendationRequest(BaseModel):
    current_user: Dict[str, Any] = Field(..., description="The requesting user profile")
    candidates: List[Dict[str, Any]] = Field(..., description="List of potential partner profiles")
    weights: Optional[WeightsConfig] = None
    top_k: Optional[int] = 15

class PairScoreRequest(BaseModel):
    user_a: Dict[str, Any] = Field(..., description="First user profile")
    user_b: Dict[str, Any] = Field(..., description="Second user profile")
    weights: Optional[WeightsConfig] = None


@app.get("/")
def root():
    return {
        "service": "SkillSwap Hybrid Recommendation API",
        "developer": "Sanjeeviraj",
        "status": "online",
        "endpoints": {
            "health": "/health",
            "recommend": "POST /recommend",
            "score_pair": "POST /score-pair"
        }
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "recommendation-service",
        "engine": "TF-IDF + Cosine Similarity + Reciprocal Heuristics",
        "version": "1.0.0"
    }


@app.post("/recommend")
def get_recommendations(payload: RecommendationRequest):
    try:
        w = payload.weights or WeightsConfig()
        recommender = HybridRecommender(
            weight_skill=w.skill_compatibility or 0.50,
            weight_text=w.text_similarity or 0.25,
            weight_avail=w.availability or 0.15,
            weight_pref=w.preferences or 0.10
        )

        ranked = recommender.rank_candidates(
            current_user=payload.current_user,
            candidates=payload.candidates,
            top_k=payload.top_k or 15
        )

        return {
            "success": True,
            "count": len(ranked),
            "recommendations": ranked,
            "weights_used": {
                "skill_compatibility": recommender.w_skill,
                "text_similarity": recommender.w_text,
                "availability": recommender.w_avail,
                "preferences": recommender.w_pref
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation computation error: {str(e)}"
        )


@app.post("/score-pair")
def score_pair(payload: PairScoreRequest):
    try:
        w = payload.weights or WeightsConfig()
        recommender = HybridRecommender(
            weight_skill=w.skill_compatibility or 0.50,
            weight_text=w.text_similarity or 0.25,
            weight_avail=w.availability or 0.15,
            weight_pref=w.preferences or 0.10
        )

        ranked = recommender.rank_candidates(
            current_user=payload.user_a,
            candidates=[payload.user_b],
            top_k=1
        )

        if not ranked:
            return {
                "success": True,
                "score": 50,
                "reasons": ["Compatible peer profile"]
            }

        top = ranked[0]
        return {
            "success": True,
            "score": top["compatibilityScore"],
            "breakdown": top["breakdown"],
            "reasons": top["reasons"],
            "matchedSkills": top["matchedSkills"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pair scoring error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)
