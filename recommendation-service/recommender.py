"""
Hybrid Recommendation Engine for SkillSwap Platform
Developer: Sanjeeviraj

Combines:
1. Reciprocal Skill Compatibility Matching (50% weight)
2. Content-Based Text Similarity using TF-IDF & Cosine Similarity (25% weight)
3. Availability Schedule Overlap (15% weight)
4. Preferred Format & Proficiency Synergy (10% weight)
"""

from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


PROFICIENCY_MAP = {
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3,
    "expert": 4
}


class HybridRecommender:
    def __init__(
        self,
        weight_skill: float = 0.50,
        weight_text: float = 0.25,
        weight_avail: float = 0.15,
        weight_pref: float = 0.10
    ):
        # Normalize weights so they strictly sum to 1.0
        total = weight_skill + weight_text + weight_avail + weight_pref
        if total <= 0:
            total = 1.0
        self.w_skill = weight_skill / total
        self.w_text = weight_text / total
        self.w_avail = weight_avail / total
        self.w_pref = weight_pref / total

    def _normalize_name(self, text: str) -> str:
        return text.strip().lower() if text else ""

    def _calculate_skill_compatibility(
        self, current_user: Dict[str, Any], candidate: Dict[str, Any]
    ) -> Tuple[float, List[str], List[str]]:
        """
        Evaluate bidirectional reciprocal exchange:
        1. Does candidate teach what current user wants to learn? (Direct learning match)
        2. Does current user teach what candidate wants to learn? (Reciprocal value match)
        """
        user_learn = {self._normalize_name(s.get("name", "")): s for s in current_user.get("learnSkills", [])}
        user_teach = {self._normalize_name(s.get("name", "")): s for s in current_user.get("teachSkills", [])}

        cand_teach = {self._normalize_name(s.get("name", "")): s for s in candidate.get("teachSkills", [])}
        cand_learn = {self._normalize_name(s.get("name", "")): s for s in candidate.get("learnSkills", [])}

        # Matched skills where Candidate can teach Current User
        direct_matches = []
        for learn_name, learn_item in user_learn.items():
            if not learn_name:
                continue
            if learn_name in cand_teach:
                direct_matches.append(cand_teach[learn_name].get("name", learn_name))
            else:
                # Substring/category match
                for teach_name, teach_item in cand_teach.items():
                    if learn_name in teach_name or teach_name in learn_name:
                        direct_matches.append(teach_item.get("name", teach_name))
                        break

        # Matched skills where Current User can teach Candidate
        reciprocal_matches = []
        for learn_name, learn_item in cand_learn.items():
            if not learn_name:
                continue
            if learn_name in user_teach:
                reciprocal_matches.append(user_teach[learn_name].get("name", learn_name))
            else:
                for teach_name, teach_item in user_teach.items():
                    if learn_name in teach_name or teach_name in learn_name:
                        reciprocal_matches.append(teach_item.get("name", teach_name))
                        break

        # Scoring logic:
        # A full mutual exchange (both can teach each other) is ideal (1.0).
        # A one-way match where candidate teaches what user wants is still high value (0.65 - 0.85).
        # A one-way match where user teaches candidate is moderately high (0.45 - 0.60).
        # Category overlap without exact skill match provides baseline (0.20).
        direct_matches = list(dict.fromkeys(direct_matches))
        reciprocal_matches = list(dict.fromkeys(reciprocal_matches))

        direct_count = len(direct_matches)
        reciprocal_count = len(reciprocal_matches)

        if direct_count > 0 and reciprocal_count > 0:
            score = 0.85 + min(0.15, (direct_count + reciprocal_count - 2) * 0.05)
        elif direct_count > 0:
            score = 0.60 + min(0.20, (direct_count - 1) * 0.10)
        elif reciprocal_count > 0:
            score = 0.45 + min(0.15, (reciprocal_count - 1) * 0.05)
        else:
            # Check category overlap
            user_categories = {s.get("category", "").lower() for s in (current_user.get("teachSkills", []) + current_user.get("learnSkills", [])) if s.get("category")}
            cand_categories = {s.get("category", "").lower() for s in (candidate.get("teachSkills", []) + candidate.get("learnSkills", [])) if s.get("category")}
            overlap_cats = user_categories.intersection(cand_categories)
            if overlap_cats:
                score = 0.25
            else:
                score = 0.05

        return min(score, 1.0), direct_matches, reciprocal_matches

    def _build_text_profile(self, user: Dict[str, Any]) -> str:
        """Create dense semantic representation of user bio, goals, and skill topics."""
        bio = user.get("bio") or ""
        teach_text = " ".join([
            f"{s.get('name', '')} {s.get('category', '')} {s.get('description', '')}"
            for s in user.get("teachSkills", [])
        ])
        learn_text = " ".join([
            f"{s.get('name', '')} {s.get('category', '')} {s.get('goals', '')}"
            for s in user.get("learnSkills", [])
        ])
        headline = user.get("headline") or ""
        return f"{headline} {bio} teaching {teach_text} learning {learn_text}".strip()

    def _calculate_text_similarities(
        self, current_user: Dict[str, Any], candidates: List[Dict[str, Any]]
    ) -> List[float]:
        """TF-IDF and Cosine Similarity vectorization across user profiles."""
        if not candidates:
            return []

        user_text = self._build_text_profile(current_user)
        cand_texts = [self._build_text_profile(c) for c in candidates]

        corpus = [user_text] + cand_texts

        # If all texts are empty, return fallback
        if not any(corpus):
            return [0.1] * len(candidates)

        try:
            vectorizer = TfidfVectorizer(
                stop_words="english",
                ngram_range=(1, 2),
                min_df=1,
                max_features=2000
            )
            tfidf_matrix = vectorizer.fit_transform(corpus)
            user_vector = tfidf_matrix[0:1]
            cand_vectors = tfidf_matrix[1:]
            similarities = cosine_similarity(user_vector, cand_vectors)[0]
            # Ensure safe bounds [0.0, 1.0]
            return [float(np.clip(val, 0.0, 1.0)) for val in similarities]
        except Exception:
            # Safe fallback if vectorizer encounters zero vocabulary
            return [0.1] * len(candidates)

    def _calculate_availability_compatibility(
        self, current_user: Dict[str, Any], candidate: Dict[str, Any]
    ) -> Tuple[float, List[str]]:
        """Compute Jaccard similarity and overlap of active time availability."""
        u_avail = set(current_user.get("availability") or [])
        c_avail = set(candidate.get("availability") or [])

        if not u_avail or not c_avail:
            # Neutral baseline if either profile has not populated availability
            return 0.5, ["Flexible / Not specified"]

        intersection = u_avail.intersection(c_avail)
        union = u_avail.union(c_avail)

        if not union:
            return 0.5, []

        jaccard = len(intersection) / len(union)
        # Give higher base score if there is at least one mutual slot
        score = 0.4 + (0.6 * jaccard) if intersection else 0.15
        return min(score, 1.0), list(intersection)

    def _calculate_preference_compatibility(
        self, current_user: Dict[str, Any], candidate: Dict[str, Any]
    ) -> Tuple[float, str]:
        """Calculate alignment in format (online vs in-person) and learning style."""
        u_format = (current_user.get("preferredFormat") or "both").lower()
        c_format = (candidate.get("preferredFormat") or "both").lower()

        if u_format == "both" or c_format == "both" or u_format == c_format:
            format_score = 1.0
            format_desc = "Matching format preferences"
        else:
            format_score = 0.3
            format_desc = f"Different formats: {u_format} vs {c_format}"

        return format_score, format_desc

    def rank_candidates(
        self, current_user: Dict[str, Any], candidates: List[Dict[str, Any]], top_k: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Rank all candidates using the normalized multi-signal hybrid scoring model.
        Returns detailed scores and dynamic explanation bullets.
        """
        if not candidates:
            return []

        # Vectorized TF-IDF text similarity calculation
        text_scores = self._calculate_text_similarities(current_user, candidates)

        results = []

        for idx, cand in enumerate(candidates):
            # Skip self if inadvertently included
            if str(cand.get("_id") or cand.get("id")) == str(current_user.get("_id") or current_user.get("id")):
                continue

            # Signal 1: Skill Compatibility (50%)
            skill_score, direct_matches, recip_matches = self._calculate_skill_compatibility(current_user, cand)

            # Signal 2: Content-Based Text Similarity (25%)
            text_score = text_scores[idx] if idx < len(text_scores) else 0.0

            # Signal 3: Availability Match (15%)
            avail_score, common_avail = self._calculate_availability_compatibility(current_user, cand)

            # Signal 4: Preference / Format Match (10%)
            pref_score, pref_desc = self._calculate_preference_compatibility(current_user, cand)

            # Calculate Weighted Hybrid Total Score (Normalized 0.0 to 1.0)
            composite_score = (
                (self.w_skill * skill_score) +
                (self.w_text * text_score) +
                (self.w_avail * avail_score) +
                (self.w_pref * pref_score)
            )

            # Convert to clean integer percentage 0-100
            match_percentage = int(round(composite_score * 100))
            match_percentage = max(10, min(99, match_percentage))

            # Build natural language explanation
            reasons = []
            if direct_matches and recip_matches:
                reasons.append(
                    f"Reciprocal match: They teach {', '.join(direct_matches[:2])} and want to learn {', '.join(recip_matches[:2])}"
                )
            elif direct_matches:
                reasons.append(f"They teach {', '.join(direct_matches[:2])} which matches your learning goals")
            elif recip_matches:
                reasons.append(f"They want to learn {', '.join(recip_matches[:2])} which you can teach")

            if text_score > 0.25:
                reasons.append("High semantic similarity in academic backgrounds and project interests")

            if common_avail and common_avail[0] != "Flexible / Not specified":
                reasons.append(f"Overlapping schedules: {', '.join(common_avail[:2])}")

            if not reasons:
                reasons.append("Shared skill categories and collaborative learning interests")

            results.append({
                "candidateId": str(cand.get("_id") or cand.get("id")),
                "candidate": cand,
                "compatibilityScore": match_percentage,
                "rawScore": round(composite_score, 4),
                "breakdown": {
                    "skillScore": int(round(skill_score * 100)),
                    "textScore": int(round(text_score * 100)),
                    "availabilityScore": int(round(avail_score * 100)),
                    "preferenceScore": int(round(pref_score * 100)),
                },
                "matchedSkills": {
                    "theyCanTeachYou": direct_matches,
                    "youCanTeachThem": recip_matches
                },
                "reasons": reasons,
                "summaryReason": reasons[0] if reasons else "Compatible learning profile"
            })

        # Rank descending by compatibilityScore
        results.sort(key=lambda x: x["rawScore"], reverse=True)
        return results[:top_k]
