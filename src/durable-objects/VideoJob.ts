import { DurableObject } from 'cloudflare:workers';
import type {
  Env,
  VideoJobState,
  SceneJobState,
  Scene,
  JobStatus,
} from '../types';
import { FalService } from '../services/fal';
import { CreatomateService } from '../services/creatomate';
import { StorageService } from '../services/storage';

// Alarm intervals
const POLL_INTERVAL_MS = 30_000; // 30 seconds
const MAX_POLL_ATTEMPTS = 40; // 20 minutes max for video generation

export class VideoJob extends DurableObject<Env> {
  private state: VideoJobState | null = null;
  private pollAttempts: number = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  /**
   * Initialize or load job state
   */
  private async loadState(): Promise<VideoJobState | null> {
    if (this.state) return this.state;

    try {
      const cursor = this.ctx.storage.sql.exec('SELECT * FROM job_state LIMIT 1');
      const result = cursor.one() as Record<string, unknown> | null;

      if (result) {
        // Parse JSON fields and reconstruct state
        this.state = {
          id: result.id as string,
          projectId: result.projectId as string,
          status: result.status as JobStatus,
          scenes: typeof result.scenes === 'string' ? JSON.parse(result.scenes) : result.scenes,
          finalVideoUrl: result.finalVideoUrl as string | undefined,
          finalVideoR2Key: result.finalVideoR2Key as string | undefined,
          progress: result.progress as number,
          error: result.error as string | undefined,
          createdAt: result.createdAt as string,
          updatedAt: result.updatedAt as string,
        };
      }
    } catch {
      // Table doesn't exist yet
      return null;
    }

    return this.state;
  }

  /**
   * Save job state to SQLite
   */
  private async saveState(): Promise<void> {
    if (!this.state) return;

    // Ensure table exists
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS job_state (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        status TEXT NOT NULL,
        scenes TEXT NOT NULL,
        finalVideoUrl TEXT,
        finalVideoR2Key TEXT,
        progress INTEGER DEFAULT 0,
        error TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Upsert state
    this.ctx.storage.sql.exec(
      `
      INSERT OR REPLACE INTO job_state
      (id, projectId, status, scenes, finalVideoUrl, finalVideoR2Key, progress, error, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      this.state.id,
      this.state.projectId,
      this.state.status,
      JSON.stringify(this.state.scenes),
      this.state.finalVideoUrl || null,
      this.state.finalVideoR2Key || null,
      this.state.progress,
      this.state.error || null,
      this.state.createdAt,
      this.state.updatedAt
    );
  }

  /**
   * Initialize a new job
   */
  async initialize(jobId: string, projectId: string, scenes: Scene[]): Promise<VideoJobState> {
    const now = new Date().toISOString();

    const sceneStates: SceneJobState[] = scenes.map((scene) => ({
      sceneId: scene.id,
      status: 'pending',
    }));

    this.state = {
      id: jobId,
      projectId,
      status: 'pending',
      scenes: sceneStates,
      progress: 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveState();
    return this.state;
  }

  /**
   * Start the video generation pipeline
   */
  async startGeneration(scenes: Scene[], aspectRatio: '16:9' | '9:16' | '1:1'): Promise<void> {
    await this.loadState();
    if (!this.state) throw new Error('Job not initialized');

    // Store scenes and aspect ratio for alarm handler
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS job_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO job_config (key, value) VALUES ('scenes', ?)`,
      JSON.stringify(scenes)
    );
    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO job_config (key, value) VALUES ('aspectRatio', ?)`,
      aspectRatio
    );

    this.state.status = 'generating_images';
    this.state.updatedAt = new Date().toISOString();
    await this.saveState();

    // Start image generation immediately
    await this.generateImages(scenes, aspectRatio);
  }

  /**
   * Generate all start and end images for each scene
   */
  private async generateImages(scenes: Scene[], aspectRatio: '16:9' | '9:16' | '1:1'): Promise<void> {
    if (!this.state) throw new Error('Job not initialized');

    const fal = new FalService(this.env.FAL_API_KEY);

    try {
      // Generate images for each scene (in sequence to avoid rate limits)
      for (const scene of scenes) {
        const sceneState = this.state.scenes.find((s) => s.sceneId === scene.id);
        if (!sceneState) continue;

        // Generate start image
        sceneState.status = 'generating_start_image';
        this.updateProgress();
        await this.saveState();

        const startResult = await fal.generateImage(scene.startPrompt, aspectRatio);
        sceneState.startImageUrl = startResult.images[0].url;

        // Generate end image
        sceneState.status = 'generating_end_image';
        this.updateProgress();
        await this.saveState();

        const endResult = await fal.generateImage(scene.endPrompt, aspectRatio);
        sceneState.endImageUrl = endResult.images[0].url;
      }

      // All images generated, move to video generation
      this.state.status = 'images_complete';
      this.updateProgress();
      await this.saveState();

      // Start video generation
      await this.startVideoGeneration(scenes, aspectRatio);
    } catch (error) {
      this.state.status = 'failed';
      this.state.error = error instanceof Error ? error.message : 'Image generation failed';
      await this.saveState();
    }
  }

  /**
   * Start video generation for all scenes
   */
  private async startVideoGeneration(scenes: Scene[], aspectRatio: '16:9' | '9:16' | '1:1'): Promise<void> {
    if (!this.state) throw new Error('Job not initialized');

    const fal = new FalService(this.env.FAL_API_KEY);

    this.state.status = 'generating_videos';
    await this.saveState();

    try {
      // Submit all video generation requests
      for (const scene of scenes) {
        const sceneState = this.state.scenes.find((s) => s.sceneId === scene.id);
        if (!sceneState || !sceneState.startImageUrl || !sceneState.endImageUrl) continue;

        sceneState.status = 'generating_video';

        const result = await fal.submitVideoGeneration(
          scene.motionPrompt,
          sceneState.startImageUrl,
          sceneState.endImageUrl,
          aspectRatio,
          String(scene.duration) as '5' | '10'
        );

        sceneState.videoRequestId = result.request_id;
        sceneState.status = 'polling_video';
      }

      this.updateProgress();
      await this.saveState();

      // Set alarm to poll for video completion
      this.pollAttempts = 0;
      await this.ctx.storage.setAlarm(Date.now() + POLL_INTERVAL_MS);
    } catch (error) {
      this.state.status = 'failed';
      this.state.error = error instanceof Error ? error.message : 'Video generation failed';
      await this.saveState();
    }
  }

  /**
   * Alarm handler - polls for video completion
   */
  async alarm(): Promise<void> {
    await this.loadState();
    if (!this.state) return;

    // Don't poll if job is complete or failed
    if (this.state.status === 'complete' || this.state.status === 'failed') {
      return;
    }

    this.pollAttempts++;

    // Check if we've exceeded max attempts
    if (this.pollAttempts > MAX_POLL_ATTEMPTS) {
      this.state.status = 'failed';
      this.state.error = 'Video generation timed out';
      await this.saveState();
      return;
    }

    const fal = new FalService(this.env.FAL_API_KEY);

    try {
      let allComplete = true;
      let anyFailed = false;

      for (const sceneState of this.state.scenes) {
        if (sceneState.status !== 'polling_video' || !sceneState.videoRequestId) continue;

        const status = await fal.checkVideoStatus(sceneState.videoRequestId);

        if (status.status === 'COMPLETED') {
          // Fetch the actual result
          const result = await fal.getVideoResult(sceneState.videoRequestId);
          sceneState.videoUrl = result.video.url;
          sceneState.status = 'complete';
        } else if (status.status === 'FAILED') {
          sceneState.status = 'failed';
          sceneState.error = 'Video generation failed';
          anyFailed = true;
        } else {
          // Still in progress
          allComplete = false;
        }
      }

      this.updateProgress();
      await this.saveState();

      if (anyFailed) {
        this.state.status = 'failed';
        this.state.error = 'One or more videos failed to generate';
        await this.saveState();
        return;
      }

      if (allComplete) {
        this.state.status = 'videos_complete';
        await this.saveState();

        // Start compilation
        await this.compileVideo();
      } else {
        // Schedule next poll
        await this.ctx.storage.setAlarm(Date.now() + POLL_INTERVAL_MS);
      }
    } catch (error) {
      // Retry on transient errors
      console.error('Poll error:', error);
      await this.ctx.storage.setAlarm(Date.now() + POLL_INTERVAL_MS);
    }
  }

  /**
   * Compile all videos into final output
   */
  private async compileVideo(): Promise<void> {
    if (!this.state) throw new Error('Job not initialized');

    this.state.status = 'compiling';
    await this.saveState();

    const creatomate = new CreatomateService(this.env.CREATOMATE_API_KEY);

    try {
      // Get all video URLs in order
      const videoUrls = this.state.scenes
        .sort((a, b) => a.sceneId - b.sceneId)
        .map((s) => s.videoUrl)
        .filter((url): url is string => !!url);

      if (videoUrls.length === 0) {
        throw new Error('No videos to compile');
      }

      // Get aspect ratio from config
      const aspectRatioCursor = this.ctx.storage.sql.exec("SELECT value FROM job_config WHERE key = 'aspectRatio'");
      const aspectRatioResult = aspectRatioCursor.one() as Record<string, unknown> | null;
      const aspectRatio = ((aspectRatioResult?.value as string) || '16:9') as '16:9' | '9:16' | '1:1';

      // Submit compilation request
      const render = await creatomate.compileVideo(videoUrls, {
        aspectRatio,
        transitionDuration: 0.5,
        transitionType: 'crossfade',
        finalHoldDuration: 3,
      });

      // Store render ID and poll for completion
      this.ctx.storage.sql.exec(
        `INSERT OR REPLACE INTO job_config (key, value) VALUES ('renderId', ?)`,
        render.id
      );

      // Poll for render completion
      await this.pollRenderCompletion(render.id);
    } catch (error) {
      this.state.status = 'failed';
      this.state.error = error instanceof Error ? error.message : 'Compilation failed';
      await this.saveState();
    }
  }

  /**
   * Poll for render completion (called from alarm or directly)
   */
  private async pollRenderCompletion(renderId: string): Promise<void> {
    if (!this.state) return;

    const creatomate = new CreatomateService(this.env.CREATOMATE_API_KEY);

    const maxAttempts = 60; // 30 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      const render = await creatomate.checkRenderStatus(renderId);

      if (render.status === 'succeeded' && render.url) {
        this.state.finalVideoUrl = render.url;
        this.state.status = 'complete';
        this.state.progress = 100;
        await this.saveState();
        return;
      }

      if (render.status === 'failed') {
        throw new Error(render.error_message || 'Render failed');
      }

      // Wait 30 seconds before next check
      await new Promise((resolve) => setTimeout(resolve, 30_000));
      attempts++;
    }

    throw new Error('Render timed out');
  }

  /**
   * Update progress percentage based on current state
   */
  private updateProgress(): void {
    if (!this.state) return;

    const totalSteps = this.state.scenes.length * 3 + 1; // 3 steps per scene + compilation
    let completedSteps = 0;

    for (const scene of this.state.scenes) {
      if (scene.startImageUrl) completedSteps++;
      if (scene.endImageUrl) completedSteps++;
      if (scene.videoUrl) completedSteps++;
    }

    if (this.state.status === 'complete') {
      completedSteps = totalSteps;
    }

    this.state.progress = Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Get current job state
   */
  async getState(): Promise<VideoJobState | null> {
    return this.loadState();
  }

  /**
   * Handle HTTP requests to this Durable Object
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/state' && request.method === 'GET') {
        const state = await this.getState();
        return Response.json(state);
      }

      if (path === '/initialize' && request.method === 'POST') {
        const { jobId, projectId, scenes } = await request.json() as {
          jobId: string;
          projectId: string;
          scenes: Scene[];
        };
        const state = await this.initialize(jobId, projectId, scenes);
        return Response.json(state);
      }

      if (path === '/start' && request.method === 'POST') {
        const { scenes, aspectRatio } = await request.json() as {
          scenes: Scene[];
          aspectRatio: '16:9' | '9:16' | '1:1';
        };
        await this.startGeneration(scenes, aspectRatio);
        return Response.json({ success: true });
      }

      return new Response('Not found', { status: 404 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Response.json({ error: message }, { status: 500 });
    }
  }
}
