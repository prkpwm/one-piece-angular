import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Episode } from './episode.interface';
import { Season, SeriesData } from './season.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  episodes: Episode[] = [];
  filteredEpisodes: Episode[] = [];
  searchTerm = '';
  selectedEpisode: Episode | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSeasons();
  }

  loadSeasons() {
    this.http.get<SeriesData>('assets/seasons.json').subscribe(data => {
      this.generateEpisodes(data.seasons);
      this.filteredEpisodes = this.episodes;
    });
  }
  generateEpisodes(seasons: Season[]) {
    let episodeCounter = 1;
    seasons.forEach(season => {
      for (let i = 1; i <= season.episodes; i++) {
        const episodeNum = episodeCounter.toString().padStart(3, '0');
        const img = season.images[0];
        this.episodes.push({
          number: episodeCounter,
          title: `${season.title} - Episode ${i}`,
          embedUrl: `site:trueid.net One Piece EP ${episodeNum} embed`,
          imageUrl: img
        });
        episodeCounter++;
      }
    });
  }

  filterEpisodes() {
    if (!this.searchTerm) {
      this.filteredEpisodes = this.episodes;
    } else {
      this.filteredEpisodes = this.episodes.filter(ep => 
        ep.number.toString().includes(this.searchTerm) ||
        ep.title.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  playEpisode(episode: Episode) {
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(episode.embedUrl)}`;
    window.open(googleSearchUrl, '_blank');
  }

  closeVideo() {
    this.selectedEpisode = null;
  }
}