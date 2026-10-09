# Machine learning opportunities for BuildTrack

BuildTrack already captures structured project, schedule, site, equipment, inventory, workforce, procurement, finance and document data. The ML implementation at `/ml-insights` now includes organization-scoped schedule-delay classification, material-demand forecasting, cost-at-completion regression and equipment failure classification. Each model discloses its evidence requirements and withholds predictions when data is insufficient. Existing analytics rules and configured service intervals remain the explainable baselines.

## Implemented models

The development seed makes all four models immediately demonstrable. It includes 12 completed schedule outcomes, 12 financially settled closed projects, 12 weekly demand observations for each of three materials, and 14 completed equipment-maintenance outcomes. The records are labelled `DEMO_ML_TRAINING_DATA` or described as synthetic so they can be identified and replaced with verified organization data later. New records entered through the normal product pages automatically become part of subsequent organization-scoped training runs.

- **Schedule delay v1:** trains in memory from completed schedule items visible to the signed-in user. It requires at least 12 completed items with at least three late and three on-time outcomes. Features include planned duration, dependency presence, work-item type, project priority and recorded delays. The page shows an in-sample Brier diagnostic and explicitly requires holdout validation before operational reliance.
- **Material demand v1:** aggregates outbound stock movements into weekly demand, applies exponential smoothing with `alpha = 0.45`, and reports expected weekly demand and weeks of available stock cover. It requires at least two observed demand weeks per material.
- **Cost at completion v1:** trains ridge regression from financially settled closed projects. Features include estimate-to-budget ratio, planned duration and priority. It requires 10 closed projects with varied cost outcomes, compares its estimate with the deterministic actual-plus-commitment forecast, and never reports less than already incurred or committed cost.
- **Equipment maintenance v1:** trains logistic regression from completed maintenance outcomes. Features include service-interval overrun, recent allocation intensity, asset age and open high-priority maintenance. It requires 12 outcomes with at least three failure-related and three preventive records. Until then, every asset still receives an explainable service-interval due date without a fabricated failure probability.
- All four implementations are read-only decision support. They do not approve, reject or modify any record.

## Demo dataset and expected outcomes

Run `npm run db:seed` in development, sign in as `admin@buildtrack.local`, and open `/ml-insights`.

| Product decision | Why ML is used | Implemented algorithm | Seed evidence | Result shown |
| ---------------- | -------------- | --------------------- | ------------- | ------------ |
| Schedule planning | Learn combinations associated with late completion instead of relying on one fixed overdue rule | L2-regularized binary logistic regression trained with gradient descent | 12 completed items: six late and six on time | Delay probability, risk band and contributing features for open items |
| Inventory planning | Recent material usage should influence the next requirement more than older usage | Single exponential smoothing with `alpha = 0.45` | 12 weekly outbound observations for each of cement, steel and bricks | Expected weekly demand, stock cover and projected stock-out date |
| Cost control | Estimate the final cost ratio from patterns across settled projects while limiting unstable coefficients | Ridge regression trained with gradient descent | 12 closed projects with varied budgets, estimates, durations, priorities and final costs | Model estimate, expected completion cost and variance from budget |
| Equipment maintenance | Learn which service-overrun, utilization, age and priority patterns are associated with failures | L2-regularized binary logistic regression trained with gradient descent | 14 completed outcomes: seven failures and seven preventive services | Failure probability, risk band, next service date and reasons |

These records are demonstration data, not evidence that a model is production-ready. The diagnostics on the page are in-sample checks. Replace the synthetic records with your own historical outcomes and evaluate on a time-based holdout set before relying on predictions operationally.

## Recommended order

| Priority | Use case                         | Data already available                                                          | Suggested output                                                                | First model                                          |
| -------- | -------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1        | Schedule-delay prediction        | Planned dates, dependencies, progress, delays, attendance, reports              | Probability that a task or milestone will finish late; top contributing factors | Gradient-boosted trees with calibrated probabilities |
| 2        | Cost-at-completion forecasting   | Budgets, approved/paid expenses, POs, invoices, progress                        | Expected final cost and confidence range                                        | Gradient boosting or regularized regression          |
| 3        | Material-demand forecasting      | Stock movements, requests, receipts, schedule and project type                  | Quantity needed by material and week; likely stock-out date                     | Time-series baseline, then boosted regression        |
| 4        | Predictive equipment maintenance | Usage/allocation history, maintenance, downtime and equipment type              | Failure risk or days until service                                              | Survival model or gradient boosting                  |
| 5        | Safety-risk prediction           | Daily reports, workforce hours, inspection findings, delay pressure and weather | Daily project risk band with reasons                                            | Interpretable classification model                   |
| 6        | Document intelligence            | Uploaded drawings, contracts, invoices and reports                              | Document category, extracted fields, duplicate/version suggestion               | OCR plus document classifier/extractor               |
| 7        | Procurement anomaly detection    | Vendors, prices, quantities, receipts, invoices and approval history            | Unusual unit prices, split orders, duplicate invoices or receipt patterns       | Rules followed by isolation forest/outlier model     |
| 8        | Workforce planning               | Schedule demand, trade/skill, attendance, shifts and progress                   | Suggested crew size by project and week                                         | Forecasting plus constrained optimization            |

## Where each model appears in the product

### Project and schedule pages

Show a delay probability beside each open task or milestone, with the three strongest contributing factors. A useful first target is “completed after planned date.” Train only on closed historical items and split evaluation by project and time so records from the same project do not leak into both training and testing.

### Finance and analytics

Add an expected-at-completion amount and prediction interval next to the existing rule-based actual plus commitment forecast. Inputs can include progress, elapsed schedule percentage, approved change costs, procurement commitments, invoice velocity and cost category. Keep the deterministic forecast visible so users can compare it with the model.

### Inventory and procurement

Forecast weekly material consumption and highlight likely stock-outs. Procurement anomaly detection can flag a price that differs materially from the same material, region or vendor history. A flag should open an explanation and require human review; it should never automatically accuse or block a vendor.

### Equipment

Estimate maintenance risk from age, operating days, allocation intensity, previous service categories and time since last maintenance. Predictions become more useful when meter readings, failure reasons and downtime hours are added to the schema.

### Site operations and safety

Combine open inspection findings, consecutive long shifts, workforce density, unresolved delays, weather and report text into a next-day risk score. Use this only to prioritize inspections. Do not use it for automatic worker discipline or employment decisions.

### Documents

Use OCR and document models to classify uploads, extract invoice/PO fields, identify drawing numbers and suggest whether a file is a new document or a version. Require the uploader to confirm extracted values before they enter financial or procurement records.

### Workforce

Forecast required crew size and skills from the look-ahead schedule and prior productivity. Avoid individual performance scoring. Workforce recommendations should operate at team, trade and project level to reduce unfair employment impacts.

## Data work required before training

1. Define each prediction target and the decision it supports.
2. Record consistent reason codes for delays, maintenance, inspection findings and cost changes.
3. Add event timestamps and retain historical snapshots rather than overwriting model inputs.
4. Measure missing values, outliers and differences between project types.
5. Create time-based training, validation and holdout sets.
6. Establish baseline rules and business metrics before testing a model.
7. Version datasets, features and models; log the model version used for every prediction.

## Evaluation and safeguards

- Delay and safety models: precision, recall, calibration and lead time before the event.
- Cost forecasts: mean absolute error and interval coverage by project category and size.
- Demand forecasts: weighted absolute percentage error and avoided stock-out days.
- Maintenance: recall at the number of assets the maintenance team can actually inspect.
- Monitor drift, missing inputs and performance separately across project types and locations.
- Display confidence and contributing factors with every prediction.
- Let authorized users dismiss or correct predictions and capture that feedback.
- Keep approvals, payments, safety actions and employment decisions under human control.
- Exclude protected personal attributes and proxy features from workforce-related models.

## Practical rollout

Begin by exporting a read-only feature dataset from PostgreSQL into a separate training environment. Train offline in Python with scikit-learn or XGBoost, register the approved model artifact, then expose inference through a versioned internal service. The Express API should remain the authorization boundary and should record prediction inputs, model version and output. Start with shadow predictions visible only to administrators, compare them with actual outcomes, and enable broader use only after calibration and operational review.
