import GroqService from './GroqService.js';
import WardrobeService from './WardrobeService.js';

class AssistantService {
  async ask(userId, message) {
    const wardrobeItems = await WardrobeService.list(userId);
    return GroqService.assistantChat({ wardrobeItems, message });
  }
}

export default new AssistantService();
