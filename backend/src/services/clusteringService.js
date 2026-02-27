const { query } = require('../config/database');

/**
 * Compute word-frequency map for a given text string.
 * @param {string} text
 * @returns {Map<string, number>}
 */
function wordFrequency(text) {
  const freq = new Map();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  return freq;
}

/**
 * Jaccard similarity between two word-frequency maps (token-set level).
 * @param {Map<string, number>} a
 * @param {Map<string, number>} b
 * @returns {number} 0–1
 */
function jaccardSimilarity(a, b) {
  const setA = new Set(a.keys());
  const setB = new Set(b.keys());

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Haversine distance between two lat/lng points, in metres.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const SIMILARITY_THRESHOLD = 0.35; // Jaccard threshold for text similarity
const PROXIMITY_METERS = 500; // Max distance to consider location as "near"

/**
 * Find a similar existing issue given a new issue's text + location.
 * Returns the existing issue object if a match is found, otherwise null.
 *
 * @param {string} title
 * @param {string} description
 * @param {string} category
 * @param {number|null} lat
 * @param {number|null} lng
 * @returns {Promise<object|null>}
 */
async function findSimilarIssue(title, description, category, lat, lng) {
  try {
    // Fetch recent open/in-progress issues in the same category
    const result = await query(
      `SELECT id, title, description, location_lat, location_lng
       FROM issues
       WHERE category = $1
         AND status IN ('open', 'in_progress')
         AND is_clustered = FALSE
         AND created_at >= NOW() - INTERVAL '30 days'
       ORDER BY created_at DESC
       LIMIT 100`,
      [category]
    );

    if (result.rows.length === 0) return null;

    const newText = `${title} ${description}`;
    const newFreq = wordFrequency(newText);

    for (const candidate of result.rows) {
      const candidateText = `${candidate.title} ${candidate.description}`;
      const candidateFreq = wordFrequency(candidateText);

      const textSimilarity = jaccardSimilarity(newFreq, candidateFreq);
      if (textSimilarity < SIMILARITY_THRESHOLD) continue;

      // If both have coordinates, check proximity
      if (
        lat != null && lng != null &&
        candidate.location_lat != null && candidate.location_lng != null
      ) {
        const distance = haversineDistance(
          lat, lng,
          parseFloat(candidate.location_lat),
          parseFloat(candidate.location_lng)
        );
        if (distance > PROXIMITY_METERS) continue;
      }

      // Text similarity passed (and optional proximity passed)
      return candidate;
    }

    return null;
  } catch (err) {
    console.error('clusteringService.findSimilarIssue error:', err);
    return null;
  }
}

module.exports = { findSimilarIssue };
