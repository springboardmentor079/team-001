import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface ChartSeries {
  name: string;
  values: (number | null)[];
  color?: string;
}

@Component({
  selector: 'bt-data-chart',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="data-chart" [class.compact]="compact">
      <header>
        <div>
          <h2>{{ title }}</h2>
          @if (subtitle) {
            <p>{{ subtitle }}</p>
          }
        </div>
        @if (sourceLabel) {
          <span class="chart-source">{{ sourceLabel }}</span>
        }
      </header>

      @if (hasData()) {
        <div class="chart-legend" aria-hidden="true">
          @for (item of series; track item.name; let index = $index) {
            <span><i [style.background]="color(index)"></i>{{ item.name }}</span>
          }
        </div>

        @if (kind === 'line') {
          <svg class="chart-svg" viewBox="0 0 720 290" role="img" [attr.aria-label]="ariaLabel()">
            <g class="chart-grid">
              @for (tick of ticks(); track tick) {
                <line x1="64" x2="700" [attr.y1]="y(tick)" [attr.y2]="y(tick)" />
                <text x="56" [attr.y]="y(tick) + 4" text-anchor="end">{{ short(tick) }}</text>
              }
            </g>
            @for (item of series; track item.name; let seriesIndex = $index) {
              @for (path of paths(item.values); track path) {
                <path class="chart-line" [attr.d]="path" [attr.stroke]="color(seriesIndex)" />
              }
              @for (value of item.values; track $index; let pointIndex = $index) {
                @if (value !== null) {
                  <circle
                    class="chart-point"
                    [attr.cx]="x(pointIndex)"
                    [attr.cy]="y(value)"
                    r="4"
                    [attr.fill]="color(seriesIndex)"
                    tabindex="0"
                  >
                    <title>{{ labels[pointIndex] }} · {{ item.name }}: {{ display(value) }}</title>
                  </circle>
                }
              }
            }
            <g class="chart-axis-labels">
              @for (label of labels; track $index; let index = $index) {
                @if (showAxisLabel(index)) {
                  <text [attr.x]="x(index)" y="278" text-anchor="middle">
                    {{ axisLabel(label) }}
                  </text>
                }
              }
            </g>
          </svg>
        } @else if (kind === 'bar') {
          <svg
            class="chart-svg bar-svg"
            viewBox="0 0 720 330"
            role="img"
            [attr.aria-label]="ariaLabel()"
          >
            <g class="bar-grid">
              @for (tick of barTicks(); track tick) {
                <line [attr.x1]="barX(tick)" [attr.x2]="barX(tick)" y1="18" y2="292" />
                <text [attr.x]="barX(tick)" y="316" text-anchor="middle">{{ display(tick) }}</text>
              }
            </g>
            @for (label of labels; track $index; let row = $index) {
              <text class="bar-label" x="4" [attr.y]="barY(row) + 8">{{ truncate(label) }}</text>
              @for (item of series; track item.name; let seriesIndex = $index) {
                @if (item.values[row] !== null) {
                  <rect
                    class="chart-bar"
                    x="178"
                    [attr.y]="barY(row) + seriesIndex * barHeight()"
                    [attr.width]="barWidth(item.values[row]!)"
                    [attr.height]="barHeight() - 3"
                    rx="3"
                    [attr.fill]="color(seriesIndex)"
                    tabindex="0"
                  >
                    <title>{{ label }} · {{ item.name }}: {{ display(item.values[row]!) }}</title>
                  </rect>
                }
              }
            }
          </svg>
        } @else {
          <div class="donut-layout" role="img" [attr.aria-label]="ariaLabel()">
            <svg class="donut-svg" viewBox="0 0 220 220" aria-hidden="true">
              <circle class="donut-track" cx="110" cy="110" r="76" />
              @for (segment of donutSegments(); track segment.label) {
                <circle
                  class="donut-segment"
                  cx="110"
                  cy="110"
                  r="76"
                  pathLength="100"
                  [attr.stroke]="segment.color"
                  [attr.stroke-dasharray]="segment.value + ' ' + (100 - segment.value)"
                  [attr.stroke-dashoffset]="-segment.offset"
                  tabindex="0"
                >
                  <title>
                    {{ segment.label }}: {{ segment.raw }} ({{ segment.value | number: '1.0-1' }}%)
                  </title>
                </circle>
              }
              <text x="110" y="103" text-anchor="middle" class="donut-total">{{ total() }}</text>
              <text x="110" y="125" text-anchor="middle" class="donut-caption">TOTAL RECORDS</text>
            </svg>
            <div class="donut-legend">
              @for (segment of donutSegments(); track segment.label) {
                <div>
                  <i [style.background]="segment.color"></i><span>{{ segment.label }}</span
                  ><strong>{{ segment.raw }} · {{ segment.value | number: '1.0-1' }}%</strong>
                </div>
              }
            </div>
          </div>
        }

        <details class="chart-table">
          <summary>View chart data</summary>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  @for (item of series; track item.name) {
                    <th>{{ item.name }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (label of labels; track $index; let row = $index) {
                  <tr>
                    <th>{{ label }}</th>
                    @for (item of series; track item.name) {
                      <td>
                        {{ item.values[row] === null ? 'No record' : display(item.values[row]!) }}
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </details>
      } @else {
        <div class="chart-empty">
          <strong>No recorded data for this view</strong
          ><span>Change the filters or add source records to populate this chart.</span>
        </div>
      }
    </article>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .data-chart {
      height: 100%;
      padding: 22px;
      background: #fff;
      border: 1px solid #e1e8e2;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(23, 63, 48, 0.055);
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: flex-start;
    }
    h2 {
      font-size: 16px;
      color: #202b25;
      margin: 0;
    }
    header p {
      margin: 6px 0 0;
      color: #68756d;
      font-size: 12px;
      line-height: 1.5;
    }
    .chart-source {
      padding: 5px 8px;
      border-radius: 6px;
      background: #e7f0e9;
      color: #245c45;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.7px;
      white-space: nowrap;
    }
    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin: 18px 0 4px;
      color: #68756d;
      font-size: 10px;
    }
    .chart-legend span {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .chart-legend i,
    .donut-legend i {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 2px;
    }
    .chart-svg {
      display: block;
      width: 100%;
      height: auto;
      max-height: 310px;
      overflow: visible;
    }
    .chart-grid line,
    .bar-grid line {
      stroke: #e8eee9;
      stroke-width: 1;
    }
    .chart-grid text,
    .bar-grid text,
    .chart-axis-labels text {
      fill: #77847c;
      font-size: 9px;
    }
    .chart-line {
      fill: none;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 900;
      animation: draw-chart 0.8s ease both;
    }
    .chart-point {
      stroke: #fff;
      stroke-width: 2;
      transition: r 0.16s ease;
    }
    .chart-point:hover,
    .chart-point:focus {
      r: 6;
      outline: none;
    }
    .bar-label {
      fill: #3e4b44;
      font-size: 10px;
    }
    .chart-bar {
      transform-origin: left;
      animation: grow-bar 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both;
      transition: opacity 0.16s;
    }
    .chart-bar:hover,
    .chart-bar:focus {
      opacity: 0.8;
      outline: none;
    }
    .donut-layout {
      display: grid;
      grid-template-columns: minmax(180px, 240px) 1fr;
      gap: 20px;
      align-items: center;
      padding: 8px 0;
    }
    .donut-svg {
      width: 100%;
      max-width: 220px;
      margin: auto;
      transform: rotate(-90deg);
    }
    .donut-track,
    .donut-segment {
      fill: none;
      stroke-width: 24;
    }
    .donut-track {
      stroke: #edf1ee;
    }
    .donut-segment {
      transition: stroke-width 0.18s;
      animation: reveal-ring 0.65s ease both;
    }
    .donut-segment:hover,
    .donut-segment:focus {
      stroke-width: 28;
      outline: none;
    }
    .donut-total,
    .donut-caption {
      transform: rotate(90deg);
      transform-origin: 110px 110px;
      fill: #202b25;
    }
    .donut-total {
      font-size: 28px;
      font-weight: 800;
    }
    .donut-caption {
      font-size: 8px;
      letter-spacing: 1.2px;
      fill: #68756d;
    }
    .donut-legend {
      display: grid;
      gap: 10px;
    }
    .donut-legend div {
      display: grid;
      grid-template-columns: 10px 1fr auto;
      gap: 8px;
      align-items: center;
      font-size: 11px;
    }
    .donut-legend span {
      color: #68756d;
    }
    .donut-legend strong {
      color: #202b25;
    }
    .chart-table {
      margin-top: 8px;
      border-top: 1px solid #edf1ee;
      padding-top: 10px;
    }
    .chart-table summary {
      cursor: pointer;
      color: #397653;
      font-size: 10px;
      font-weight: 800;
    }
    .table-scroll {
      overflow: auto;
      margin-top: 10px;
    }
    .chart-table table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .chart-table th,
    .chart-table td {
      padding: 8px;
      border-bottom: 1px solid #edf1ee;
      text-align: left;
      white-space: nowrap;
    }
    .chart-table th {
      color: #526057;
    }
    .chart-empty {
      min-height: 230px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      color: #68756d;
    }
    .chart-empty strong {
      color: #36433c;
      margin-bottom: 7px;
    }
    .chart-empty span {
      font-size: 11px;
      max-width: 320px;
    }
    .compact {
      box-shadow: none;
    }
    @keyframes draw-chart {
      from {
        stroke-dashoffset: 900;
      }
      to {
        stroke-dashoffset: 0;
      }
    }
    @keyframes grow-bar {
      from {
        transform: scaleX(0);
      }
    }
    @keyframes reveal-ring {
      from {
        stroke-dasharray: 0 100;
      }
    }
    @media (max-width: 620px) {
      .data-chart {
        padding: 17px;
      }
      .donut-layout {
        grid-template-columns: 1fr;
      }
      .bar-svg {
        min-width: 620px;
      }
      .data-chart:has(.bar-svg) {
        overflow-x: auto;
      }
      .chart-source {
        display: none;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .chart-line,
      .chart-bar,
      .donut-segment {
        animation: none !important;
        transition: none !important;
      }
    }
  `,
})
export class DataChartComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() sourceLabel = 'DATABASE';
  @Input() kind: 'line' | 'bar' | 'donut' = 'line';
  @Input() labels: string[] = [];
  @Input() series: ChartSeries[] = [];
  @Input() unit = '';
  @Input() compact = false;
  @Input() colors = ['#245C45', '#477BA8', '#D99128', '#C84C4C', '#6F8F7A', '#8B6FA8'];

  private values() {
    return this.series
      .flatMap((item) => item.values)
      .filter((value): value is number => value !== null);
  }
  hasData() {
    return this.values().some((value) => value !== 0) || this.values().length > 0;
  }
  max() {
    return Math.max(1, ...this.values());
  }
  total() {
    return this.series[0]?.values.reduce<number>((total, value) => total + (value || 0), 0) || 0;
  }
  color(index: number) {
    return this.series[index]?.color || this.colors[index % this.colors.length]!;
  }
  x(index: number) {
    return this.labels.length <= 1 ? 382 : 64 + (index * 636) / (this.labels.length - 1);
  }
  y(value: number) {
    return 250 - (Math.max(0, value) / this.max()) * 218;
  }
  ticks() {
    const max = this.max();
    return [0, max / 2, max];
  }
  paths(values: (number | null)[]) {
    const paths: string[] = [];
    let path = '';
    values.forEach((value, index) => {
      if (value === null) {
        if (path) paths.push(path);
        path = '';
      } else path += `${path ? ' L' : 'M'} ${this.x(index)} ${this.y(value)}`;
    });
    if (path) paths.push(path);
    return paths;
  }
  showAxisLabel(index: number) {
    return (
      this.labels.length <= 7 ||
      index % Math.ceil(this.labels.length / 7) === 0 ||
      index === this.labels.length - 1
    );
  }
  axisLabel(label: string) {
    const date = new Date(`${label}T00:00:00Z`);
    return Number.isNaN(date.getTime())
      ? this.truncate(label, 12)
      : date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  }
  short(value: number) {
    if (Math.abs(value) >= 10_000_000) return `${(value / 10_000_000).toFixed(1)}Cr`;
    if (Math.abs(value) >= 100_000) return `${(value / 100_000).toFixed(1)}L`;
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return Number(value.toFixed(1)).toString();
  }
  display(value: number) {
    return `${this.unit === '₹' ? '₹' : ''}${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value)}${this.unit === '%' ? '%' : this.unit && this.unit !== '₹' ? ` ${this.unit}` : ''}`;
  }
  truncate(label: string, length = 24) {
    return label.length > length ? `${label.slice(0, length - 1)}…` : label;
  }
  barTicks() {
    const max = this.max();
    return [0, max / 2, max];
  }
  barX(value: number) {
    return 178 + (value / this.max()) * 520;
  }
  barY(index: number) {
    return 22 + index * Math.min(50, 266 / Math.max(1, this.labels.length));
  }
  barHeight() {
    return Math.min(16, 28 / Math.max(1, this.series.length));
  }
  barWidth(value: number) {
    return Math.max(0, (value / this.max()) * 520);
  }
  donutSegments() {
    const values = this.series[0]?.values || [];
    const total = this.total();
    let offset = 0;
    return this.labels.map((label, index) => {
      const raw = values[index] || 0;
      const value = total ? (raw / total) * 100 : 0;
      const segment = {
        label: label.replaceAll('_', ' '),
        raw,
        value,
        offset,
        color: this.colors[index % this.colors.length]!,
      };
      offset += value;
      return segment;
    });
  }
  ariaLabel() {
    return `${this.title}. ${this.series.map((item) => `${item.name}: ${item.values.map((value, index) => `${this.labels[index]} ${value === null ? 'no record' : this.display(value)}`).join(', ')}`).join('. ')}`;
  }
}
