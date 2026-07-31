import type { Timestamp } from "firebase/firestore";

/**
 * Firestore collection layout for Verdix (see verdix-project-spec.md §8 for the
 * original relational design and the addendum for the Firestore pivot).
 *
 * Composite document IDs (noted per interface) replace join-table lookups and
 * make ownership/assignment checks in firestore.rules a cheap direct-path
 * exists()/get() instead of a query.
 */

export type Role = "admin" | "judge";

/** profiles/{uid} — doc id is the Firebase Auth uid. */
export interface Profile {
  role: Role;
  name: string;
  email: string;
}

/** tracks/{trackId} */
export interface Track {
  name: string;
  minJudgesRequired: number;
  createdAt: Timestamp;
}

/** teams/{teamId} */
export interface Team {
  teamName: string;
  trackId: string;
  teamLeaders: string;
  studentId: string;
  university: string;
  faculty: string;
  programme: string;
  industries: string[];
  stage: string;
  valueProposition: string;
  videoLink: string | null;
  deckLink: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** judgeTrackAssignments/{judgeId}_{trackId} */
export interface JudgeTrackAssignment {
  judgeId: string;
  trackId: string;
}

/**
 * rubrics/{rubricId} — a named, reusable rubric template. Admin can maintain
 * a library of these and pick one as the event's active rubric (see
 * EventSettings) — teams are always scored against whichever is active.
 */
export interface Rubric {
  name: string;
  createdAt: Timestamp;
}

/** Per-band descriptive text shown alongside the 0-5 score while scoring. */
export interface RubricCriterionBands {
  weak: string; // 0-2
  moderate: string; // 3-4
  excellent: string; // 5
}

/** rubricCriteria/{criterionId} — belongs to exactly one rubric. */
export interface RubricCriterion {
  rubricId: string;
  label: string;
  weight: number; // percentage, criteria within a rubric should sum to ~100
  bands: RubricCriterionBands;
  sortOrder: number;
}

/** settings/event — singleton doc for event-wide config. */
export interface EventSettings {
  activeRubricId: string | null;
}

/** scores/{judgeId}_{teamId}_{criterionId} — long format, one doc per (judge, team, criterion). */
export interface Score {
  judgeId: string;
  teamId: string;
  criterionId: string;
  value: number; // 0-5
  createdAt: Timestamp;
}

/** scoreComments/{judgeId}_{teamId} */
export interface ScoreComment {
  judgeId: string;
  teamId: string;
  comments: string;
  createdAt: Timestamp;
}

/** scoreExclusions/{id} — immutable audit log, admin-only. */
export interface ScoreExclusion {
  scoreId: string;
  excludedBy: string;
  reason: string;
  excludedAt: Timestamp;
}

/** deliberationNotes/{id} — admin-only. */
export interface DeliberationNote {
  teamId: string;
  adminId: string;
  note: string;
  createdAt: Timestamp;
}

/** teamReviewStatus/{judgeId}_{teamId} — Prep Mode "reviewed" checkbox. */
export interface TeamReviewStatus {
  judgeId: string;
  teamId: string;
  reviewedAt: Timestamp;
}
