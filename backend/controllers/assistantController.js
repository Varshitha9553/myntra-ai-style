import AssistantService from '../services/AssistantService.js';

export async function askAssistant(req, res, next) {
  try {
    const message = String(req.body.message || '').trim();
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    const response = await AssistantService.ask(req.user?.sub || 1, message);
    res.json(response);
  } catch (error) {
    next(error);
  }
}
