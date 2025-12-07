import type { Env, Project, Scene, CreateProjectRequest, ApiResponse, VideoJobState } from './types';
import { VideoJob } from './durable-objects/VideoJob';

// Export Durable Object class
export { VideoJob };

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper to create JSON response
function jsonResponse<T>(data: ApiResponse<T>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Helper to generate unique IDs
function generateId(): string {
  return crypto.randomUUID();
}

// Router
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only handle /api/* routes - serve static assets for everything else
  if (!path.startsWith('/api/')) {
    // Serve static assets from the ASSETS binding (handles SPA routing automatically)
    return env.ASSETS.fetch(request);
  }

  try {
    // Health check
    if (path === '/api/health') {
      return jsonResponse({ success: true, data: { status: 'ok', version: '1.0.0' } });
    }

    // === PROJECT ENDPOINTS ===

    // Create a new project
    if (path === '/api/projects' && method === 'POST') {
      const body = await request.json() as CreateProjectRequest;

      if (!body.name || !body.scenes || body.scenes.length === 0) {
        return jsonResponse({ success: false, error: 'Name and scenes are required' }, 400);
      }

      const project: Project = {
        id: generateId(),
        name: body.name,
        scenes: body.scenes.map((scene, index) => ({
          ...scene,
          id: index + 1,
        })),
        aspectRatio: body.aspectRatio || '16:9',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store project in KV
      await env.CACHE.put(`project:${project.id}`, JSON.stringify(project));

      return jsonResponse({ success: true, data: project }, 201);
    }

    // Get a project
    if (path.match(/^\/api\/projects\/[\w-]+$/) && method === 'GET') {
      const projectId = path.split('/').pop()!;
      const projectData = await env.CACHE.get(`project:${projectId}`);

      if (!projectData) {
        return jsonResponse({ success: false, error: 'Project not found' }, 404);
      }

      const project: Project = JSON.parse(projectData);
      return jsonResponse({ success: true, data: project });
    }

    // List all projects
    if (path === '/api/projects' && method === 'GET') {
      const list = await env.CACHE.list({ prefix: 'project:' });
      const projects: Project[] = [];

      for (const key of list.keys) {
        const data = await env.CACHE.get(key.name);
        if (data) {
          projects.push(JSON.parse(data));
        }
      }

      return jsonResponse({ success: true, data: projects });
    }

    // === VIDEO GENERATION ENDPOINTS ===

    // Start video generation for a project
    if (path.match(/^\/api\/projects\/[\w-]+\/generate$/) && method === 'POST') {
      const projectId = path.split('/')[3];
      const projectData = await env.CACHE.get(`project:${projectId}`);

      if (!projectData) {
        return jsonResponse({ success: false, error: 'Project not found' }, 404);
      }

      const project: Project = JSON.parse(projectData);
      const jobId = generateId();

      // Get Durable Object stub
      const doId = env.VIDEO_JOB.idFromName(jobId);
      const stub = env.VIDEO_JOB.get(doId);

      // Initialize the job
      await stub.fetch(new Request('http://internal/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          projectId: project.id,
          scenes: project.scenes,
        }),
      }));

      // Start generation
      await stub.fetch(new Request('http://internal/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: project.scenes,
          aspectRatio: project.aspectRatio,
        }),
      }));

      // Store job reference
      await env.CACHE.put(`job:${jobId}`, JSON.stringify({ projectId, jobId }));
      await env.CACHE.put(`project:${projectId}:currentJob`, jobId);

      return jsonResponse({
        success: true,
        data: {
          jobId,
          projectId,
          status: 'generating_images',
          message: 'Video generation started',
        },
      }, 202);
    }

    // Get job status
    if (path.match(/^\/api\/jobs\/[\w-]+$/) && method === 'GET') {
      const jobId = path.split('/').pop()!;

      // Get Durable Object stub
      const doId = env.VIDEO_JOB.idFromName(jobId);
      const stub = env.VIDEO_JOB.get(doId);

      const response = await stub.fetch(new Request('http://internal/state', {
        method: 'GET',
      }));

      const state: VideoJobState = await response.json();

      if (!state) {
        return jsonResponse({ success: false, error: 'Job not found' }, 404);
      }

      return jsonResponse({ success: true, data: state });
    }

    // Get current job for a project
    if (path.match(/^\/api\/projects\/[\w-]+\/job$/) && method === 'GET') {
      const projectId = path.split('/')[3];
      const jobId = await env.CACHE.get(`project:${projectId}:currentJob`);

      if (!jobId) {
        return jsonResponse({ success: false, error: 'No active job for this project' }, 404);
      }

      // Get Durable Object stub
      const doId = env.VIDEO_JOB.idFromName(jobId);
      const stub = env.VIDEO_JOB.get(doId);

      const response = await stub.fetch(new Request('http://internal/state', {
        method: 'GET',
      }));

      const state: VideoJobState = await response.json();

      return jsonResponse({ success: true, data: state });
    }

    // === TEMPLATE ENDPOINTS ===

    // Get Hamza Labs template
    if (path === '/api/templates/hamza-labs' && method === 'GET') {
      const { HAMZA_LABS_SCENES } = await import('./data/scenes');
      return jsonResponse({
        success: true,
        data: {
          name: 'Hamza Labs Forge Video',
          description: 'Epic blacksmith forge video revealing the Hamza Labs emblem',
          scenes: HAMZA_LABS_SCENES,
          aspectRatio: '16:9',
          estimatedDuration: 45,
        },
      });
    }

    // Create project from Hamza Labs template
    if (path === '/api/templates/hamza-labs/create' && method === 'POST') {
      const { HAMZA_LABS_SCENES } = await import('./data/scenes');

      const project: Project = {
        id: generateId(),
        name: 'Hamza Labs Forge Video',
        scenes: HAMZA_LABS_SCENES,
        aspectRatio: '16:9',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await env.CACHE.put(`project:${project.id}`, JSON.stringify(project));

      return jsonResponse({ success: true, data: project }, 201);
    }

    // 404 for unknown routes
    return jsonResponse({ success: false, error: 'Not found' }, 404);

  } catch (error) {
    console.error('Request error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ success: false, error: message }, 500);
  }
}

// Worker entry point
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env);
  },
};
