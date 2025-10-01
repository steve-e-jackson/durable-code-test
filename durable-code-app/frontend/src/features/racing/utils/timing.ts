/**
 * Purpose: Timing and lap tracking system for racing game
 * Scope: Lap timing, checkpoint validation, best time tracking
 * Overview: Manages race timing, lap counting, and checkpoint progress
 * Dependencies: None (pure JavaScript/TypeScript)
 * Exports: TimingSystem class
 * Implementation: Event-based timing with millisecond precision
 */

export interface LapTime {
  lapNumber: number;
  timeMs: number;
  timestamp: number;
}

export interface TimingState {
  isRunning: boolean;
  currentLapStartTime: number;
  totalRaceStartTime: number;
  currentLapNumber: number;
  completedLaps: LapTime[];
  bestLapTime: number | null;
}

/**
 * Timing system for tracking race and lap times
 */
export class TimingSystem {
  private state: TimingState = {
    isRunning: false,
    currentLapStartTime: 0,
    totalRaceStartTime: 0,
    currentLapNumber: 1,
    completedLaps: [],
    bestLapTime: null,
  };

  /**
   * Start the timing system
   */
  public start(): void {
    const now = performance.now();
    this.state.isRunning = true;
    this.state.currentLapStartTime = now;
    this.state.totalRaceStartTime = now;
    this.state.currentLapNumber = 1;
    this.state.completedLaps = [];
  }

  /**
   * Stop the timing system
   */
  public stop(): void {
    this.state.isRunning = false;
  }

  /**
   * Reset the timing system
   */
  public reset(): void {
    this.state = {
      isRunning: false,
      currentLapStartTime: 0,
      totalRaceStartTime: 0,
      currentLapNumber: 1,
      completedLaps: [],
      bestLapTime: null,
    };
  }

  /**
   * Complete the current lap and start a new one
   *
   * @returns The completed lap time in milliseconds
   */
  public completeLap(): number {
    if (!this.state.isRunning) {
      return 0;
    }

    const now = performance.now();
    const lapTime = now - this.state.currentLapStartTime;

    // Record the completed lap
    const lapRecord: LapTime = {
      lapNumber: this.state.currentLapNumber,
      timeMs: lapTime,
      timestamp: now,
    };
    this.state.completedLaps.push(lapRecord);

    // Update best lap time
    if (this.state.bestLapTime === null || lapTime < this.state.bestLapTime) {
      this.state.bestLapTime = lapTime;
    }

    // Start new lap
    this.state.currentLapNumber += 1;
    this.state.currentLapStartTime = now;

    return lapTime;
  }

  /**
   * Get current lap time in milliseconds
   *
   * @returns Current lap time in milliseconds
   */
  public getCurrentLapTime(): number {
    if (!this.state.isRunning) {
      return 0;
    }
    return performance.now() - this.state.currentLapStartTime;
  }

  /**
   * Get total race time in milliseconds
   *
   * @returns Total race time in milliseconds
   */
  public getTotalRaceTime(): number {
    if (!this.state.isRunning && this.state.totalRaceStartTime === 0) {
      return 0;
    }
    const now = this.state.isRunning
      ? performance.now()
      : this.state.currentLapStartTime;
    return now - this.state.totalRaceStartTime;
  }

  /**
   * Get current lap number
   *
   * @returns Current lap number
   */
  public getCurrentLapNumber(): number {
    return this.state.currentLapNumber;
  }

  /**
   * Get best lap time
   *
   * @returns Best lap time in milliseconds, or null if no laps completed
   */
  public getBestLapTime(): number | null {
    return this.state.bestLapTime;
  }

  /**
   * Get all completed laps
   *
   * @returns Array of completed lap records
   */
  public getCompletedLaps(): LapTime[] {
    return [...this.state.completedLaps];
  }

  /**
   * Check if timing system is running
   *
   * @returns True if timing system is running
   */
  public isRunning(): boolean {
    return this.state.isRunning;
  }

  /**
   * Format time in milliseconds to MM:SS.mmm
   *
   * @param timeMs Time in milliseconds
   * @returns Formatted time string
   */
  public static formatTime(timeMs: number): string {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(timeMs % 1000);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }
}
