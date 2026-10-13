import {
  AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

/** Palette used across every chart so the app looks consistent. */
export const CHART_COLORS = [
  '#4f46e5', '#0d9488', '#f59e0b', '#ef4444', '#9333ea',
  '#0ea5e9', '#84cc16', '#ec4899', '#64748b', '#14b8a6',
];

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `
    <div class="chart-box" [style.height.px]="height">
      <canvas #canvas></canvas>
      @if (isEmpty) {
        <div class="chart-empty">No data to show yet</div>
      }
    </div>
  `,
  styles: [`
    .chart-box { position: relative; width: 100%; }
    .chart-empty {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      color: #9ca3af; font-size: 0.85rem; background: rgba(255,255,255,0.85); border-radius: 8px;
    }
  `],
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  @Input() type: ChartType = 'bar';
  @Input() labels: string[] = [];
  /** One entry per series. For pie/doughnut pass a single series. */
  @Input() series: { label: string; data: number[] }[] = [];
  @Input() height = 240;
  @Input() stacked = false;
  @Input() currency = false;

  private chart?: Chart;
  /** Parents often pass freshly built arrays every change-detection pass, so we
   *  compare the actual data and only redraw when it really changed. */
  private lastSignature = '';

  private signature(): string {
    return JSON.stringify([this.type, this.labels, this.series, this.stacked, this.currency]);
  }

  get isEmpty(): boolean {
    return this.series.every((s) => s.data.every((v) => !v));
  }

  ngAfterViewInit(): void {
    this.lastSignature = this.signature();
    this.render();
  }

  ngOnChanges(): void {
    if (!this.chart) return;
    const sig = this.signature();
    if (sig === this.lastSignature) return;
    this.lastSignature = sig;
    this.render();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    this.chart?.destroy();
    const circular = this.type === 'pie' || this.type === 'doughnut';
    const datasets = this.series.map((s, i) => ({
      label: s.label,
      data: s.data,
      backgroundColor: circular
        ? this.labels.map((_, idx) => CHART_COLORS[idx % CHART_COLORS.length])
        : CHART_COLORS[i % CHART_COLORS.length],
      borderColor: circular ? '#ffffff' : CHART_COLORS[i % CHART_COLORS.length],
      borderWidth: circular ? 2 : 1,
      borderRadius: circular ? 0 : 6,
    }));

    const fmt = (v: number | string) =>
      this.currency ? '₹' + Number(v).toLocaleString('en-IN') : Number(v).toLocaleString('en-IN');

    const config: ChartConfiguration = {
      type: this.type,
      data: { labels: this.labels, datasets: datasets as any },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: circular || this.series.length > 1, position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label ? ctx.dataset.label + ': ' : ''}${fmt(ctx.parsed.y ?? (ctx.parsed as any))}`,
            },
          },
        },
        scales: circular
          ? {}
          : {
              x: { stacked: this.stacked, grid: { display: false } },
              y: {
                stacked: this.stacked,
                beginAtZero: true,
                ticks: { precision: 0, callback: (v) => fmt(v as number) },
              },
            },
      },
    };
    this.chart = new Chart(this.canvas.nativeElement, config);
  }
}
