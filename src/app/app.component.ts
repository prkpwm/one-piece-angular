import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Episode } from './episode.interface';
import { Season } from './season.interface';
import { ARC_RANGES } from './arc-ranges.model';
import { SEASONS_DATA } from './seasons.model';

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
  activeArc: string | null = null;
  hideSeenEpisodes = false;
  historyStart: number | null = 1;
  historyEnd: number | null = null;
  historyMessage = '';


  constructor() {}

  ngOnInit() {
    const hideSeenState = localStorage.getItem('hideSeenEpisodes');
    if (hideSeenState) {
      this.hideSeenEpisodes = JSON.parse(hideSeenState);
    }
    const pageSize = localStorage.getItem('itemsPerPage');
    if (pageSize) {
      this.itemsPerPage = +JSON.parse(pageSize);
    }
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

  saveSeenEpisodes(unseenNumbers: number[] = []) {
    // Keep history pasted into storage (or added in another tab) since loading.
    const seenNumbers = new Set<number>(
      this.episodes.filter(ep => ep.seen).map(ep => ep.number)
    );
    const stored = localStorage.getItem('seenEpisodes');
    if (stored) {
      const storedNumbers: number[] = JSON.parse(stored);
      storedNumbers.forEach(number => seenNumbers.add(number));
    }
    unseenNumbers.forEach(number => seenNumbers.delete(number));
    localStorage.setItem('seenEpisodes', JSON.stringify([...seenNumbers].sort((a, b) => a - b)));
    this.episodes.forEach(ep => {
      ep.seen = seenNumbers.has(ep.number);
    });
  }

  get historyRangeValid(): boolean {
    return this.historyStart !== null && this.historyEnd !== null &&
      Number.isInteger(this.historyStart) && Number.isInteger(this.historyEnd) &&
      this.historyStart >= 1 && this.historyEnd >= this.historyStart &&
      this.episodes.some(ep => ep.number === this.historyEnd);
  }

  setHistoryRange(seen: boolean) {
    if (!this.historyRangeValid) return;
    this.loadSeenEpisodes();
    const episodes = this.episodes.filter(ep =>
      ep.number >= this.historyStart! && ep.number <= this.historyEnd!);
    episodes.forEach(ep => ep.seen = seen);
    this.saveSeenEpisodes(seen ? [] : episodes.map(ep => ep.number));
    this.filterEpisodes();
    this.historyMessage = `Episodes ${this.historyStart}–${this.historyEnd} marked ${seen ? 'watched' : 'unwatched'}.`;
  }

  toggleEpisodeSeen(episode: Episode) {
    this.loadSeenEpisodes();
    episode.seen = !episode.seen;
    this.saveSeenEpisodes(episode.seen ? [] : [episode.number]);
    this.filterEpisodes();
  }

  loadSeasons() {
    this.generateEpisodes(SEASONS_DATA);
    this.loadSeenEpisodes();
    this.filterEpisodes();
  }
  generateEpisodes(seasons: Season[]) {
    seasons.forEach(season => {
      for (let i = season.episodeStart; i <= season.episodeEnd; i++) {
        const episodeNum = i.toString().padStart(3, '0');
        const img = season.images[0];
        this.episodes.push({
          number: i,
          title: `${season.title} - Episode ${i - season.episodeStart + 1}`,
          embedUrl: `site:trueid.net "One Piece" "EP ${episodeNum}" (embed OR "EP ${episodeNum}")`,
          imageUrl: img,
          seen: false
        });
      }
    });
  }

  filterEpisodes() {
    let episodes = this.episodes;
    const range = ARC_RANGES[this.activeArc as keyof typeof ARC_RANGES];
    if (range) {
      episodes = episodes.filter(ep => ep.number >= range[0] && ep.number <= range[1]);
    }
    
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
    localStorage.setItem('hideSeenEpisodes', JSON.stringify(this.hideSeenEpisodes));
    this.filterEpisodes();
  }

  updatePagination() {
    this.itemsPerPage = +this.itemsPerPage; // Ensure it's a number
    this.totalPages = Math.ceil(this.filteredEpisodes.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEpisodes = this.filteredEpisodes.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  changePageSize() {
    this.itemsPerPage = +this.itemsPerPage; // Convert to number
    localStorage.setItem('itemsPerPage', JSON.stringify(this.itemsPerPage));
    this.resetPagination();
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

  skipToSeason(seasonName: string) {
    this.searchTerm = '';
    this.activeArc = seasonName;
    
    const range = ARC_RANGES[seasonName as keyof typeof ARC_RANGES];
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
