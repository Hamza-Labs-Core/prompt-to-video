/**
 * Complete Example: Using the API Client and Hooks
 * 
 * This file demonstrates the full workflow from project creation
 * to video generation using the new API client and React hooks.
 */

import React, { useState } from 'react';
import {
  QueryProvider,
  useCreateProject,
  useProjectManager,
  useGenerationManager,
  type ProjectConfig,
  type VideoStyle,
} from './src';

// =============================================================================
// EXAMPLE 1: Project Creation
// =============================================================================

function CreateProjectExample() {
  const createProject = useCreateProject();
  const [projectId, setProjectId] = useState<string>();

  // User's BYOK configuration
  const config: ProjectConfig = {
    llm: {
      provider: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY!,
      model: 'anthropic/claude-3.5-sonnet',
      temperature: 0.7,
    },
    image: {
      provider: 'fal-flux',
      apiKey: process.env.FAL_API_KEY!,
    },
    video: {
      provider: 'fal-kling',
      apiKey: process.env.FAL_API_KEY!,
    },
    compile: {
      provider: 'creatomate',
      apiKey: process.env.CREATOMATE_API_KEY!,
    },
  };

  const handleCreate = async () => {
    try {
      const project = await createProject.mutateAsync({
        name: 'My Amazing Video',
        concept: 'A journey through a magical forest at sunset',
        targetDuration: 30,
        aspectRatio: '16:9',
        style: 'cinematic' as VideoStyle,
        config,
      });

      setProjectId(project.id);
      console.log('Project created:', project);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div>
      <h2>Create New Project</h2>
      <button 
        onClick={handleCreate}
        disabled={createProject.isPending}
      >
        {createProject.isPending ? 'Creating...' : 'Create Project'}
      </button>

      {createProject.isError && (
        <div className="error">
          Error: {createProject.error?.message}
        </div>
      )}

      {createProject.isSuccess && projectId && (
        <div className="success">
          Project created! ID: {projectId}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXAMPLE 2: Direction Generation & Refinement
// =============================================================================

function DirectionExample({ projectId, config }: { 
  projectId: string; 
  config: ProjectConfig;
}) {
  const [feedback, setFeedback] = useState('');
  const manager = useProjectManager(projectId);

  const handleGenerate = () => {
    manager.generateDirection.mutate({ projectId, config });
  };

  const handleRefine = () => {
    if (!feedback) return;
    manager.refineDirection.mutate({ projectId, feedback, config });
    setFeedback('');
  };

  const handleApprove = () => {
    manager.approveDirection.mutate({ projectId });
  };

  if (manager.isLoading) {
    return <div>Loading project...</div>;
  }

  if (manager.isError) {
    return <div>Error: {manager.error?.message}</div>;
  }

  return (
    <div>
      <h2>Video Direction</h2>

      {/* No direction yet - generate */}
      {!manager.hasDirection && (
        <div>
          <p>No direction generated yet.</p>
          <button 
            onClick={handleGenerate}
            disabled={manager.isDirecting}
          >
            {manager.isDirecting ? 'Generating...' : 'Generate Direction'}
          </button>
        </div>
      )}

      {/* Direction exists - show and allow refinement */}
      {manager.hasDirection && manager.project?.direction && (
        <div>
          <h3>{manager.project.direction.title}</h3>
          <p>{manager.project.direction.narrative}</p>
          
          <div className="cost-estimate">
            <h4>Estimated Cost</h4>
            <ul>
              <li>LLM: ${manager.project.direction.estimatedCost.llm}</li>
              <li>Images: ${manager.project.direction.estimatedCost.images}</li>
              <li>Videos: ${manager.project.direction.estimatedCost.videos}</li>
              <li>Compile: ${manager.project.direction.estimatedCost.compile}</li>
              <li><strong>Total: ${manager.project.direction.estimatedCost.total}</strong></li>
            </ul>
          </div>

          <div className="scenes">
            <h4>Scenes ({manager.project.direction.scenes.length})</h4>
            {manager.project.direction.scenes.map((scene) => (
              <div key={scene.id} className="scene">
                <h5>{scene.name}</h5>
                <p>{scene.description}</p>
                <p>Mood: {scene.mood}</p>
                <p>Shots: {scene.shots.length}</p>
              </div>
            ))}
          </div>

          {/* Refinement */}
          <div className="refine">
            <h4>Refine Direction</h4>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback to refine the direction..."
              disabled={manager.isDirecting}
            />
            <button 
              onClick={handleRefine}
              disabled={!feedback || manager.isDirecting}
            >
              {manager.isDirecting ? 'Refining...' : 'Refine'}
            </button>
          </div>

          {/* Approve */}
          <button 
            onClick={handleApprove}
            disabled={manager.approveDirection.isLoading}
          >
            Approve & Continue to Generation
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXAMPLE 3: Video Generation with Polling
// =============================================================================

function GenerationExample({ projectId, config }: {
  projectId: string;
  config: ProjectConfig;
}) {
  const [jobId, setJobId] = useState<string>();
  
  const manager = useGenerationManager(jobId, {
    pollingInterval: 2000,
    onComplete: (job) => {
      console.log('Video generation complete!', job.finalVideoUrl);
    },
    onError: (job) => {
      console.error('Generation failed:', job.error);
    },
  });

  const handleStart = async () => {
    try {
      const result = await manager.startGeneration.mutateAsync({ 
        projectId, 
        config 
      });
      setJobId(result.jobId);
    } catch (error) {
      console.error('Failed to start generation:', error);
    }
  };

  return (
    <div>
      <h2>Video Generation</h2>

      {/* Start generation */}
      {!jobId && (
        <button 
          onClick={handleStart}
          disabled={manager.startGeneration.isLoading}
        >
          {manager.startGeneration.isLoading ? 'Starting...' : 'Start Generation'}
        </button>
      )}

      {/* Show progress */}
      {jobId && (
        <div>
          <h3>Generation Progress</h3>
          
          {/* Status */}
          <div className="status">
            <p>Status: {manager.currentStatus}</p>
            <progress value={manager.progress} max={100} />
            <span>{manager.progress}%</span>
          </div>

          {/* Scene progress */}
          {manager.job?.scenes.map((scene) => (
            <div key={scene.sceneId} className="scene-progress">
              <p>Scene {scene.sceneId}: {scene.status}</p>
              {scene.startImageUrl && <img src={scene.startImageUrl} alt="Start frame" />}
              {scene.endImageUrl && <img src={scene.endImageUrl} alt="End frame" />}
              {scene.videoUrl && <video src={scene.videoUrl} controls />}
              {scene.error && <p className="error">{scene.error}</p>}
            </div>
          ))}

          {/* Complete */}
          {manager.isComplete && manager.finalVideoUrl && (
            <div className="complete">
              <h3>Video Ready!</h3>
              <video src={manager.finalVideoUrl} controls />
              <a href={manager.finalVideoUrl} download>Download Video</a>
            </div>
          )}

          {/* Failed */}
          {manager.isFailed && (
            <div className="error">
              <h3>Generation Failed</h3>
              <p>{manager.job?.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXAMPLE 4: Complete Workflow
// =============================================================================

function CompleteWorkflowExample() {
  const [step, setStep] = useState<'create' | 'direct' | 'generate'>('create');
  const [projectId, setProjectId] = useState<string>();
  const [jobId, setJobId] = useState<string>();

  const config: ProjectConfig = {
    llm: {
      provider: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY!,
      model: 'anthropic/claude-3.5-sonnet',
    },
    image: {
      provider: 'fal-flux',
      apiKey: process.env.FAL_API_KEY!,
    },
    video: {
      provider: 'fal-kling',
      apiKey: process.env.FAL_API_KEY!,
    },
    compile: {
      provider: 'creatomate',
      apiKey: process.env.CREATOMATE_API_KEY!,
    },
  };

  return (
    <div className="workflow">
      <nav>
        <button onClick={() => setStep('create')}>1. Create</button>
        <button onClick={() => setStep('direct')} disabled={!projectId}>
          2. Direct
        </button>
        <button onClick={() => setStep('generate')} disabled={!projectId}>
          3. Generate
        </button>
      </nav>

      {step === 'create' && (
        <div>
          <CreateProjectExample />
          {projectId && (
            <button onClick={() => setStep('direct')}>
              Continue to Direction
            </button>
          )}
        </div>
      )}

      {step === 'direct' && projectId && (
        <div>
          <DirectionExample projectId={projectId} config={config} />
          <button onClick={() => setStep('generate')}>
            Continue to Generation
          </button>
        </div>
      )}

      {step === 'generate' && projectId && (
        <GenerationExample projectId={projectId} config={config} />
      )}
    </div>
  );
}

// =============================================================================
// APP ROOT
// =============================================================================

export default function App() {
  return (
    <QueryProvider>
      <div className="app">
        <h1>Prompt-to-Video Demo</h1>
        <CompleteWorkflowExample />
      </div>
    </QueryProvider>
  );
}
