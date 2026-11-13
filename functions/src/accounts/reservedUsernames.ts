// Handles nobody may register, checked case-insensitively against the lowercased
// username. Covers product identity, support roles, and strings that are
// confusing or dangerous as document ids and URLs.
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  'admin',
  'administrator',
  'api',
  'app',
  'bot',
  'everyone',
  'help',
  'me',
  'mod',
  'moderator',
  'none',
  'null',
  'official',
  'plantpapa',
  'plant_papa',
  'plant-papa',
  'root',
  'security',
  'staff',
  'support',
  'system',
  'team',
  'undefined',
  'user',
])
