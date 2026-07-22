import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  try {
    const res = await axios.get('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      }
    });
    console.log(res.data.data.map(m => m.id).filter(id => id.includes('vision') || id.includes('qwen') || id.includes('llama')));
  } catch (err) {
    console.error(err.message);
  }
};
run();
