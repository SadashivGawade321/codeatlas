const axios = require('axios');

async function askAI(prompt, context) {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!groqKey && !geminiKey) {
    throw new Error('AI API Key is missing. Add GROQ_API_KEY or GEMINI_API_KEY in backend/.env');
  }

  // Construct a solid prompt combining context and user query
  const fullPrompt = `
    You are an expert AI software architect assistant.
    You are analyzing the codebase of a repository. Here is some context about its files:
    
    File list and analysis:
    ${JSON.stringify(context)}
    
    Answer the user's question clearly, focusing on structure, patterns, security, and dependencies.
    User Question: "${prompt}"
  `;

  // --- GROQ API (Faster) ---
  if (groqKey) {
    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: fullPrompt }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        }
      });
      const answer = response.data?.choices?.[0]?.message?.content;
      if (!answer) throw new Error('Invalid response from Groq API');
      return answer;
    } catch (error) {
      console.error('Groq API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch response from Groq AI. Check your GROQ_API_KEY.');
    }
  }

  // --- GEMINI API (Fallback) ---
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: fullPrompt }] }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const answer = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!answer) throw new Error('Invalid response format from Gemini API');
    return answer;
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    throw new Error('Failed to fetch response from Gemini AI. Check console or API key.');
  }
}

async function autoRefactor(fileContent) {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!groqKey && !geminiKey) {
    throw new Error('AI API Key is missing. Add GROQ_API_KEY or GEMINI_API_KEY in backend/.env');
  }

  const prompt = `
    You are an expert Autonomous Refactoring Agent. 
    Analyze the following code. Optimize it for performance, clean up technical debt, and ensure modern best practices.
    Return ONLY the refactored code block. Do not include markdown formatting like \`\`\`javascript or any explanations. Just the raw code.
    
    Original Code:
    ${fileContent}
  `;

  if (groqKey) {
    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        }
      });
      let answer = response.data?.choices?.[0]?.message?.content;
      if (!answer) throw new Error('Invalid response from Groq API');
      // Strip markdown code blocks if the model ignored instructions
      answer = answer.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
      return answer.trim();
    } catch (error) {
      console.error('Groq Refactor Error:', error.response?.data || error.message);
      throw new Error('Failed to refactor with Groq.');
    }
  }

  // Fallback
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    }, { headers: { 'Content-Type': 'application/json' } });

    let answer = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!answer) throw new Error('Invalid response from Gemini');
    answer = answer.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
    return answer.trim();
  } catch (error) {
    console.error('Gemini Refactor Error:', error.response?.data || error.message);
    throw new Error('Failed to refactor with Gemini.');
  }
}

async function aiCodeReview(fileContent) {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!groqKey && !geminiKey) {
    throw new Error('AI API Key is missing.');
  }

  const prompt = `
    You are an expert code reviewer. Analyze the following code and return a JSON array of issues found.
    Each issue should have:
    - "severity": one of "critical", "warning", or "info"
    - "line": approximate line number (string) or null
    - "message": a short description of the issue
    - "suggestion": a suggested fix

    Focus on:
    1. Security vulnerabilities (XSS, SQL injection, hardcoded secrets)
    2. Performance problems (memory leaks, N+1 queries, blocking code)
    3. Code smells (unused variables, dead code, god functions)
    4. Best practice violations

    Return ONLY valid JSON array. No markdown, no explanation, just the array.
    If the code is clean, return an empty array: []

    Code:
    ${fileContent.substring(0, 8000)}
  `;

  const callGroq = async () => {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      }
    });
    return response.data?.choices?.[0]?.message?.content;
  };

  const callGemini = async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    }, { headers: { 'Content-Type': 'application/json' } });
    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  };

  try {
    let raw = groqKey ? await callGroq() : await callGemini();
    // Strip markdown fences if present
    raw = raw.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
    const issues = JSON.parse(raw);
    return Array.isArray(issues) ? issues : [];
  } catch (err) {
    console.error('AI Review parse error:', err.message);
    return [{ severity: 'warning', line: null, message: 'AI returned non-parseable response. Try again.', suggestion: null }];
  }
}

module.exports = { askAI, autoRefactor, aiCodeReview };
