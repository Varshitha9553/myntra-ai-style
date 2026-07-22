import PersonalizationService from '../services/PersonalizationService.js';

export async function getProfile(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const profile = await PersonalizationService.getStyleProfile(userId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function getInsights(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const insights = await PersonalizationService.getAIInsights(userId);
    res.json(insights);
  } catch (error) {
    next(error);
  }
}

export async function getAnalytics(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const analytics = await PersonalizationService.getAnalytics(userId);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
}
