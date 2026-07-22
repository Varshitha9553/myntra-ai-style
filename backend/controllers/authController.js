import AuthService from '../services/AuthService.js';

export async function register(req, res, next) {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await AuthService.login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const profile = await AuthService.getProfile(req.user.sub);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.sub;
    const { name, avatarUrl } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const result = await AuthService.updateProfile(userId, { name, avatarUrl });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}
