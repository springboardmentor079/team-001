import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DocumentService } from '../../../core/services/document.service';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { DocumentItem, Project } from '../../../core/models/domain.model';
import { formatBytes, saveBlobResponse } from '../../../core/util/download';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './documents.component.html',
})
export class DocumentsComponent implements OnInit {
  documents = signal<DocumentItem[]>([]);
  projects = signal<Project[]>([]);
  selectedFile = signal<File | null>(null);
  selectedProject = signal<number | null>(null);
  filterProject = signal<number | null>(null);
  uploading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  formatBytes = formatBytes;

  constructor(
    private documentService: DocumentService,
    private projectService: ProjectService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fetch();
    this.projectService.list().subscribe((p) => this.projects.set(p));
  }

  get canUpload(): boolean {
    return this.authService.hasRole('admin', 'project_manager', 'site_engineer', 'contractor');
  }

  visible(): DocumentItem[] {
    const f = this.filterProject();
    return f ? this.documents().filter((d) => d.project_id === f) : this.documents();
  }

  projectName(id: number | null): string {
    return this.projects().find((p) => p.id === id)?.name ?? '—';
  }

  canDelete(doc: DocumentItem): boolean {
    return this.authService.hasRole('admin', 'project_manager') || doc.uploaded_by === this.authService.currentUser()?.id;
  }

  fetch(): void {
    this.documentService.list().subscribe((d) => this.documents.set(d));
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  onProjectChange(value: string): void {
    this.selectedProject.set(value ? Number(value) : null);
  }

  onFilterChange(value: string): void {
    this.filterProject.set(value ? Number(value) : null);
  }

  upload(fileInput: HTMLInputElement): void {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Choose a file first.');
      return;
    }
    this.uploading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.documentService.upload(file, this.selectedProject()).subscribe({
      next: (doc) => {
        this.uploading.set(false);
        this.successMessage.set(`"${doc.filename}" uploaded.`);
        this.selectedFile.set(null);
        fileInput.value = '';
        this.fetch();
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMessage.set(err?.error?.detail || 'Upload failed.');
      },
    });
  }

  download(doc: DocumentItem): void {
    this.documentService.download(doc.id).subscribe({
      next: (res) => saveBlobResponse(res, doc.filename),
      error: () => this.errorMessage.set('Could not download this file.'),
    });
  }

  remove(doc: DocumentItem): void {
    if (!confirm(`Delete "${doc.filename}"?`)) return;
    this.documentService.delete(doc.id).subscribe({
      next: () => this.fetch(),
      error: (err) => this.errorMessage.set(err?.error?.detail || 'Could not delete.'),
    });
  }
}
