function normalizeMessages(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
    .slice(-8)
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: String(message.content || message.text || '').trim(),
    }))
    .filter((message) => message.content);
}

export function generateLocalReply(messages = []) {
  const normalized = normalizeMessages(messages);
  const latestUserText = [...normalized].reverse().find((message) => message.role === 'user')?.content?.toLowerCase() || '';

  if (!latestUserText) {
    return 'I’m here to help you think clearly and stay on track. Tell me what you want to work on today.';
  }

  if (/workout|gym|exercise|run|training|fitness/i.test(latestUserText)) {
    return 'That sounds like a good focus. A realistic plan is to start with a short warm-up, do one main workout block, and finish with a few minutes of stretching or a calm walk.';
  }

  if (/mood|stress|sad|anxious|tired|overwhelmed|feel/i.test(latestUserText)) {
    return 'You do not need to solve everything at once. Try a simple reset: breathe slowly for a minute, take a short walk, and then pick one small task to start with.';
  }

  if (/remind|reminder|schedule|meeting|appointment/i.test(latestUserText)) {
    return 'I can help you stay organized. A useful approach is to set one clear reminder, one time block for the task, and one quick check-in at the end.';
  }

  if (/goal|plan|focus|study|project|habit/i.test(latestUserText)) {
    return 'That is a strong goal. Let’s make it manageable by choosing one priority action for today, one follow-up step, and one small reward when you finish.';
  }

  if (/translate|language|word|sentence/i.test(latestUserText)) {
    return 'I can help with that. Send me the text you want clarified or translated and I’ll turn it into a clearer version for you.';
  }

  return `I’m following your message and I want to help in a practical way. Let’s keep it simple: tell me the situation, and I’ll help you choose the best next step.`;
}
