#!/usr/bin/env node

// Delete voices script - runs every 5 minutes to clean up ElevenLabs voices
import fetch from 'node-fetch';

async function deleteOldVoices() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.log('ELEVENLABS_API_KEY not found, skipping voice cleanup');
    return;
  }

  try {
    // Get all voices
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      console.log('Failed to fetch voices:', response.status);
      return;
    }

    const data = await response.json();
    const voices = data.voices || [];
    
    // Filter custom voices (not pre-made ones)
    const customVoices = voices.filter(voice => voice.category === 'cloned' || voice.category === 'generated');
    
    console.log(`Found ${customVoices.length} custom voices to potentially delete`);

    // Delete voices older than 1 hour (or implement your own logic)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const voice of customVoices) {
      // For demo purposes, delete all custom voices to free up slots
      try {
        const deleteResponse = await fetch(`https://api.elevenlabs.io/v1/voices/${voice.voice_id}`, {
          method: 'DELETE',
          headers: {
            'xi-api-key': apiKey
          }
        });

        if (deleteResponse.ok) {
          console.log(`Deleted voice: ${voice.name} (${voice.voice_id})`);
        } else {
          console.log(`Failed to delete voice ${voice.name}: ${deleteResponse.status}`);
        }
      } catch (error) {
        console.log(`Error deleting voice ${voice.name}:`, error.message);
      }
    }
  } catch (error) {
    console.log('Error in voice cleanup:', error.message);
  }
}

// Run the cleanup
deleteOldVoices().then(() => {
  console.log('Voice cleanup completed at', new Date().toISOString());
}).catch(error => {
  console.error('Voice cleanup failed:', error);
});