import { words } from "./words.js";

export default function getRandomWord(): string {
  const index = Math.floor(Math.random() * words.length);
  return words[index]!;
}