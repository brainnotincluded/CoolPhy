-- Create app_settings table for storing AI configuration
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    openrouter_api_key TEXT,
    system_prompt TEXT NOT NULL,
    primary_model VARCHAR(255) DEFAULT 'anthropic/claude-3.5-sonnet',
    fallback_model VARCHAR(255) DEFAULT 'google/gemini-2.0-flash-exp:free',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO app_settings (system_prompt, primary_model, fallback_model)
VALUES (
    'You are an expert teacher specialized in mathematics, physics, and computer science. Your role is to help students understand concepts and solve problems.

Guidelines:
- Be encouraging and supportive
- Explain concepts clearly with examples
- If a student is stuck, provide hints rather than direct answers
- Use LaTeX notation for mathematical expressions (wrap in $ for inline or $$ for block)
- When discussing a specific task, reference the problem statement
- Break down complex problems into manageable steps
- Encourage critical thinking and problem-solving skills

Remember: Your goal is to help students learn, not just give them answers.',
    'anthropic/claude-3.5-sonnet',
    'google/gemini-2.0-flash-exp:free'
)
ON CONFLICT DO NOTHING;
