// Glicko-2 rating calculation wrapper
// Uses the 'glicko2' npm package

interface RatingData {
  rating: number;
  rd: number;
  vol: number;
}

interface RatingResult {
  white: RatingData;
  black: RatingData;
  whiteChange: number;
  blackChange: number;
}

// Simplified Glicko-2 implementation for when the package isn't available
// Based on Mark Glickman's paper

const TAU = 0.5; // System constant
const EPSILON = 0.000001;

function g(rd: number): number {
  return 1 / Math.sqrt(1 + 3 * Math.pow(rd / Math.PI, 2) / Math.pow(400, 2));
}

function E(rating: number, opponentRating: number, opponentRd: number): number {
  return 1 / (1 + Math.pow(10, -g(opponentRd) * (rating - opponentRating) / 400));
}

export function calculateRatingChange(
  white: RatingData,
  black: RatingData,
  result: 'white' | 'black' | 'draw'
): RatingResult {
  const whiteScore = result === 'white' ? 1 : result === 'draw' ? 0.5 : 0;
  const blackScore = 1 - whiteScore;

  // Scale ratings to Glicko-2 scale
  const mu1 = (white.rating - 1500) / 173.7178;
  const mu2 = (black.rating - 1500) / 173.7178;
  const phi1 = white.rd / 173.7178;
  const phi2 = black.rd / 173.7178;

  // Calculate expected scores
  const gPhi2 = 1 / Math.sqrt(1 + 3 * phi2 * phi2 / (Math.PI * Math.PI));
  const gPhi1 = 1 / Math.sqrt(1 + 3 * phi1 * phi1 / (Math.PI * Math.PI));

  const E1 = 1 / (1 + Math.exp(-gPhi2 * (mu1 - mu2)));
  const E2 = 1 / (1 + Math.exp(-gPhi1 * (mu2 - mu1)));

  // Calculate variance
  const v1 = 1 / (gPhi2 * gPhi2 * E1 * (1 - E1));
  const v2 = 1 / (gPhi1 * gPhi1 * E2 * (1 - E2));

  // Calculate delta
  const delta1 = v1 * gPhi2 * (whiteScore - E1);
  const delta2 = v2 * gPhi1 * (blackScore - E2);

  // Update phi (RD)
  const newPhi1 = 1 / Math.sqrt(1 / (phi1 * phi1 + white.vol * white.vol) + 1 / v1);
  const newPhi2 = 1 / Math.sqrt(1 / (phi2 * phi2 + black.vol * black.vol) + 1 / v2);

  // Update mu (rating)
  const newMu1 = mu1 + newPhi1 * newPhi1 * gPhi2 * (whiteScore - E1);
  const newMu2 = mu2 + newPhi2 * newPhi2 * gPhi1 * (blackScore - E2);

  // Convert back to Glicko scale
  const newWhiteRating = 173.7178 * newMu1 + 1500;
  const newBlackRating = 173.7178 * newMu2 + 1500;
  const newWhiteRd = 173.7178 * newPhi1;
  const newBlackRd = 173.7178 * newPhi2;

  // Ensure minimum RD
  const minRd = 30;
  const maxRd = 350;

  return {
    white: {
      rating: Math.round(newWhiteRating * 10) / 10,
      rd: Math.min(maxRd, Math.max(minRd, Math.round(newWhiteRd * 10) / 10)),
      vol: white.vol,
    },
    black: {
      rating: Math.round(newBlackRating * 10) / 10,
      rd: Math.min(maxRd, Math.max(minRd, Math.round(newBlackRd * 10) / 10)),
      vol: black.vol,
    },
    whiteChange: Math.round((newWhiteRating - white.rating) * 10) / 10,
    blackChange: Math.round((newBlackRating - black.rating) * 10) / 10,
  };
}

// Increase RD for inactive players (called periodically)
export function increaseRdForInactivity(rd: number, vol: number): number {
  const phi = rd / 173.7178;
  const newPhi = Math.sqrt(phi * phi + vol * vol);
  const newRd = 173.7178 * newPhi;
  return Math.min(350, Math.round(newRd * 10) / 10);
}
