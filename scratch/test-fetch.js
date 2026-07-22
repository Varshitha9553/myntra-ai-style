import axios from 'axios';

async function test() {
  const url = "https://www.myntra.com/casual-shoes/bersache/bersache-boys-printed-canvas-lace-ups-sneakers/30452873/buy";
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000
    });
    console.log("Status:", res.status);
    console.log("HTML Length:", res.data.length);
    const html = res.data;

    // Try finding image
    const imgMatches = [
      ...html.matchAll(/<meta\s+property="og:image"\s+content="([^"]+)"/gi),
      ...html.matchAll(/<meta\s+content="([^"]+)"\s+property="og:image"/gi)
    ];
    console.log("Image matches:", imgMatches.map(m => m[1]));

    const titleMatches = [
      ...html.matchAll(/<meta\s+property="og:title"\s+content="([^"]+)"/gi),
      ...html.matchAll(/<title>([^<]+)<\/title>/gi)
    ];
    console.log("Title matches:", titleMatches.map(m => m[1]));

  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) {
      console.error("Response Status:", err.response.status);
    }
  }
}

test();
