import {Directive, effect, inject, TemplateRef, ViewContainerRef} from '@angular/core';
import {GameService} from '../services/game/game.service';

@Directive({
  selector: '[isGameOwner]',
})
export class IsGameOwnerDirective {

  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly gameService = inject(GameService);

  constructor() {
    effect(() => {
      const isGameOwner = this.gameService.isGameClient();

      this.viewContainer.clear();

      if (isGameOwner) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
