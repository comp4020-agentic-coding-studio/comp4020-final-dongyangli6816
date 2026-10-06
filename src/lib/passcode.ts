import { randomInt } from "node:crypto";

// ROOM-1: six characters with the easily confused ones (0 O 1 I L) left out,
// so a code read aloud or off a screen can be typed back without guessing.
export const PASSCODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newPasscode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += PASSCODE_ALPHABET[randomInt(PASSCODE_ALPHABET.length)];
  return code;
}

// What someone typed, uppercased with spaces dropped.
export const normalisePasscode = (input: string): string => input.replace(/\s+/g, "").toUpperCase();
