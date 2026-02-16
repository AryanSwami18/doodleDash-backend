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
}