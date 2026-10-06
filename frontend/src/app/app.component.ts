import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AssistantComponent } from './shared/assistant/assistant.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AssistantComponent],
  template: '<router-outlet /><bt-assistant />',
})
export class AppComponent {}
