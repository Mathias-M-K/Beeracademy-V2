import {Directive, effect, inject, TemplateRef, ViewContainerRef} from '@angular/core';
import {GameService} from '../services/game/game.service';

@Directive({
  selector: '[isPlayer]',
})
export class IsPlayerDirective {
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly gameService = inject(GameService);

  constructor() {
    effect(() => {
      const isPlayer = this.gameService.isPlayer();

      this.viewContainer.clear();

      if (isPlayer) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
