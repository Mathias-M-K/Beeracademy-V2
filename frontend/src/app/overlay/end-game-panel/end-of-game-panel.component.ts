import {Component, computed, inject, signal} from '@angular/core';
import {GameService} from '../../services/game/game.service';
import {AnimatedText} from '../../common/components/animated-text/animated-text';
import {
  ParticipantBadge
} from '../../pages/lobby-page/participant-overview/participant/participant-badge/participant-badge';
import {tweenedNumber} from '../../common/tweened-number';
import {DecimalPipe} from '@angular/common';

interface EndOfGamePage{
  achievementTitle: string;
  statValue: number;
  statUnit: string;
  explanation: string;

  playerName: string;
  playerColor: string;

  id: number;
}

@Component({
  imports: [
    AnimatedText,
    ParticipantBadge,
    DecimalPipe
  ],
  selector: 'app-end-game-panel',
  styleUrl: './end-of-game-panel.component.scss',
  templateUrl: './end-of-game-panel.component.html',
  host: {
    '[style.--background-color]':'pages[currentPageIndex()].playerColor'
  }
})
export class EndOfGamePanel {

  private readonly gameService = inject(GameService);

  protected readonly pages: EndOfGamePage[] = [
    {achievementTitle: '',statValue: 0, statUnit: '', explanation: '', playerName: '', playerColor: 'var(--nice-black)', id: 0},
    {achievementTitle: 'Hurtigste bund',statValue: 2.24, statUnit: 's', explanation: 'Pretty cool', playerName: 'Mathias', playerColor: '#27ae60', id: 1},
    {achievementTitle: 'Flest øl drukket',statValue: 8.3, statUnit: 'øl', explanation: '180 tåre over 13 øl', playerName: 'Lasse', playerColor: '#3498db', id: 2},
    {achievementTitle: 'Hurtigst gennemsnit',statValue: 50.5, statUnit: 's', explanation: 'Ret hurtigt', playerName: 'Frederik', playerColor: '#9b59b6', id: 3},
    {achievementTitle: 'Langsommeste bund',statValue: 15.50, statUnit: 's', explanation: 'Langsomt', playerName: 'Jakob', playerColor: '#34495e', id: 4},
    {achievementTitle: 'Ingen bunder!',statValue: 0, statUnit: 'bunde', explanation: 'Heldigt', playerName: 'Andreas', playerColor: '#f1c40f', id: 5},
    {achievementTitle: '',statValue: 0, statUnit: '', explanation: '', playerName: '', playerColor: 'var(--nice-black)', id: 6},
  ]

  protected isStartPage = computed(()=>this.currentPageIndex() === 0);
  protected isSummaryPage = computed(()=>this.currentPageIndex() === this.pages.length-1);
  protected isAchievementPage = computed(()=> !this.isStartPage() && !this.isSummaryPage());

  protected readonly currentPageIndex= signal<number>(0);
  private readonly currentPage = computed(()=> this.pages[this.currentPageIndex()]);

  private readonly _statValue = computed(()=>this.currentPage().statValue);
  protected readonly statValue = tweenedNumber(this._statValue);


  protected players = this.gameService.players;



}
