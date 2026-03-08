import type { ToneCheckResult, ToneLabel } from "../../shared/schema";

const FLAGGED_TONES: ToneLabel[] = [
  "hostile",
  "aggressive",
  "passive_aggressive",
];

const SYSTEM_PROMPT = `You are a co-parenting communication coach. Analyze the tone of messages between co-parents.

Respond ONLY with valid JSON in this exact format:
{
  "tone": "neutral" | "friendly" | "formal" | "hostile" | "aggressive" | "passive_aggressive",
  "confidence": 0.0-1.0,
  "flagged": true/false,
  "explanation": "Brief explanation of why this tone was detected",
  "suggestion": "A neutral rewrite of the message (only if flagged)"
}

Flag messages that are hostile, aggressive, or passive-aggressive. These tones can harm children and escalate conflict. Provide a constructive, neutral alternative when flagging.`;

const NEUTRAL_FALLBACK: ToneCheckResult = {
  tone: "neutral",
  confidence: 0,
  flagged: false,
};

/**
 * Analyze the tone of a co-parenting message using OpenAI gpt-4o-mini.
 *
 * Falls back to a neutral result when:
 * - No API key is configured (development mode)
 * - The API call times out (3 s hard limit)
 * - Any network, parsing, or upstream error occurs
 */
export async function analyzeTone(
  content: string,
): Promise<ToneCheckResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.log("[Tone] No OpenAI key, returning neutral");
    return { tone: "neutral", confidence: 1.0, flagged: false };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content },
          ],
          temperature: 0.1,
          max_tokens: 300,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.error("[Tone] OpenAI API error:", response.status);
      return NEUTRAL_FALLBACK;
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;

    if (!resultText) {
      return NEUTRAL_FALLBACK;
    }

    const parsed = JSON.parse(resultText) as ToneCheckResult;

    // Ensure flagged is consistent with the detected tone
    parsed.flagged = FLAGGED_TONES.includes(parsed.tone);

    return parsed;
  } catch (error) {
    console.error("[Tone] Analysis failed:", error);
    return NEUTRAL_FALLBACK;
  }
}
