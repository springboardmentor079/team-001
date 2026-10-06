import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ApiResponse, errorMessage } from '../../core/models';

interface SchedulePrediction {
  id: string; projectCode: string; projectName: string; name: string; plannedDate: string;
  probability: number; band: string; reasons: string[];
}
interface MaterialForecast {
  id: string; sku: string; name: string; unit: string; available: string; weeksObserved: number;
  expectedWeeklyDemand: string | null; weeksOfCover: number | null; stockoutDate: string | null; status: string;
}
interface CostPrediction {
  id: string; code: string; name: string; budget: string; actual: string; commitment: string;
  deterministicForecast: string; modelEstimate: string; expectedAtCompletion: string;
  expectedVariancePercent: number; reasons: string[];
}
interface EquipmentPrediction {
  id: string; code: string; name: string; type: string; daysSinceService: number;
  serviceIntervalDays: number; nextServiceDate: string; failureProbability: number | null;
  band: string; reasons: string[];
}
interface MlInsights {
  generatedAt: string;
  scheduleDelay: {
    model: string; version: string; status: string; trainingSamples: number; delayedSamples: number;
    minimumRequired: string; trainingDiagnostic: { brierScore: number; note: string } | null;
    predictions: SchedulePrediction[];
  };
  costAtCompletion: {
    model: string; version: string; status: string; currency: string; trainingSamples: number;
    minimumRequired: string; trainingDiagnostic: { rootMeanSquaredErrorRatio: number; note: string } | null;
    predictions: CostPrediction[];
  };
  equipmentMaintenance: null | {
    model: string; version: string; status: string; trainingSamples: number; failureSamples: number;
    minimumRequired: string; trainingDiagnostic: { brierScore: number; note: string } | null;
    assets: EquipmentPrediction[];
  };
  materialDemand: null | { model: string; version: string; alpha: number; minimumRequired: string; forecasts: MaterialForecast[] };
  safeguards: string[];
}

@Component({
  selector: 'bt-ml-insights',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './ml-insights.component.html',
  styles: [`
    .model-banner{display:grid;grid-template-columns:1.4fr 1.2fr;gap:20px;padding:28px;margin:22px 0;background:#10243b;color:#fff;border-radius:12px}.model-banner p{color:#aebdca;line-height:1.7;margin-top:8px}.model-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.model-meta div{background:#ffffff0d;border:1px solid #ffffff14;border-radius:8px;padding:13px}.model-meta strong,.model-meta small{display:block}.model-meta strong{font-size:20px;color:#ff9852}.model-meta small{color:#9cadbc;margin-top:5px}.ml-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin:22px 0}.ml-card{padding:24px}.cost-card,.maintenance-card{grid-column:1/-1}.ml-card header{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:18px}.ml-card header p,.model-note{color:#738092;font-size:12px;margin-top:6px;line-height:1.6}.model-list{display:flex;flex-direction:column}.prediction{display:grid;grid-template-columns:1fr auto;gap:14px;padding:16px 0;border-top:1px solid #e8edf1}.prediction:first-child{border-top:0}.prediction h3{font-size:13px}.prediction p{color:#6f7c8c;font-size:11px;margin-top:5px}.prediction ul{margin:7px 0 0;padding-left:17px;color:#84909c;font-size:10px}.score{text-align:right}.score strong{display:block;font-size:22px}.score small{font-size:9px;letter-spacing:1px}.score.high strong,.status-high{color:#bb3030}.score.medium strong,.status-medium{color:#c66b17}.score.low strong,.status-low{color:#15845e}.empty-model{padding:25px;background:#f7f9fa;border:1px dashed #ccd4dc;border-radius:8px;color:#697686}.empty-model strong{display:block;color:#29384b;margin-bottom:7px}.forecast-row{display:grid;grid-template-columns:1.3fr repeat(3,.7fr);gap:12px;align-items:center;padding:15px 0;border-top:1px solid #e8edf1;font-size:11px}.forecast-row:first-child{border-top:0}.forecast-row strong,.forecast-row small{display:block}.forecast-row small{color:#83909f;margin-top:4px}.cost-row{grid-template-columns:1.3fr repeat(4,.75fr)}.cost-row ul{margin:6px 0 0;padding-left:15px;color:#84909c}.equipment-row{grid-template-columns:1.4fr .7fr .8fr .8fr}.equipment-row ul{margin:6px 0 0;padding-left:15px;color:#84909c}.safeguards{padding:24px;margin-bottom:22px}.safeguards ul{margin:15px 0 0;padding-left:18px;color:#6f7d8d;line-height:1.9}@media(max-width:1050px){.model-meta{grid-template-columns:1fr 1fr}}@media(max-width:900px){.model-banner,.ml-grid{grid-template-columns:1fr}.cost-card,.maintenance-card{grid-column:auto}.forecast-row{grid-template-columns:1fr 1fr}}@media(max-width:560px){.model-meta{grid-template-columns:1fr}.forecast-row{grid-template-columns:1fr}.prediction{grid-template-columns:1fr}.score{text-align:left}}
  `],
})
export class MlInsightsComponent {
  private http = inject(HttpClient);
  readonly data = signal<MlInsights | null>(null);
  readonly error = signal('');
  constructor() {
    this.http.get<ApiResponse<MlInsights>>('/api/v1/ml').subscribe({
      next: (response) => this.data.set(response.data),
      error: (error) => this.error.set(errorMessage(error)),
    });
  }
}
