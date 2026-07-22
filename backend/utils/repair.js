import fs from 'fs';
import path from 'path';
import { createConnection } from '../config/oracle.js';
import GroqService from '../services/GroqService.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function repairWardrobeItems() {
  let connection;
  try {
    connection = await createConnection();
    const result = await connection.execute(
      `SELECT id, name, image_url 
       FROM wardrobe_items 
       WHERE (category = 'Topwear' AND color = 'Black' AND name LIKE '%Screenshot%')
          OR name LIKE '%[Review Required]%'`
    );

    const rows = result.rows || [];
    if (rows.length === 0) {
      console.log('[Database Repair] No corrupted wardrobe items found.');
      return;
    }

    console.log(`[Database Repair] Found ${rows.length} items to re-analyze...`);
    
    for (const row of rows) {
      const id = row.ID ?? row.id;
      const name = row.NAME ?? row.name;
      const imageUrl = row.IMAGE_URL ?? row.imageUrl;

      // Extract filename from URL
      const filename = path.basename(imageUrl);
      const filepath = path.join(process.cwd(), 'uploads', filename);

      if (fs.existsSync(filepath)) {
        // Sleep 30 seconds to avoid rate limiting
        console.log(`[Database Repair] Sleeping for 30 seconds before analyzing ${filename} (ID: ${id})...`);
        await sleep(30000);

        console.log(`[Database Repair] Re-analyzing file: ${filename} (ID: ${id})`);
        const buffer = fs.readFileSync(filepath);
        const file = {
          buffer,
          originalname: name.replace('[Review Required] ', ''),
          mimetype: 'image/png'
        };

        const analysis = await GroqService.analyzeWardrobeImage(file, file.originalname);
        
        if (analysis && analysis.confidence > 0 && analysis.category !== 'Unknown' && analysis.confidence > 40) {
          console.log(`[Database Repair] Successfully re-classified ${filename} as ${analysis.category} (${analysis.item_name})`);

          const cleanName = analysis.item_name;
          const category = analysis.category;
          const color = analysis.color || 'Black';
          const pattern = analysis.pattern || 'Solid';
          const season = Array.isArray(analysis.season) ? analysis.season.join(', ') : (analysis.season || 'All Season');
          const occasion = Array.isArray(analysis.occasion) ? analysis.occasion.join(', ') : (analysis.occasion || 'Casual');
          const aiTags = Array.isArray(analysis.aiTags) ? analysis.aiTags.join(',') : (analysis.category + ',' + analysis.color);

          await connection.execute(
            `UPDATE wardrobe_items 
             SET name = :name, 
                 category = :category, 
                 color = :color, 
                 pattern = :pattern, 
                 season = :season, 
                 occasion = :occasion, 
                 ai_tags = :aiTags
             WHERE id = :id`,
            { id, name: cleanName, category, color, pattern, season, occasion, aiTags }
          );
        } else {
          console.log(`[Database Repair] Re-classification skipped or got fallback analysis for ${filename}.`);
        }
      } else {
        console.warn(`[Database Repair] File not found locally: ${filepath}`);
      }
    }

    await connection.commit();
    console.log('[Database Repair] Finished repairing wardrobe items successfully.');
  } catch (err) {
    console.error('[Database Repair] Error repairing items:', err.message);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('[Database Repair] Error closing connection:', closeErr.message);
      }
    }
  }
}
