"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

const TOUR_STORAGE_KEY = "qbit-tour-completed";
const TOUR_PROGRESS_KEY = "qbit-tour-progress";

interface TourContextValue {
  /** Whether the tour is currently active */
  isActive: boolean;
  /** Current step index (0-based) */
  currentStep: number;
  /** Total steps in the tour */
  totalSteps: number;
  /** Whether the user has completed the tour before */
  hasCompleted: boolean;
  /** Whether the welcome screen should show */
  showWelcome: boolean;
  /** Start the tour from the beginning */
  startTour: () => void;
  /** Skip the tour (marks as completed) */
  skipTour: () => void;
  /** Go to the next step */
  nextStep: () => void;
  /** Go to the previous step */
  prevStep: () => void;
  /** Finish the tour (marks as completed) */
  finishTour: () => void;
  /** Close the welcome screen without starting */
  dismissWelcome: () => void;
  /** Restart the tour (resets completion) */
  restartTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Load completion status and saved progress on mount
  useEffect(() => {
    const loadTourState = () => {
      try {
        const completed = localStorage.getItem(TOUR_STORAGE_KEY);
        const wasCompleted = completed === "true";

        const progress = localStorage.getItem(TOUR_PROGRESS_KEY);
        const hasProgress = progress && parseInt(progress, 10) > 0;

        if (hasProgress || !wasCompleted) {
          setShowWelcome(true);
        }
        setHasCompleted(wasCompleted);
      } catch {
        setShowWelcome(true);
      }
    };
    loadTourState();
  }, []);

  const startTour = useCallback(() => {
    setShowWelcome(false);
    setIsActive(true);
    setCurrentStep(0);
    try { localStorage.removeItem(TOUR_PROGRESS_KEY); } catch {}
  }, []);

  const skipTour = useCallback(() => {
    setShowWelcome(false);
    setIsActive(false);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
      setHasCompleted(true);
    } catch {}
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      try { localStorage.setItem(TOUR_PROGRESS_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const finishTour = useCallback(() => {
    setIsActive(false);
    setShowWelcome(false);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
      localStorage.removeItem(TOUR_PROGRESS_KEY);
      setHasCompleted(true);
    } catch {}
  }, []);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
  }, []);

  const restartTour = useCallback(() => {
    try {
      localStorage.removeItem(TOUR_STORAGE_KEY);
      localStorage.removeItem(TOUR_PROGRESS_KEY);
    } catch {}
    setHasCompleted(false);
    setCurrentStep(0);
    setIsActive(true);
    setShowWelcome(false);
  }, []);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: 0, // Set by TourOverlay
        hasCompleted,
        showWelcome,
        startTour,
        skipTour,
        nextStep,
        prevStep,
        finishTour,
        dismissWelcome,
        restartTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}
