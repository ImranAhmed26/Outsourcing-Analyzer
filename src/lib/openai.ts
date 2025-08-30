import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('Missing OpenAI API key');
}

export const openai = new OpenAI({
  apiKey: apiKey,
});

// Test function to verify OpenAI connection
export async function testOpenAIConnection() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello" if you can hear me.',
        },
      ],
      max_tokens: 10,
    });

    if (response.choices[0]?.message?.content) {
      return {
        success: true,
        message: 'OpenAI connection successful',
        response: response.choices[0].message.content,
      };
    } else {
      return {
        success: false,
        message: 'OpenAI connection failed: No response received',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `OpenAI connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
