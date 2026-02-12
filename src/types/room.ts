export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface Room {
  players: Player[];
}