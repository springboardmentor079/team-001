import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { filter, finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ApiResponse, errorMessage } from '../../core/models';
import { IconComponent } from '../../core/icon.component';

interface ChatMessage { from: 'assistant' | 'user'; text: string }
interface AssistantReply { answer: string; mode: string; privateDataUsed: boolean }

@Component({
  selector: 'bt-assistant',
  imports: [FormsModule, IconComponent],
  templateUrl: './assistant.component.html',
  styleUrl: './assistant.component.scss',
})
export class AssistantComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  readonly auth = inject(AuthService);
  readonly open = signal(false);
  readonly busy = signal(false);
  readonly page = signal(this.router.url);
  readonly messages = signal<ChatMessage[]>([
    { from: 'assistant', text: 'Hi, I’m the BuildTrack assistant. I can explain this page, summarize your workspace, or show where predictive insights can help.' },
  ]);
  draft = '';

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.page.set((event as NavigationEnd).urlAfterRedirects);
    });
  }

  toggle() {
    this.open.update((value) => !value);
  }

  get suggestions() {
    if (this.auth.user()) return ['Summarize my workspace', 'How do I use this page?', 'Where can ML help?'];
    return ['What can BuildTrack do?', 'How do I sign in?', 'Where can ML help?'];
  }

  ask(value?: string) {
    const message = (value ?? this.draft).trim();
    if (!message || this.busy()) return;
    this.draft = '';
    this.messages.update((items) => [...items, { from: 'user', text: message }]);
    this.busy.set(true);
    const endpoint = this.auth.user() ? '/api/v1/assistant/message' : '/api/v1/assistant/public';
    this.http.post<ApiResponse<AssistantReply>>(endpoint, { message, page: this.page() })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (response) => this.messages.update((items) => [...items, { from: 'assistant', text: response.data.answer }]),
        error: (error) => this.messages.update((items) => [...items, { from: 'assistant', text: errorMessage(error) }]),
      });
  }
}
