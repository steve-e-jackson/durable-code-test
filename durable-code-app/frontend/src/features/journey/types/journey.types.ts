/**
 * Purpose: TypeScript type definitions for the Journey timeline feature
 * Scope: Type definitions for journey milestones and timeline data
 * Overview: Defines interfaces for the project journey timeline visualization
 * Dependencies: None
 * Exports: JourneyMilestone, JourneyPhase, JourneyData interfaces
 * Interfaces: Type definitions for timeline milestones and phases
 * Implementation: Comprehensive type system for journey timeline data
 */

export type MilestoneType =
  | 'feat'
  | 'fix'
  | 'refactor'
  | 'docs'
  | 'chore'
  | 'test'
  | 'perf';
export type MilestoneImpact = 'major' | 'minor' | 'patch';

export interface JourneyMilestone {
  id: string;
  phase: string;
  type: MilestoneType;
  title: string;
  description: string;
  date?: string;
  prNumber?: number;
  impact: MilestoneImpact;
  details?: string[];
  isExpanded?: boolean;
}

export interface JourneyPhase {
  id: string;
  name: string;
  description: string;
  color: string;
  milestones: JourneyMilestone[];
}

export interface JourneyData {
  title: string;
  subtitle: string;
  phases: JourneyPhase[];
}
