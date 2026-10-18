/**
 * SkillSwap - Google Gemini Generative AI Service
 * Powered by Google Gemini 3.8 Flash & Google AI Studio
 * Developer: Sanjeeviraj
 */

const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

/**
 * Raw call to Gemini REST API via native HTTPS
 */
function callGemini(contents, systemInstruction = null) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      return reject(new Error('GEMINI_API_KEY is not configured in backend environment.'));
    }

    const payload = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const postData = JSON.stringify(payload);

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (json.candidates && json.candidates[0] && json.candidates[0].content) {
              const text = json.candidates[0].content.parts.map(p => p.text).join('\n');
              resolve(text);
            } else {
              resolve('');
            }
          } else {
            const errMsg = json.error ? json.error.message : `Gemini HTTP Error ${res.statusCode}`;
            reject(new Error(errMsg));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Gemini response: ${e.message}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gemini API call timed out after 10 seconds.'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Generate a 4-Week Collaborative Study Roadmap between two learners
 */
async function generateStudyPlan(user1, user2) {
  const user1Teach = (user1.teachSkills || []).map(s => s.name).join(', ') || 'General Knowledge';
  const user1Learn = (user1.learnSkills || []).map(s => s.name).join(', ') || 'Web Development';
  const user2Teach = (user2.teachSkills || []).map(s => s.name).join(', ') || 'Programming';
  const user2Learn = (user2.learnSkills || []).map(s => s.name).join(', ') || 'Software Skills';

  const prompt = `Create a structured, inspiring 4-week reciprocal peer learning roadmap for two students on the SkillSwap platform:
- Student 1: ${user1.name} (Can teach: ${user1Teach}; Wants to learn: ${user1Learn})
- Student 2: ${user2.name} (Can teach: ${user2Teach}; Wants to learn: ${user2Learn})

Include:
1. Executive Goal: Clear summary of the mutual learning objective.
2. Week 1: Onboarding & Fundamentals Exchange (who teaches what, initial setup, first milestone).
3. Week 2: Deep Dive & Practical Exercises (hands-on coding/design practice).
4. Week 3: Collaborative Project Sprint (building a shared mini-project combining both skills).
5. Week 4: Final Polish, Code Review, and Reciprocal Skill Points Evaluation.
6. Pro-Tip: One actionable collaborative study advice.

Keep the formatting clean with markdown headings and bullet points.`;

  const systemPrompt = 'You are the SkillSwap AI Peer Learning Architect, built for Sanjeeviraj\'s platform. Provide engaging, professional, practical study curriculums for university students.';

  return await callGemini(
    [{ parts: [{ text: prompt }] }],
    systemPrompt
  );
}

/**
 * Generate a compelling AI Match Explanation
 */
async function generateMatchExplanation(user, candidate) {
  const userTeach = (user.teachSkills || []).map(s => s.name).join(', ');
  const userLearn = (user.learnSkills || []).map(s => s.name).join(', ');
  const candTeach = (candidate.teachSkills || []).map(s => s.name).join(', ');
  const candLearn = (candidate.learnSkills || []).map(s => s.name).join(', ');

  const prompt = `Analyze this peer learning match on SkillSwap:
Learner 1: ${user.name} (Teaches: ${userTeach} | Wants to learn: ${userLearn})
Learner 2: ${candidate.name} (Teaches: ${candTeach} | Wants to learn: ${candLearn})
Learner 2 Availability: ${(candidate.availability || []).join(', ') || 'Flexible'}
Preferred Format: ${candidate.preferredFormat || 'Online'}

Provide a 2-3 sentence engaging AI explanation highlighting:
1. The reciprocal synergy (what each gives and receives).
2. Why their availability/format works well.
3. A suggested icebreaker topic for their first 45-minute session.`;

  const systemPrompt = 'You are the SkillSwap AI Matchmaker. Be concise, motivating, and specific to the skills mentioned.';

  return await callGemini(
    [{ parts: [{ text: prompt }] }],
    systemPrompt
  );
}

/**
 * Draft a high-converting Skill Exchange Invitation Message
 */
async function draftProposalMessage(sender, recipient, teachSkill, learnSkill) {
  const prompt = `Draft a polite, enthusiastic 3-sentence skill exchange request message from ${sender.name} to ${recipient.name}:
- ${sender.name} offers to teach: ${teachSkill || 'their expertise'}
- ${sender.name} wants to learn from ${recipient.name}: ${learnSkill || 'their subject'}
- Keep it friendly, collaborative, and collegiate.`;

  const systemPrompt = 'You are a helpful writing assistant for SkillSwap students. Write in first person as the sender.';

  return await callGemini(
    [{ parts: [{ text: prompt }] }],
    systemPrompt
  );
}

/**
 * Interactive SkillSwap AI Copilot Chat Assistant
 */
async function chatAdvisor(userMessage, conversationHistory = [], currentUser = null) {
  const context = currentUser
    ? `Current student is ${currentUser.name}. They teach: ${(currentUser.teachSkills || []).map(s => s.name).join(', ') || 'General'}. They want to learn: ${(currentUser.learnSkills || []).map(s => s.name).join(', ') || 'New Skills'}.`
    : 'User is a student on SkillSwap.';

  const systemPrompt = `You are "SkillSwap Copilot", an AI learning assistant integrated into the SkillSwap peer-to-peer learning platform developed by Sanjeeviraj.
Your role:
- Help students find ideal skill swap partners.
- Explain technical concepts simply.
- Suggest project ideas combining complementary skills (e.g., Python + React, UI/UX + Web Dev).
- Advise on structuring effective 45-minute peer study sessions.
- Maintain an encouraging, academic, and friendly tone.
${context}`;

  const formattedContents = [];

  // Add past conversation turns if present
  if (Array.isArray(conversationHistory)) {
    conversationHistory.slice(-6).forEach(msg => {
      formattedContents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content || msg.text || '' }]
      });
    });
  }

  formattedContents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  return await callGemini(formattedContents, systemPrompt);
}

module.exports = {
  callGemini,
  generateStudyPlan,
  generateMatchExplanation,
  draftProposalMessage,
  chatAdvisor,
  MODEL
};
