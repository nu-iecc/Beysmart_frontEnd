import { HOME_SETUP } from './Constants';

export interface SetupStep {
  id: string;
  key: string;
  title: string;
  description: string;
  iconKey: string;
  actionText: string;
  isCompleted: boolean;
  isActive: boolean;
  isLocked: boolean;
}

/**
 * Updates a specific step in the setup timeline
 * @param steps - Current setup steps array
 * @param stepId - ID of the step to update
 * @param updates - Partial updates to apply to the step
 * @returns Updated steps array
 */
export const updateSetupStep = (
  steps: SetupStep[],
  stepId: string,
  updates: Partial<SetupStep>
): SetupStep[] => {
  return steps.map(step => 
    step.id === stepId ? { ...step, ...updates } : step
  );
};

/**
 * Marks a step as completed and activates the next step
 * @param steps - Current setup steps array
 * @param stepId - ID of the step to complete
 * @returns Updated steps array with next step activated
 */
export const completeSetupStep = (
  steps: SetupStep[],
  stepId: string
): SetupStep[] => {
  const stepIndex = steps.findIndex(step => step.id === stepId);
  if (stepIndex === -1) return steps;

  const updatedSteps = [...steps];
  
  // Mark current step as completed
  updatedSteps[stepIndex] = {
    ...updatedSteps[stepIndex],
    isCompleted: true,
    isActive: false,
  };

  // Activate next step if it exists and isn't locked
  if (stepIndex + 1 < updatedSteps.length) {
    const nextStep = updatedSteps[stepIndex + 1];
    if (nextStep.isLocked) {
      // Unlock the next step
      updatedSteps[stepIndex + 1] = {
        ...nextStep,
        isLocked: false,
        isActive: true,
      };
    }
  }

  return updatedSteps;
};

/**
 * Resets all steps to their initial state
 * @returns Fresh setup steps array
 */
export const resetSetupSteps = (): SetupStep[] => {
  return HOME_SETUP.STEPS.map(step => ({ ...step }));
};

/**
 * Gets the current active step
 * @param steps - Current setup steps array
 * @returns The active step or null if none
 */
export const getActiveStep = (steps: SetupStep[]): SetupStep | null => {
  return steps.find(step => step.isActive) || null;
};

/**
 * Gets the next available step
 * @param steps - Current setup steps array
 * @returns The next step or null if none
 */
export const getNextStep = (steps: SetupStep[]): SetupStep | null => {
  const activeIndex = steps.findIndex(step => step.isActive);
  if (activeIndex === -1 || activeIndex + 1 >= steps.length) return null;
  
  const nextStep = steps[activeIndex + 1];
  return nextStep.isLocked ? null : nextStep;
};

/**
 * Gets the progress percentage of completed steps
 * @param steps - Current setup steps array
 * @returns Progress percentage (0-100)
 */
export const getSetupProgress = (steps: SetupStep[]): number => {
  const completedCount = steps.filter(step => step.isCompleted).length;
  return Math.round((completedCount / steps.length) * 100);
};

/**
 * Checks if all steps are completed
 * @param steps - Current setup steps array
 * @returns True if all steps are completed
 */
export const isSetupComplete = (steps: SetupStep[]): boolean => {
  return steps.every(step => step.isCompleted);
};

/**
 * Gets the step by its key
 * @param steps - Current setup steps array
 * @param stepKey - Key of the step to find
 * @returns The step or null if not found
 */
export const getStepByKey = (steps: SetupStep[], stepKey: string): SetupStep | null => {
  return steps.find(step => step.key === stepKey) || null;
};

/**
 * Validates if a step can be completed
 * @param steps - Current setup steps array
 * @param stepId - ID of the step to validate
 * @returns True if the step can be completed
 */
export const canCompleteStep = (steps: SetupStep[], stepId: string): boolean => {
  const step = steps.find(s => s.id === stepId);
  if (!step) return false;
  
  // Step must be active and not already completed
  return step.isActive && !step.isCompleted;
};

/**
 * Gets the completion order of steps
 * @param steps - Current setup steps array
 * @returns Array of step IDs in completion order
 */
export const getStepCompletionOrder = (steps: SetupStep[]): string[] => {
  return steps
    .filter(step => step.isCompleted)
    .sort((a, b) => {
      const aIndex = steps.findIndex(s => s.id === a.id);
      const bIndex = steps.findIndex(s => s.id === b.id);
      return aIndex - bIndex;
    })
    .map(step => step.id);
};
