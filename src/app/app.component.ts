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
  paginatedEpisodes: Episode[] = [];
  searchTerm = '';
  selectedEpisode: Episode | null = null;
  currentPage = 1;
  itemsPerPage = 50;
  totalPages = 0;
  activeArc: number | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSeasons();
  }

  loadSeenEpisodes() {
    const seen = localStorage.getItem('seenEpisodes');
    if (seen) {
      const seenNumbers = JSON.parse(seen);
      this.episodes.forEach(ep => {
        ep.seen = seenNumbers.includes(ep.number);
      });
    }
  }

  saveSeenEpisodes() {
    const seenNumbers = this.episodes.filter(ep => ep.seen).map(ep => ep.number);
    localStorage.setItem('seenEpisodes', JSON.stringify(seenNumbers));
  }

  loadSeasons() {
    this.http.get<SeriesData>('assets/seasons.json').subscribe(data => {
      this.generateEpisodes(data.seasons);
      this.loadSeenEpisodes();
      this.filteredEpisodes = this.episodes;
      this.updatePagination();
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
          imageUrl: img,
          seen: false
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
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredEpisodes.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEpisodes = this.filteredEpisodes.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  skipToEpisode(episodeNumber: number) {
    this.searchTerm = '';
    this.activeArc = episodeNumber;
    
    // Define arc ranges
    const arcRanges = {
      1: [1, 61],        // East Blue
      62: [62, 77],      // Grand Line
      92: [92, 130],     // Alabasta
      144: [144, 195],   // Skypiea
      229: [229, 263],   // Water 7
      264: [264, 325],   // Enies Lobby
      326: [326, 384],   // Thriller Bark
      385: [385, 516],   // Summit War
      517: [517, 574],   // Fish-Man Island
      575: [575, 628],   // Punk Hazard
      629: [629, 746],   // Dressrosa
      747: [747, 782],   // Zou
      783: [783, 877],   // Whole Cake
      878: [878, 1085],  // Wano
      1086: [1086, 1200] // Egghead
    };
    
    const range = arcRanges[episodeNumber as keyof typeof arcRanges];
    if (range) {
      this.filteredEpisodes = this.episodes.filter(ep => 
        ep.number >= range[0] && ep.number <= range[1]
      );
    } else {
      this.filteredEpisodes = this.episodes;
    }
    
    this.currentPage = 1;
    this.updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  playEpisode(episode: Episode) {
    episode.seen = true;
    this.saveSeenEpisodes();
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(episode.embedUrl)}`;
    window.open(googleSearchUrl, '_blank');
  }

  showAllEpisodes() {
    this.searchTerm = '';
    this.activeArc = null;
    this.filteredEpisodes = this.episodes;
    this.currentPage = 1;
    this.updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeVideo() {
    this.selectedEpisode = null;
  }
}