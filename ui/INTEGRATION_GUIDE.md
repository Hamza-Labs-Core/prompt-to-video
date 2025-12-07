# Frontend Integration Guide

## Overview

The API client and shared types have been created to integrate with the prompt-to-video Cloudflare Worker backend. All files are located in `/home/meywd/prompt-to-video/ui/src/`.

## File Structure

```
ui/src/
├── types/
│   ├── index.ts          # Complete type definitions (243 lines)
│   └── job.ts            # Job-specific types (existing)
├── lib/
│   ├── api.ts            # API client with error handling
│   ├── queryClient.ts    # React Query configuration
│   └── utils.ts          # Existing utilities
├── hooks/
│   ├── index.ts          # Hook exports
│   ├── useProject.ts     # Project management hooks
│   ├── useGeneration.ts  # Generation & polling hooks
│   ├── useJobStatus.ts   # Existing job status hook
│   └── useConfig.ts      # Existing config hook
├── providers/
│   └── QueryProvider.tsx # React Query provider
└── index.ts              # Main exports
```

## Key Features

### 1. Type Safety

All types match the backend exactly:

```typescript
import type { 
  Project, 
  VideoDirection, 
  ProjectConfig,
  VideoJobState 
} from './types';
```

### 2. API Client

Centralized API client with automatic config injection:

```typescript
import { api } from './lib/api';

// Config is automatically included in requests
const project = await api.createProject(
  name,
  concept,
  targetDuration,
  aspectRatio,
  config  // <- BYOK config
);

const direction = await api.generateDirection(projectId, config);
```

### 3. Error Handling

Typed errors for better error handling:

```typescript
import { 
  ApiClientError, 
  NetworkError, 
  ValidationError, 
  ServerError 
} from './lib/api';

try {
  await api.createProject(...);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof NetworkError) {
    // Handle network errors
  }
}
```

### 4. React Hooks

Easy-to-use hooks for all operations:

```typescript
import { 
  useProjectManager,
  useGenerationManager 
} from './hooks';

// Project management
const project = useProjectManager(projectId);
project.generateDirection.mutate({ projectId, config });
project.refineDirection.mutate({ projectId, feedback, config });

// Generation with auto-polling
const generation = useGenerationManager(jobId, {
  pollingInterval: 2000,
  onComplete: (job) => console.log('Done!', job.finalVideoUrl),
});
```

### 5. Automatic Polling

Job status polling automatically stops when complete/failed:

```typescript
const generation = useGenerationManager(jobId, {
  pollingInterval: 2000,  // Poll every 2s
  onComplete: (job) => {
    console.log('Video ready:', job.finalVideoUrl);
  },
  onError: (job) => {
    console.error('Failed:', job.error);
  },
});

// Auto-updates as job progresses
console.log(generation.progress);      // 0-100
console.log(generation.currentStatus); // 'generating_images'
console.log(generation.isComplete);    // false
```

## Integration Steps

### Step 1: Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Step 2: Wrap App with QueryProvider

Update `ui/src/main.tsx`:

```tsx
import { QueryProvider } from './providers/QueryProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </React.StrictMode>
);
```

### Step 3: Use Hooks in Components

Replace direct fetch calls with hooks:

**Before:**
```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const generateDirection = async () => {
  setLoading(true);
  try {
    const res = await fetch(`/api/projects/${id}/direct`, { method: 'POST' });
    const data = await res.json();
    // ...
  } catch (err) {
    setError(err);
  } finally {
    setLoading(false);
  }
};
```

**After:**
```tsx
import { useGenerateDirection } from './hooks';

const generateDirection = useGenerateDirection();

const handleGenerate = () => {
  generateDirection.mutate({ projectId, config });
};

// Access state
generateDirection.isPending;
generateDirection.isError;
generateDirection.error;
```

### Step 4: Update Environment Variables

Create `ui/.env`:

```env
VITE_API_URL=http://localhost:8787
```

For production:
```env
VITE_API_URL=https://your-worker.workers.dev
```

## Migration Checklist

- [ ] Install React Query dependencies
- [ ] Wrap app with QueryProvider
- [ ] Update HomePage to use useCreateProject
- [ ] Update ProjectPage to use useProjectManager
- [ ] Update GeneratePage to use useGenerationManager
- [ ] Replace direct fetch calls with API client
- [ ] Add error handling with typed errors
- [ ] Test all flows: create → direct → refine → approve → generate
- [ ] Test error scenarios
- [ ] Configure API URL in environment

## API Endpoints Required

The frontend expects these backend endpoints:

```
POST   /api/projects              - Create project
GET    /api/projects              - List projects
GET    /api/projects/:id          - Get project
DELETE /api/projects/:id          - Delete project
POST   /api/projects/:id/direct   - Generate direction
POST   /api/projects/:id/refine   - Refine direction
POST   /api/projects/:id/approve  - Approve direction
POST   /api/projects/:id/generate - Start generation
GET    /api/jobs/:id              - Get job status
```

All POST requests expect `config` in the request body.

## Benefits

1. **Type Safety**: Full TypeScript support with backend type matching
2. **Better UX**: Automatic caching, background refetching, optimistic updates
3. **Error Handling**: Typed errors with proper error states
4. **Less Boilerplate**: Hooks handle loading/error/success states
5. **Auto Polling**: Job status updates automatically
6. **DevTools**: Built-in React Query devtools for debugging
7. **Resilience**: Smart retry logic with exponential backoff

## Examples

See `ui/README.md` for detailed usage examples.

## Next Steps

1. Integrate hooks into existing components
2. Remove manual fetch/loading/error state management
3. Add optimistic updates where appropriate
4. Test with real backend API
5. Configure proper error boundaries
