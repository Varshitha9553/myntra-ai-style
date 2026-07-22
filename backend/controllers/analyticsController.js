import AnalyticsService from '../services/AnalyticsService.js';

export async function getAnalytics(req, res, next) {
  try {
    const analytics = await AnalyticsService.getDashboard(req.user?.sub || 1);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
}
