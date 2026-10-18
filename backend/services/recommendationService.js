/**
 * SkillSwap Recommendation Service Client
 * Developer: Sanjeeviraj
 * 
 * Communicates with the Python FastAPI hybrid recommendation microservice.
 * Includes timeout handling and a fallback heuristic recommendation engine
 * to guarantee 100% uptime even if the Python service is temporarily stopped.
 */

const RECOMMENDER_URL = process.env.RECOMMENDER_SERVICE_URL || 'http://127.0.0.1:8000';
const TIMEOUT_MS = 4000;

// Local fallback engine in pure JS
function fallbackRankCandidates(currentUser, candidates, topK = 15) {
  const userTeachNames = (currentUser.teachSkills || []).map(s => (s.name || '').toLowerCase());
  const userLearnNames = (currentUser.learnSkills || []).map(s => (s.name || '').toLowerCase());
  const userAvail = new Set(currentUser.availability || []);

  const results = candidates.map(cand => {
    const candTeachNames = (cand.teachSkills || []).map(s => (s.name || '').toLowerCase());
    const candLearnNames = (cand.learnSkills || []).map(s => (s.name || '').toLowerCase());
    const candAvail = new Set(cand.availability || []);

    // 1. Skill Match
    const theyCanTeachYou = [];
    userLearnNames.forEach(lName => {
      candTeachNames.forEach(tName => {
        if (lName && (lName.includes(tName) || tName.includes(lName))) {
          theyCanTeachYou.push(tName);
        }
      });
    });

    const youCanTeachThem = [];
    candLearnNames.forEach(lName => {
      userTeachNames.forEach(tName => {
        if (lName && (lName.includes(tName) || tName.includes(lName))) {
          youCanTeachThem.push(tName);
        }
      });
    });

    let skillScore = 0.2;
    if (theyCanTeachYou.length > 0 && youCanTeachThem.length > 0) {
      skillScore = 0.90;
    } else if (theyCanTeachYou.length > 0) {
      skillScore = 0.70;
    } else if (youCanTeachThem.length > 0) {
      skillScore = 0.50;
    }

    // 2. Availability overlap
    let availOverlap = 0;
    candAvail.forEach(slot => {
      if (userAvail.has(slot)) availOverlap++;
    });
    const availScore = userAvail.size > 0 && candAvail.size > 0
      ? Math.min(1.0, 0.4 + (availOverlap / Math.max(1, userAvail.size)) * 0.6)
      : 0.5;

    // 3. Format preference
    const uFormat = (currentUser.preferredFormat || 'both').toLowerCase();
    const cFormat = (cand.preferredFormat || 'both').toLowerCase();
    const prefScore = (uFormat === 'both' || cFormat === 'both' || uFormat === cFormat) ? 1.0 : 0.4;

    // 4. Baseline text similarity placeholder
    const textScore = 0.45;

    // Weighted composite score (50% skill, 25% text, 15% avail, 10% pref)
    const composite = (0.50 * skillScore) + (0.25 * textScore) + (0.15 * availScore) + (0.10 * prefScore);
    const scorePct = Math.min(99, Math.max(15, Math.round(composite * 100)));

    const reasons = [];
    if (theyCanTeachYou.length > 0 && youCanTeachThem.length > 0) {
      reasons.push(`Reciprocal match: They teach ${theyCanTeachYou.slice(0, 2).join(', ')} and want to learn ${youCanTeachThem.slice(0, 2).join(', ')}`);
    } else if (theyCanTeachYou.length > 0) {
      reasons.push(`They teach ${theyCanTeachYou.slice(0, 2).join(', ')} which matches your learning goals`);
    } else if (youCanTeachThem.length > 0) {
      reasons.push(`They want to learn ${youCanTeachThem.slice(0, 2).join(', ')} which you can teach`);
    } else {
      reasons.push('Shared learning domain and collaborative study preferences');
    }

    if (availOverlap > 0) {
      reasons.push('Compatible learning schedule');
    }

    return {
      candidateId: cand._id.toString(),
      candidate: cand,
      compatibilityScore: scorePct,
      rawScore: composite,
      breakdown: {
        skillScore: Math.round(skillScore * 100),
        textScore: Math.round(textScore * 100),
        availabilityScore: Math.round(availScore * 100),
        preferenceScore: Math.round(prefScore * 100)
      },
      matchedSkills: {
        theyCanTeachYou: [...new Set(theyCanTeachYou)],
        youCanTeachThem: [...new Set(youCanTeachThem)]
      },
      reasons,
      summaryReason: reasons[0]
    };
  });

  results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  return results.slice(0, topK);
}

class RecommendationService {
  /**
   * Check status of Python microservice
   */
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${RECOMMENDER_URL}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return { online: true, ...data };
      }
      return { online: false, message: `HTTP ${res.status}` };
    } catch (err) {
      return { online: false, message: err.message };
    }
  }

  /**
   * Request ranked recommendations for a user against candidate profiles
   */
  async getRecommendations(currentUser, candidates, weights = null, topK = 15) {
    if (!candidates || candidates.length === 0) {
      return {
        success: true,
        count: 0,
        engine: 'none',
        recommendations: []
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`${RECOMMENDER_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_user: currentUser,
          candidates: candidates,
          weights: weights,
          top_k: topK
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          count: data.count,
          engine: 'python_fastapi_hybrid',
          weightsUsed: data.weights_used,
          recommendations: data.recommendations
        };
      } else {
        console.warn(`[Recommender Service]: Python API responded with status ${response.status}, engaging fallback heuristic.`);
      }
    } catch (err) {
      console.warn(`[Recommender Service Notice]: Python microservice not reachable (${err.message}). Using built-in heuristic fallback engine.`);
    }

    // Seamless fallback heuristic calculation
    const fallbackRanked = fallbackRankCandidates(currentUser, candidates, topK);
    return {
      success: true,
      count: fallbackRanked.length,
      engine: 'fallback_heuristic',
      weightsUsed: {
        skill_compatibility: 0.50,
        text_similarity: 0.25,
        availability: 0.15,
        preferences: 0.10
      },
      recommendations: fallbackRanked
    };
  }
}

module.exports = new RecommendationService();
