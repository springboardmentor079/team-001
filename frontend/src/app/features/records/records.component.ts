import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ApiResponse, errorMessage } from '../../core/models';

interface Project { id: string; code: string; name: string; status: string }
interface Version { id: string; version: number; filename: string; mimeType: string; size: number; checksum: string; createdAt: string; uploadedBy: { name: string } | null }
interface DocumentRecord { id: string; title: string; category: string; project: { id: string; name: string }; versions: Version[] }
@Component({ selector: 'bt-records', imports: [ReactiveFormsModule, DatePipe, DecimalPipe], templateUrl: './records.component.html' })
export class RecordsComponent {
  private http = inject(HttpClient); private fb = inject(FormBuilder);
  readonly auth = inject(AuthService); readonly projects = signal<Project[]>([]); readonly documents = signal<DocumentRecord[]>([]);
  readonly showUpload = signal(false); readonly busy = signal(false); readonly error = signal(''); readonly message = signal('');
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  readonly form = this.fb.nonNullable.group({ projectId: ['', Validators.required], title: ['', Validators.required], category: ['Drawing', Validators.required], documentId: [''] });
  readonly reportProjectId = signal('');
  constructor() { this.load(); }
  can(permission: string) { return !!this.auth.user()?.permissions.includes(permission); }
  load() {
    this.http.get<ApiResponse<DocumentRecord[]>>('/api/v1/documents').subscribe({ next: (r) => this.documents.set(r.data), error: (e) => this.error.set(errorMessage(e)) });
    this.http.get<ApiResponse<Project[]>>('/api/v1/projects').subscribe((r) => { this.projects.set(r.data); if (!this.reportProjectId() && r.data[0]) this.reportProjectId.set(r.data[0].id); });
  }
  chooseVersion(document: DocumentRecord) { this.showUpload.set(true); this.form.reset({ projectId: document.project.id, title: document.title, category: document.category, documentId: document.id }); }
  upload() {
    const file = this.fileInput?.nativeElement.files?.[0]; if (this.form.invalid || !file) { this.error.set('Choose a valid file and complete the document details.'); return; }
    const body = new FormData(); Object.entries(this.form.getRawValue()).forEach(([key, value]) => body.append(key, value)); body.append('file', file);
    this.busy.set(true); this.http.post<ApiResponse<DocumentRecord>>('/api/v1/documents', body).pipe(finalize(() => this.busy.set(false))).subscribe({ next: (r) => { this.message.set(r.message); this.showUpload.set(false); this.load(); }, error: (e) => this.error.set(errorMessage(e)) });
  }
  downloadVersion(version: Version) { this.download(`/api/v1/documents/versions/${version.id}/download`, version.filename); }
  downloadReport(kind: 'pdf' | 'xlsx') {
    const project = this.projects().find((row) => row.id === this.reportProjectId()); if (!project) return;
    const url = kind === 'pdf' ? `/api/v1/reports/project-summary.pdf?projectId=${project.id}` : `/api/v1/reports/expenses.xlsx?projectId=${project.id}`;
    this.download(url, `${project.code}-${kind === 'pdf' ? 'summary.pdf' : 'expenses.xlsx'}`);
  }
  private download(url: string, filename: string) {
    this.http.get(url, { responseType: 'blob' }).subscribe({ next: (blob) => { const href = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = href; anchor.download = filename; anchor.click(); URL.revokeObjectURL(href); }, error: (e) => this.error.set(errorMessage(e)) });
  }
}
