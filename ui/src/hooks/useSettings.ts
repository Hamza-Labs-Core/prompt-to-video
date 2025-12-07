import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

interface ProviderSettings {
  hasKey: boolean;
  providerName?: string;
  model?: string;
  extraConfig?: Record<string, unknown>;
}

interface Settings {
  llm: ProviderSettings;
  image: ProviderSettings;
  video: ProviderSettings;
  compile: ProviderSettings;
}

interface SaveSettingInput {
  provider: 'llm' | 'image' | 'video' | 'compile';
  apiKey: string;
  providerName?: string;
  model?: string;
  extraConfig?: Record<string, unknown>;
}

export function useSettings() {
  const { getValidToken, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settings, isLoading, error, refetch } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const token = await getValidToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to load settings');
      }

      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (inputs: SaveSettingInput[]) => {
      const token = await getValidToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: inputs }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  // Delete a setting
  const deleteMutation = useMutation({
    mutationFn: async (provider: string) => {
      const token = await getValidToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/settings/${provider}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete setting');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  // Check if all required keys are configured
  const hasRequiredKeys = (): boolean => {
    if (!settings) return false;
    return (
      settings.llm.hasKey &&
      settings.image.hasKey &&
      settings.video.hasKey &&
      (settings.compile.providerName === 'none' || settings.compile.hasKey)
    );
  };

  return {
    settings,
    isLoading,
    error,
    refetch,
    saveSettings: saveMutation.mutateAsync,
    deleteSettting: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    hasRequiredKeys,
  };
}
