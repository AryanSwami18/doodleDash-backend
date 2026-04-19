export interface Player {
  id: string;
  socketId?: string;
  name: string;
  score: number;
  isHost?: boolean;   
}

export interface Room {
  players: Player[];
  gameState: "waiting" | "in-progress" | "finished";
  rounds?: number | undefined;
  currentRound?: number | undefined;
  currentDrawerId?: string | undefined;
  wordToDraw?: string | undefined;
  guessedPlayers?: string[] | undefined;
  roundEnding?: boolean;
  roundStartTime?: number | undefined;
}