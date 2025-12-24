import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculates the Levenshtein distance between two strings.
 * This measures the minimum number of single-character edits (insertions, deletions, substitutions)
 * required to change one string into another.
 */
export function calculateLevenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const dp: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize base cases
  for (let i = 0; i <= len1; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    dp[0][j] = j;
  }

  // Fill the DP table
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1, // substitution
        );
      }
    }
  }

  return dp[len1][len2];
}

/**
 * Normalizes a string for comparison by:
 * - Converting to lowercase
 * - Removing extra whitespace
 * - Removing accents/diacritics
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim()
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Check if two names are similar considering partial matches
 * Returns true if:
 * - Levenshtein distance is within threshold
 * - OR one name is a prefix/substring of the other (common for first names only)
 */
function areNamesSimilar(name1: string, name2: string, threshold: number): boolean {
  const normalized1 = normalizeString(name1);
  const normalized2 = normalizeString(name2);

  // Check if one name is contained in the other (e.g., "Max" in "Max Herrainz")
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');

  // If both have same first word and one has only first name, consider it similar
  if (words1.length >= 1 && words2.length >= 1 && words1[0] === words2[0]) {
    // If one is just the first name and the other is full name
    if (words1.length === 1 || words2.length === 1) {
      return true;
    }
  }

  // Otherwise use Levenshtein distance
  const distance = calculateLevenshteinDistance(normalized1, normalized2);
  return distance <= threshold;
}

export interface SimilarPlayer {
  id: string;
  name: string;
  number: number;
  distance: number;
  similarity: number;
  handedness?: string;
  isGoalkeeper?: boolean;
  teams?: Array<{ id: string; name: string; club: string; category?: string; position?: number }>;
}

/**
 * Find similar players in the database based on name similarity
 */
export async function findSimilarPlayers(
  name: string,
  threshold: number = 3,
): Promise<SimilarPlayer[]> {
  const normalizedInput = normalizeString(name);
  const allPlayers = await prisma.player.findMany({
    select: {
      id: true,
      name: true,
      number: true,
      handedness: true,
      isGoalkeeper: true,
      teams: {
        select: {
          id: true,
          position: true,
          team: {
            select: {
              id: true,
              name: true,
              category: true,
              club: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const similar = allPlayers
    .filter((player) => areNamesSimilar(name, player.name, threshold))
    .map((player) => {
      const normalizedPlayer = normalizeString(player.name);
      const distance = calculateLevenshteinDistance(normalizedInput, normalizedPlayer);
      const maxLength = Math.max(normalizedInput.length, normalizedPlayer.length);
      const similarity = 1 - distance / maxLength;

      return {
        id: player.id,
        name: player.name,
        number: player.number,
        handedness: player.handedness,
        isGoalkeeper: player.isGoalkeeper,
        distance,
        similarity,
        teams: player.teams.map((t) => ({
          id: t.team.id,
          name: t.team.name,
          club: t.team.club.name,
          category: t.team.category,
          position: t.position ?? undefined,
        })),
      };
    })
    .sort((a, b) => a.distance - b.distance);

  return similar;
}
