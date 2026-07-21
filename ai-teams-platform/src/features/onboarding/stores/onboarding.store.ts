import { create } from 'zustand';

type OnboardingStep = 'idea' | 'watching' | 'ready';

interface OnboardingState {
  step: OnboardingStep;
  idea: string;
  projectId: string | null;
  setStep: (step: OnboardingStep) => void;
  setIdea: (idea: string) => void;
  setProjectId: (id: string) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 'idea',
  idea: '',
  projectId: null,
  setStep: (step) => set({ step }),
  setIdea: (idea) => set({ idea }),
  setProjectId: (projectId) => set({ projectId }),
}));
