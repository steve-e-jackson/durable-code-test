/**
 * Purpose: Custom hook for managing Journey timeline data and interactions
 * Scope: Journey timeline state management and data access
 * Overview: Provides journey data and milestone interaction handlers
 * Dependencies: React hooks, journey data
 * Exports: useJourney hook
 * Implementation: Manages journey timeline state and user interactions
 */

import { useCallback, useMemo, useState } from 'react';
import { journeyData } from '../data/journeyData';
import type { JourneyMilestone } from '../types/journey.types';

export function useJourney() {
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  const toggleMilestone = useCallback((milestoneId: string) => {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(milestoneId)) {
        next.delete(milestoneId);
      } else {
        next.add(milestoneId);
      }
      return next;
    });
  }, []);

  const selectPhase = useCallback((phaseId: string | null) => {
    setSelectedPhase(phaseId);
  }, []);

  const filteredPhases = useMemo(() => {
    if (!selectedPhase) {
      return journeyData.phases;
    }
    return journeyData.phases.filter((phase) => phase.id === selectedPhase);
  }, [selectedPhase]);

  const totalMilestones = useMemo(() => {
    return journeyData.phases.reduce((acc, phase) => acc + phase.milestones.length, 0);
  }, []);

  const getMilestoneNumber = useCallback((milestone: JourneyMilestone): number => {
    let count = 0;
    for (const phase of journeyData.phases) {
      for (const m of phase.milestones) {
        count++;
        if (m.id === milestone.id) {
          return count;
        }
      }
    }
    return count;
  }, []);

  return {
    journeyData,
    phases: filteredPhases,
    expandedMilestones,
    toggleMilestone,
    selectedPhase,
    selectPhase,
    totalMilestones,
    getMilestoneNumber,
  };
}
