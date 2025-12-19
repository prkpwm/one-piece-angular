export interface Season {
  season: number;
  title: string;
  episodes: number;
  images: string[];
}

export interface SeriesData {
  seasons: Season[];
}