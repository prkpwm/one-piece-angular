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
  hideSeenEpisodes = false;

  private readonly arcRanges = {
    1: [1, 52], 53: [53, 76], 77: [77, 92], 93: [93, 132], 133: [133, 144],
    145: [145, 196], 197: [197, 228], 229: [229, 264], 265: [265, 336],
    337: [337, 384], 385: [385, 404], 405: [405, 420], 421: [421, 456],
    457: [457, 516], 517: [517, 578], 579: [579, 628], 629: [629, 750],
    751: [751, 782], 783: [783, 892], 893: [893, 1100], 1101: [1101, 1165],
    1166: [1166, 1210], 1211: [1211, 1240], 1241: [1241, 1280]
  } as const;

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
    seasons.forEach(season => {
      for (let i = season.episodeStart; i <= season.episodeEnd; i++) {
        const episodeNum = i.toString().padStart(3, '0');
        const img = season.images[0];
        this.episodes.push({
          number: i,
          title: `${season.title} - Episode ${i - season.episodeStart + 1}`,
          embedUrl: `site:trueid.net One Piece EP ${episodeNum} embed`,
          imageUrl: img,
          seen: false
        });
      }
    });
  }

  filterEpisodes() {
    let episodes = this.episodes;
    
    if (this.searchTerm) {
      episodes = episodes.filter(ep => 
        ep.number.toString().includes(this.searchTerm) ||
        ep.title.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    
    if (this.hideSeenEpisodes) {
      episodes = episodes.filter(ep => !ep.seen);
    }
    
    this.filteredEpisodes = episodes;
    this.resetPagination();
  }

  toggleSeenEpisodes() {
    this.hideSeenEpisodes = !this.hideSeenEpisodes;
    this.filterEpisodes();
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
      this.updatePaginationAndScroll();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginationAndScroll();
    }
  }

  private resetPagination() {
    this.currentPage = 1;
    this.updatePagination();
  }

  private updatePaginationAndScroll() {
    this.updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  skipToEpisode(episodeNumber: number) {
    this.searchTerm = '';
    this.activeArc = episodeNumber;
    
    const range = this.arcRanges[episodeNumber as keyof typeof this.arcRanges];
    let episodes = range ? 
      this.episodes.filter(ep => ep.number >= range[0] && ep.number <= range[1]) :
      this.episodes;
    
    if (this.hideSeenEpisodes) {
      episodes = episodes.filter(ep => !ep.seen);
    }
    
    this.filteredEpisodes = episodes;
    this.resetPagination();
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
    let episodes = this.episodes;
    
    if (this.hideSeenEpisodes) {
      episodes = episodes.filter(ep => !ep.seen);
    }
    
    this.filteredEpisodes = episodes;
    this.resetPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeVideo() {
    this.selectedEpisode = null;
  }
}