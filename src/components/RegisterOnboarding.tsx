import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RegistrationForm from './RegistrationForm';

const STORAGE_KEY = 'brandbond_registration_progress_v1';

const clampStep = (n: number) => Math.max(0, Math.min(6, n));

const RegisterOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();

  const requestedStep = useMemo(() => {
    const raw = params.step;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return 0;
    return clampStep(parsed);
  }, [params.step]);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentStep: requestedStep }));
        } catch {
          // ignore
        }
        setIsReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as { currentStep?: number };
      if (typeof parsed?.currentStep === 'number') {
        const saved = clampStep(parsed.currentStep);
        if (saved !== requestedStep) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, currentStep: requestedStep }));
          } catch {
            // ignore
          }
        }
      }

      setIsReady(true);
    } catch {
      setIsReady(true);
    }
  }, [navigate, requestedStep]);

  if (!isReady) return null;

  return (
    <RegistrationForm
      onBack={() => window.location.href = '/'}
      forcedStep={requestedStep}
      onStepChange={(next: number) => {
        const nextClamped = clampStep(next);
        navigate(`/register/onboarding/step/${nextClamped}`);
      }}
    />
  );
};

export default RegisterOnboarding;
