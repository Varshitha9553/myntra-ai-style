import DuplicateDetectionService from '../services/DuplicateDetectionService.js';

export async function checkDuplicates(req, res, next) {
  try {
    const result = await DuplicateDetectionService.detectDuplicates(req.user.sub, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
