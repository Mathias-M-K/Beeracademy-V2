import {ChangeDetectionStrategy, Component} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-welcome-page',
  imports: [],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomePage {

  constructor(private router: Router) {
  }

  public onCreateGameBtnClicked(){
    this.router.navigate(['/create']);
  }

}
