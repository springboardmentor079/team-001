const response = {
  description: 'JSON response envelope: success, message, data; errors on failure',
};
const body = (properties: Record<string, unknown>, required: string[]) => ({
  required: true,
  content: {
    'application/json': {
      schema: { type: 'object', properties, required, additionalProperties: false },
    },
  },
});
const str = { type: 'string' };
const secured = { security: [{ bearerAuth: [] }] };
const projectBody = body(
  {
    code: str,
    name: str,
    description: str,
    category: str,
    address: str,
    city: str,
    state: str,
    country: str,
    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    startDate: { type: 'string', format: 'date' },
    endDate: { type: 'string', format: 'date' },
    budget: { type: 'string', example: '2500000.50' },
    estimatedCost: { type: 'string', example: '2000000' },
    notes: str,
    memberIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
  },
  [
    'code',
    'name',
    'category',
    'address',
    'city',
    'state',
    'country',
    'priority',
    'startDate',
    'endDate',
    'budget',
    'estimatedCost',
    'memberIds',
  ],
);
export const apiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'BuildTrack API',
    version: '0.1.0',
    description:
      'Authentication, team administration, projects, schedule, site operations and equipment with scoped access.',
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
  },
  paths: {
    '/api/health': { get: { summary: 'Liveness', responses: { 200: response } } },
    '/api/ready': {
      get: { summary: 'Database readiness', responses: { 200: response, 500: response } },
    },
    '/api/v1/auth/register': {
      post: {
        summary: 'Register a client in an isolated organization',
        requestBody: body(
          {
            name: str,
            email: { type: 'string', format: 'email' },
            company: str,
            phone: str,
            password: { type: 'string', minLength: 12 },
          },
          ['name', 'email', 'company', 'password'],
        ),
        responses: { 201: response, 409: response, 422: response },
      },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'Login; sets HTTP-only refresh cookie',
        requestBody: body({ email: str, password: str, remember: { type: 'boolean' } }, [
          'email',
          'password',
        ]),
        responses: { 200: response, 401: response },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        summary: 'Rotate refresh cookie; requires application Origin and X-BuildTrack-Client: web',
        responses: { 200: response, 401: response, 403: response },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        summary: 'Revoke session; requires application Origin and X-BuildTrack-Client: web',
        responses: { 200: response, 403: response },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: { requestBody: body({ email: str }, ['email']), responses: { 202: response } },
    },
    '/api/v1/auth/reset-password': {
      post: {
        requestBody: body({ token: str, password: str }, ['token', 'password']),
        responses: { 200: response, 400: response },
      },
    },
    '/api/v1/auth/me': {
      get: { ...secured, responses: { 200: response, 401: response } },
      patch: {
        ...secured,
        requestBody: body({ name: str, phone: str }, ['name']),
        responses: { 200: response, 422: response },
      },
    },
    '/api/v1/auth/change-password': {
      post: {
        ...secured,
        requestBody: body({ currentPassword: str, password: str }, ['currentPassword', 'password']),
        responses: { 200: response, 400: response },
      },
    },
    '/api/v1/account/overview': {
      get: { ...secured, responses: { 200: response, 401: response } },
    },
    '/api/v1/users/{id}': {
      patch: {
        ...secured,
        summary: 'Edit a member; role/access/email changes revoke sessions',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: body({ name: str, email: str, role: str, active: { type: 'boolean' } }, [
          'name',
          'email',
          'role',
          'active',
        ]),
        responses: { 200: response, 403: response, 404: response, 409: response, 422: response },
      },
    },
    '/api/v1/users/{id}/reset-password': {
      post: {
        ...secured,
        summary: 'Request reset delivery for an active organization member',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 202: response, 403: response, 404: response, 429: response },
      },
    },
    '/api/v1/users/roles': {
      get: {
        ...secured,
        summary: 'Centralized role permission matrix (administrator only)',
        responses: { 200: response, 403: response },
      },
    },
    '/api/v1/projects': {
      get: {
        ...secured,
        summary: 'Projects visible to the caller; optional filters, sorting and pagination',
        parameters: [
          { in: 'query', name: 'search', schema: str },
          { in: 'query', name: 'status', schema: str },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { in: 'query', name: 'sort', schema: { type: 'string', enum: ['name', 'createdAt', 'startDate', 'endDate', 'status'] } },
          { in: 'query', name: 'direction', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: { 200: response, 403: response, 422: response },
      },
      post: {
        ...secured,
        summary: 'Create a Planning project and assign active organization members',
        requestBody: projectBody,
        responses: { 201: response, 403: response, 409: response, 422: response },
      },
    },
    '/api/v1/projects/team-options': {
      get: {
        ...secured,
        summary: 'Assignable active organization users (project creators only)',
        responses: { 200: response, 403: response },
      },
    },
    '/api/v1/projects/{id}': {
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: {
        ...secured,
        summary: 'Project details; finance fields require BUDGET_VIEW',
        responses: { 200: response, 403: response, 404: response },
      },
      patch: {
        ...secured,
        summary: 'Replace editable project fields and assignments',
        requestBody: projectBody,
        responses: { 200: response, 403: response, 404: response, 409: response, 422: response },
      },
    },
    '/api/v1/projects/{id}/status': {
      patch: {
        ...secured,
        summary: 'Apply an allowed project status transition',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: body(
          {
            status: {
              type: 'string',
              enum: [
                'PLANNING',
                'ACTIVE',
                'ON_HOLD',
                'DELAYED',
                'COMPLETED',
                'CLOSED',
                'CANCELLED',
              ],
            },
          },
          ['status'],
        ),
        responses: { 200: response, 403: response, 404: response, 409: response },
      },
    },
    '/api/v1/projects/{projectId}/schedule': {
      get: {
        ...secured,
        summary: 'List schedule items and calculated progress',
        responses: { 200: response, 403: response, 404: response },
      },
      post: {
        ...secured,
        summary: 'Create a milestone or task with dependency validation',
        responses: { 201: response, 403: response, 409: response, 422: response },
      },
    },
    '/api/v1/projects/{projectId}/schedule/{id}': {
      patch: {
        ...secured,
        summary: 'Update a schedule item using its optimistic version',
        responses: { 200: response, 403: response, 404: response, 409: response, 422: response },
      },
    },
    '/api/v1/projects/{projectId}/site': {
      get: {
        ...secured,
        summary: 'Daily reports, weekly summaries, delays, inspections and activity',
        responses: { 200: response, 403: response, 404: response },
      },
    },
    '/api/v1/projects/{projectId}/site/reports': {
      post: {
        ...secured,
        summary: 'Create a structured daily site report',
        responses: { 201: response, 403: response, 409: response, 422: response },
      },
    },
    '/api/v1/projects/{projectId}/site/reports/{id}/attachments': {
      post: {
        ...secured,
        summary: 'Attach a validated PDF/JPEG/PNG file to a daily report (multipart, 10 MB maximum)',
        responses: { 201: response, 403: response, 404: response, 413: response, 422: response },
      },
    },
    '/api/v1/projects/{projectId}/site/reports/attachments/{attachmentId}/download': {
      get: {
        ...secured,
        summary: 'Download an authorized daily-report attachment',
        responses: { 200: response, 403: response, 404: response },
      },
    },
    '/api/v1/projects/{projectId}/site/delays': {
      post: {
        ...secured,
        summary: 'Report a project delay',
        responses: { 201: response, 403: response, 422: response },
      },
    },
    '/api/v1/projects/{projectId}/site/inspections': {
      post: {
        ...secured,
        summary: 'Record an inspection and findings',
        responses: { 201: response, 403: response, 422: response },
      },
    },
    '/api/v1/equipment': {
      get: {
        ...secured,
        summary: 'Equipment inventory, current state and 12-week time-based utilization',
        responses: { 200: response, 403: response },
      },
      post: {
        ...secured,
        summary: 'Add equipment',
        responses: { 201: response, 403: response, 409: response, 422: response },
      },
    },
    '/api/v1/equipment/{id}/allocations': {
      post: {
        ...secured,
        summary: 'Allocate equipment with overlap and maintenance checks',
        responses: { 201: response, 403: response, 409: response, 422: response },
      },
    },
    '/api/v1/equipment/{id}/maintenance': {
      post: {
        ...secured,
        summary: 'Schedule equipment maintenance',
        responses: { 201: response, 403: response, 409: response, 422: response },
      },
    },
    '/api/v1/inventory': {
      get: {
        ...secured,
        summary: 'Material stock, requests, movement history and threshold summary',
        responses: { 200: response, 403: response },
      },
    },
    '/api/v1/inventory/materials': {
      post: {
        ...secured,
        summary: 'Create a material and opening-stock movement',
        responses: { 201: response, 403: response, 409: response, 422: response },
      },
    },
    '/api/v1/inventory/requests': {
      post: {
        ...secured,
        summary: 'Create a project material request',
        responses: { 201: response, 403: response, 422: response },
      },
    },
    '/api/v1/inventory/requests/{id}/status': {
      patch: {
        ...secured,
        summary: 'Approve, reject, allocate, release or fulfil a material request',
        responses: { 200: response, 403: response, 404: response, 409: response, 422: response },
      },
    },
    '/api/v1/workforce': {
      get: {
        ...secured,
        summary: 'Visible workers, assignments, attendance, shifts and payroll estimates',
        responses: { 200: response, 403: response },
      },
    },
    '/api/v1/workforce/workers': {
      post: {
        ...secured,
        summary: 'Create an organization worker profile',
        responses: { 201: response, 403: response, 409: response, 422: response },
      },
    },
    '/api/v1/workforce/workers/{id}/assignments': {
      post: {
        ...secured,
        summary: 'Assign a worker to an accessible project for a date range',
        responses: { 201: response, 403: response, 404: response, 409: response, 422: response },
      },
    },
    '/api/v1/workforce/attendance': {
      post: {
        ...secured,
        summary: 'Record unique daily attendance for an assigned worker',
        responses: { 201: response, 403: response, 409: response, 422: response },
      },
    },
    '/api/v1/workforce/shifts': {
      post: {
        ...secured,
        summary: 'Schedule a non-overlapping shift for an assigned worker',
        responses: { 201: response, 403: response, 409: response, 422: response },
      },
    },
    '/api/v1/procurement': {
      get: { ...secured, summary: 'Visible vendors, requests, purchase orders, receipts and invoices', responses: { 200: response, 403: response } },
    },
    '/api/v1/procurement/requests': {
      post: { ...secured, summary: 'Create a project procurement request', responses: { 201: response, 403: response, 422: response } },
    },
    '/api/v1/procurement/orders': {
      post: { ...secured, summary: 'Issue an order from an approved request with calculated line totals', responses: { 201: response, 403: response, 409: response, 422: response } },
    },
    '/api/v1/procurement/orders/{id}/receipts': {
      post: { ...secured, summary: 'Idempotently receive all or part of an order and update stock', responses: { 200: response, 201: response, 403: response, 409: response, 422: response } },
    },
    '/api/v1/finance': {
      get: { ...secured, summary: 'Budget, actual, commitment and forecast metrics for visible projects', responses: { 200: response, 403: response } },
    },
    '/api/v1/finance/budgets': {
      post: { ...secured, summary: 'Create a category allocation within the project budget cap', responses: { 201: response, 403: response, 409: response, 422: response } },
    },
    '/api/v1/finance/expenses': {
      post: { ...secured, summary: 'Submit a duplicate-safe expense in organization currency', responses: { 201: response, 403: response, 409: response, 422: response } },
    },
    '/api/v1/documents': {
      get: { ...secured, summary: 'List authorized project documents and safe version metadata', responses: { 200: response, 403: response } },
      post: { ...secured, summary: 'Upload a validated document or new version (multipart, 10 MB maximum)', responses: { 201: response, 403: response, 413: response, 422: response } },
    },
    '/api/v1/documents/{id}': {
      delete: {
        ...secured,
        summary: 'Delete an authorized document, all versions and stored files',
        responses: { 200: response, 403: response, 404: response },
      },
    },
    '/api/v1/documents/versions/{id}/preview': {
      get: {
        ...secured,
        summary: 'Inline preview for an authorized PDF/JPEG/PNG document version',
        responses: { 200: response, 404: response, 415: response },
      },
    },
    '/api/v1/notifications': {
      get: { ...secured, summary: 'Notifications addressed to the authenticated account', responses: { 200: response } },
    },
    '/api/v1/reports/project-summary.pdf': {
      get: { ...secured, summary: 'Generate an authorized project summary PDF from current records', responses: { 200: response, 403: response, 404: response } },
    },
    '/api/v1/reports/expenses.xlsx': {
      get: { ...secured, summary: 'Generate an authorized expense workbook from current records', responses: { 200: response, 403: response, 404: response } },
    },
    '/api/v1/analytics': {
      get: { ...secured, summary: 'Reconciled cross-module portfolio metrics and documented insights', responses: { 200: response, 403: response } },
    },
    '/api/v1/analytics/projects/{id}/weather': {
      get: { ...secured, summary: 'Weather adapter status; returns a clearly labeled demo when unconfigured', responses: { 200: response, 403: response, 404: response } },
    },
    '/api/v1/analytics/projects/{id}/camera-feeds': {
      get: { ...secured, summary: 'Authorized camera adapter status without simulated footage', responses: { 200: response, 403: response, 404: response } },
    },
    '/api/v1/assistant/public': {
      post: {
        summary: 'Public BuildTrack product and access guidance',
        requestBody: body({ message: str, page: str }, ['message', 'page']),
        responses: { 200: response, 422: response, 429: response },
      },
    },
    '/api/v1/assistant/message': {
      post: {
        ...secured,
        summary: 'Page guidance and organization-scoped workspace summary for the signed-in user',
        requestBody: body({ message: str, page: str }, ['message', 'page']),
        responses: { 200: response, 401: response, 422: response, 429: response },
      },
    },
    '/api/v1/ml': {
      get: {
        ...secured,
        summary: 'Authorized schedule, material, cost and equipment-maintenance model results',
        responses: { 200: response, 401: response, 403: response },
      },
    },
    '/api/v1/search': {
      get: {
        ...secured,
        summary: 'Organization and project-scoped global search',
        parameters: [{ in: 'query', name: 'q', required: true, schema: { type: 'string', minLength: 2, maxLength: 100 } }],
        responses: { 200: response, 401: response, 422: response },
      },
    },
    '/api/v1/users': {
      post: {
        ...secured,
        summary: 'Create a member in the administrator organization',
        requestBody: body(
          { name: str, email: str, role: str, password: { type: 'string', minLength: 12 } },
          ['name', 'email', 'role', 'password'],
        ),
        responses: { 201: response, 403: response, 409: response, 422: response },
      },
      get: {
        ...secured,
        summary: 'Users in administrator organization with optional filters, sorting and pagination',
        parameters: [
          { in: 'query', name: 'search', schema: str },
          { in: 'query', name: 'role', schema: str },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { in: 'query', name: 'sort', schema: { type: 'string', enum: ['name', 'createdAt', 'lastLoginAt'] } },
          { in: 'query', name: 'direction', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: { 200: response, 403: response },
      },
    },
  },
};
