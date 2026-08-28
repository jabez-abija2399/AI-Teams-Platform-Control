// We use 'use client' because this file relies on React state and lifecycle hooks (useState, useEffect), which only run in the browser.
'use client';

// Import necessary React hooks for managing state and side effects.
import { useState, useEffect } from 'react';
// Import our strict Zod-inferred types to guarantee exact alignment with the backend schema.
import type { WorkflowProgress, ApiResponse } from '@/packages/schema';

// Define the shape of the object this custom hook will return to consumers.
interface UsePipelineStateReturn {
  // The workflow data, which may be null if it hasn't loaded yet.
  workflow: WorkflowProgress | null;
  // A boolean indicating if the initial fetch is still processing.
  isLoading: boolean;
  // A string containing an error message if the fetch fails, or null if successful.
  error: string | null;
}

// Export the custom hook. It accepts a projectId to know which pipeline to track.
export function usePipelineState(projectId: string): UsePipelineStateReturn {
  // Initialize state to hold the workflow progress data.
  const [workflow, setWorkflow] = useState<WorkflowProgress | null>(null);
  // Initialize state to track the loading status, starting as true.
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Initialize state to hold any potential error messages.
  const [error, setError] = useState<string | null>(null);

  // Use the useEffect hook to trigger data fetching when the component mounts or the projectId changes.
  useEffect(() => {
    // If no projectId is provided (e.g., during some edge case routing), exit early.
    if (!projectId) return;

    // Define an async function to fetch the data from our Next.js API route.
    const fetchProgress = async () => {
      try {
        // Perform a GET request to the workflows endpoint for this specific project.
        const res = await fetch(`/api/projects/${projectId}/workflows`);
        
        // If the HTTP response is not 200 OK, throw an error to be caught below.
        if (!res.ok) throw new Error('Failed to fetch pipeline state');
        
        // Parse the JSON response. We know the API wraps the data in a { workflows: [] } object.
        const data = await res.json();
        
        // Ensure the API returned an array and it has at least one workflow.
        if (data.workflows && data.workflows.length > 0) {
          // Update the state with the first workflow (since there is only one active pipeline per project).
          setWorkflow(data.workflows[0]);
          // Clear any previous errors.
          setError(null);
        }
      } catch (err: any) {
        // If the fetch fails (network error, 500, etc.), update the error state.
        setError(err.message || 'An unknown error occurred');
      } finally {
        // Regardless of success or failure, mark the initial loading phase as complete.
        setIsLoading(false);
      }
    };

    // Immediately invoke the fetch function on mount.
    void fetchProgress();

    // Set up an interval to poll the API every 3000ms (3 seconds) to keep the UI in sync real-time.
    const interval = setInterval(() => {
      void fetchProgress();
    }, 3000);

    // Return a cleanup function that React will call when the component unmounts.
    // This destroys the interval, preventing memory leaks and unnecessary network requests.
    return () => clearInterval(interval);
    
    // The dependency array ensures this effect re-runs ONLY if the projectId changes.
  }, [projectId]);

  // Return the encapsulated state so components can easily consume it.
  return { workflow, isLoading, error };
}
