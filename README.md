# Prompt to Video

AI-powered video generation pipeline using Cloudflare Workers, fal.ai, and Creatomate.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE WORKER                             │
│  API Endpoints: /api/projects, /api/jobs, /api/templates             │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      DURABLE OBJECT (VideoJob)                       │
│  - Tracks job state & progress                                       │
│  - Uses Alarms to poll external APIs                                 │
│  - Orchestrates the pipeline steps                                   │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              ┌─────────┐    ┌───────────┐   ┌────────────┐
              │   R2    │    │  fal.ai   │   │ Creatomate │
              │ Storage │    │ Flux/Kling│   │  Compile   │
              └─────────┘    └───────────┘   └────────────┘
```

## Pipeline Flow

1. **Image Generation** (fal.ai Flux) - Generate start/end frames for each scene
2. **Video Generation** (fal.ai Kling O1) - Create video transitions between frames
3. **Compilation** (Creatomate) - Stitch videos with transitions and audio

## Setup

### Prerequisites

- Node.js 18+
- Cloudflare account with Workers paid plan (for Durable Objects)
- fal.ai API key
- Creatomate API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Cloudflare Resources

```bash
# Login to Cloudflare
npx wrangler login

# Create R2 bucket
npx wrangler r2 bucket create prompt-to-video-media

# Create KV namespace
npx wrangler kv namespace create CACHE
# Copy the ID and update wrangler.toml
```

### 3. Set Secrets

```bash
# fal.ai API key
npx wrangler secret put FAL_API_KEY

# Creatomate API key
npx wrangler secret put CREATOMATE_API_KEY
```

### 4. Update wrangler.toml

Update the KV namespace ID in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

### 5. Run Development Server

```bash
npm run dev
```

### 6. Deploy

```bash
npm run deploy
```

## API Endpoints

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/:id` | Get project details |
| POST | `/api/projects/:id/generate` | Start video generation |
| GET | `/api/projects/:id/job` | Get current job status |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/:id` | Get job status and progress |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates/hamza-labs` | Get Hamza Labs template |
| POST | `/api/templates/hamza-labs/create` | Create project from template |

## Usage Examples

### Create Project from Template

```bash
# Create project from Hamza Labs template
curl -X POST https://your-worker.workers.dev/api/templates/hamza-labs/create

# Response
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Hamza Labs Forge Video",
    "scenes": [...],
    "aspectRatio": "16:9"
  }
}
```

### Start Video Generation

```bash
# Start generation
curl -X POST https://your-worker.workers.dev/api/projects/abc123/generate

# Response
{
  "success": true,
  "data": {
    "jobId": "job-xyz",
    "status": "generating_images",
    "message": "Video generation started"
  }
}
```

### Check Job Status

```bash
# Check progress
curl https://your-worker.workers.dev/api/jobs/job-xyz

# Response
{
  "success": true,
  "data": {
    "id": "job-xyz",
    "status": "generating_videos",
    "progress": 45,
    "scenes": [
      { "sceneId": 1, "status": "complete", "videoUrl": "..." },
      { "sceneId": 2, "status": "polling_video" },
      ...
    ]
  }
}
```

### Create Custom Project

```bash
curl -X POST https://your-worker.workers.dev/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Custom Video",
    "aspectRatio": "16:9",
    "scenes": [
      {
        "name": "Scene 1",
        "startPrompt": "Dark room, mysterious atmosphere...",
        "endPrompt": "Bright lit room, warm lighting...",
        "motionPrompt": "Lights slowly turning on, warmth spreading",
        "duration": 5
      }
    ]
  }'
```

## Job Statuses

| Status | Description |
|--------|-------------|
| `pending` | Job created, waiting to start |
| `generating_images` | Generating start/end frame images |
| `images_complete` | All images generated |
| `generating_videos` | Submitting video generation requests |
| `videos_complete` | All videos generated |
| `compiling` | Compiling final video |
| `complete` | Final video ready |
| `failed` | Job failed (check error field) |

## Cost Estimation

| Service | Cost |
|---------|------|
| fal.ai Flux (16 images) | ~$0.50 |
| fal.ai Kling O1 (8 x 5s videos) | ~$4.50 |
| Creatomate (1 render) | ~$0.50 |
| **Total per video** | **~$5.50** |

## Project Structure

```
src/
├── index.ts                 # Worker entry point & API routes
├── types.ts                 # TypeScript types
├── data/
│   └── scenes.ts            # Hamza Labs scene prompts
├── durable-objects/
│   └── VideoJob.ts          # Job orchestration Durable Object
└── services/
    ├── fal.ts               # fal.ai API client
    ├── creatomate.ts        # Creatomate API client
    └── storage.ts           # R2 storage helpers
```

## License

MIT
