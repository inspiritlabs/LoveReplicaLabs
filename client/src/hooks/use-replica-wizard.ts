import { useState } from "react";

export type WizardStep = 0 | 1 | 2 | 3; // 0-name, 1-voice, 2-bio, 3-traits

export const useReplicaWizard = () => {
  const [step, setStep] = useState<WizardStep>(0);
  const next = () => setStep(s => (s < 3 ? (s + 1) as WizardStep : s));
  const back = () => setStep(s => (s > 0 ? (s - 1) as WizardStep : s));
  return { step, next, back, setStep };
};