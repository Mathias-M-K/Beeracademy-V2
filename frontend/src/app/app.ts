import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  // Without this the host is display:inline, which only lays out correctly in Chrome.
  styles: `
    :host {
      display: grid;
    }
  `
})
export class App {

}
