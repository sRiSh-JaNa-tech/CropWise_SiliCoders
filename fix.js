const fs = require('fs');
const f = 'src/components/CropRecommendationPage.tsx';
let content = fs.readFileSync(f, 'utf8');
const idx1 = content.indexOf('    try {
      const response = await fetch(\'/api/crop-recommendation/chat\', {');
const idx2 = content.indexOf('setError(`Could not get recommendation: ${initialError}. Please try again later.`);
    }') + 87;
