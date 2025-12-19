export interface Season {
  season: number;
  title: string;
  episodeStart: number;
  episodeEnd: number;
  images: string[];
}

export interface SeriesData {
  seasons: Season[];
}