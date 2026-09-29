import { createInitialGitState, type GitState } from '../services/gitEngine';

export interface GitLevel {
  id: string;
  sequenceId: 'intro' | 'rampup' | 'move' | 'mixed' | 'advanced' | 'remote';
  sequenceTitle: string;
  number: number;
  sequenceIndex: string; // e.g. "1.1", "2.3"
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xp: number;
  description: string;
  dialogue: {
    title: string;
    paragraphs: string[];
    exampleCommands?: string[];
  };
  hint: string;
  initialState: GitState;
  goalState: GitState;
  solutionHint: string[];
}

// ==========================================
// 1. ВВЕДЕНИЕ (INTRODUCTION SEQUENCE)
// ==========================================

// 1.1 Commits
const lvl1_1_init = createInitialGitState();
lvl1_1_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] }
};
lvl1_1_init.branches = { main: 'C1' };
lvl1_1_init.head = { type: 'branch', name: 'main' };
lvl1_1_init.commitCounter = 1;

const lvl1_1_goal = createInitialGitState();
lvl1_1_goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C2'] }
};
lvl1_1_goal.branches = { main: 'C3' };
lvl1_1_goal.head = { type: 'branch', name: 'main' };
lvl1_1_goal.commitCounter = 3;

// 1.2 Branching
const lvl1_2_init = createInitialGitState();
lvl1_2_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] }
};
lvl1_2_init.branches = { main: 'C1' };
lvl1_2_init.head = { type: 'branch', name: 'main' };
lvl1_2_init.commitCounter = 1;

const lvl1_2_goal = createInitialGitState();
lvl1_2_goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] }
};
lvl1_2_goal.branches = { main: 'C1', bugFix: 'C1' };
lvl1_2_goal.head = { type: 'branch', name: 'bugFix' };
lvl1_2_goal.commitCounter = 1;

// 1.3 Merging
const lvl1_3_init = createInitialGitState();
lvl1_3_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] }
};
lvl1_3_init.branches = { main: 'C1' };
lvl1_3_init.head = { type: 'branch', name: 'main' };
lvl1_3_init.commitCounter = 1;

const lvl1_3_goal = createInitialGitState();
lvl1_3_goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C1'] },
  C4: { id: 'C4', parentIds: ['C3', 'C2'] }
};
lvl1_3_goal.branches = { main: 'C4', bugFix: 'C2' };
lvl1_3_goal.head = { type: 'branch', name: 'main' };
lvl1_3_goal.commitCounter = 4;

// 1.4 Rebasing
const lvl1_4_init = createInitialGitState();
lvl1_4_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C1'] }
};
lvl1_4_init.branches = { main: 'C3', bugFix: 'C2' };
lvl1_4_init.head = { type: 'branch', name: 'bugFix' };
lvl1_4_init.commitCounter = 3;

const lvl1_4_goal = createInitialGitState();
lvl1_4_goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C1'] },
  "C2'": { id: "C2'", parentIds: ['C3'] }
};
lvl1_4_goal.branches = { main: 'C3', bugFix: "C2'" };
lvl1_4_goal.head = { type: 'branch', name: 'bugFix' };
lvl1_4_goal.commitCounter = 4;

// ==========================================
// 2. НАБИРАЕМ ОБОРОТЫ (RAMPING UP)
// ==========================================

// 2.1 Detached HEAD
const lvl2_1_init = createInitialGitState();
lvl2_1_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C1'] },
  C4: { id: 'C4', parentIds: ['C2'] }
};
lvl2_1_init.branches = { main: 'C3', bugFix: 'C4' };
lvl2_1_init.head = { type: 'branch', name: 'main' };
lvl2_1_init.commitCounter = 4;

const lvl2_1_goal = createInitialGitState();
lvl2_1_goal.commits = { ...lvl2_1_init.commits };
lvl2_1_goal.branches = { main: 'C3', bugFix: 'C4' };
lvl2_1_goal.head = { type: 'commit', name: 'C4' };
lvl2_1_goal.commitCounter = 4;

// 2.2 Relative Refs (^)
const lvl2_2_init = createInitialGitState();
lvl2_2_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C1'] },
  C4: { id: 'C4', parentIds: ['C2'] }
};
lvl2_2_init.branches = { main: 'C3', bugFix: 'C4' };
lvl2_2_init.head = { type: 'branch', name: 'main' };
lvl2_2_init.commitCounter = 4;

const lvl2_2_goal = createInitialGitState();
lvl2_2_goal.commits = { ...lvl2_2_init.commits };
lvl2_2_goal.branches = { main: 'C3', bugFix: 'C4' };
lvl2_2_goal.head = { type: 'commit', name: 'C2' };
lvl2_2_goal.commitCounter = 4;

// 2.3 Relative Refs (~)
const lvl2_3_init = createInitialGitState();
lvl2_3_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C2'] },
  C4: { id: 'C4', parentIds: ['C1'] },
  C5: { id: 'C5', parentIds: ['C4'] },
  C6: { id: 'C6', parentIds: ['C5'] }
};
lvl2_3_init.branches = { main: 'C3', bugFix: 'C6' };
lvl2_3_init.head = { type: 'branch', name: 'main' };
lvl2_3_init.commitCounter = 6;

const lvl2_3_goal = createInitialGitState();
lvl2_3_goal.commits = { ...lvl2_3_init.commits };
lvl2_3_goal.branches = { main: 'C6', bugFix: 'C0' };
lvl2_3_goal.head = { type: 'commit', name: 'C1' };
lvl2_3_goal.commitCounter = 6;

// 2.4 Reversing changes (reset & revert)
const lvl2_4_init = createInitialGitState();
lvl2_4_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C1'] }
};
lvl2_4_init.branches = { local: 'C2', pushed: 'C3' };
lvl2_4_init.head = { type: 'branch', name: 'local' };
lvl2_4_init.commitCounter = 3;

const lvl2_4_goal = createInitialGitState();
lvl2_4_goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C1'] },
  C4: { id: 'C4', parentIds: ['C3'] }
};
lvl2_4_goal.branches = { local: 'C1', pushed: 'C4' };
lvl2_4_goal.head = { type: 'branch', name: 'pushed' };
lvl2_4_goal.commitCounter = 4;

// ==========================================
// 3. ПЕРЕМЕЩЕНИЕ РАБОТЫ (MOVING WORK AROUND)
// ==========================================

// 3.1 Cherry-pick
const lvl3_1_init = createInitialGitState();
lvl3_1_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C2'] },
  C4: { id: 'C4', parentIds: ['C3'] },
  C5: { id: 'C5', parentIds: ['C1'] },
  C6: { id: 'C6', parentIds: ['C5'] },
  C7: { id: 'C7', parentIds: ['C6'] }
};
lvl3_1_init.branches = { main: 'C1', side: 'C4', another: 'C7' };
lvl3_1_init.head = { type: 'branch', name: 'main' };
lvl3_1_init.commitCounter = 7;

const lvl3_1_goal = createInitialGitState();
lvl3_1_goal.commits = {
  ...lvl3_1_init.commits,
  "C3''": { id: "C3''", parentIds: ['C1'] },
  "C4''": { id: "C4''", parentIds: ["C3''"] },
  "C7''": { id: "C7''", parentIds: ["C4''"] }
};
lvl3_1_goal.branches = { main: "C7''", side: 'C4', another: 'C7' };
lvl3_1_goal.head = { type: 'branch', name: 'main' };
lvl3_1_goal.commitCounter = 10;

// 3.2 Interactive Rebase
const lvl3_2_init = createInitialGitState();
lvl3_2_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C2'] },
  C4: { id: 'C4', parentIds: ['C3'] },
  C5: { id: 'C5', parentIds: ['C4'] }
};
lvl3_2_init.branches = { main: 'C5' };
lvl3_2_init.head = { type: 'branch', name: 'main' };
lvl3_2_init.commitCounter = 5;

const lvl3_2_goal = createInitialGitState();
lvl3_2_goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  "C3'": { id: "C3'", parentIds: ['C1'] },
  "C5'": { id: "C5'", parentIds: ["C3'"] },
  "C4'": { id: "C4'", parentIds: ["C5'"] }
};
lvl3_2_goal.branches = { main: "C4'" };
lvl3_2_goal.head = { type: 'branch', name: 'main' };
lvl3_2_goal.commitCounter = 8;

// ==========================================
// 4. СБОРНАЯ СОЛЯНКА (A MIXED BAG)
// ==========================================

// 4.1 Grabbing 1 commit
const lvl4_1_init = createInitialGitState();
lvl4_1_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C2'] },
  C4: { id: 'C4', parentIds: ['C3'] }
};
lvl4_1_init.branches = { main: 'C1', bugFix: 'C4' };
lvl4_1_init.head = { type: 'branch', name: 'main' };
lvl4_1_init.commitCounter = 4;

const lvl4_1_goal = createInitialGitState();
lvl4_1_goal.commits = {
  ...lvl4_1_init.commits,
  "C4''": { id: "C4''", parentIds: ['C1'] }
};
lvl4_1_goal.branches = { main: "C4''", bugFix: 'C4' };
lvl4_1_goal.head = { type: 'branch', name: 'main' };
lvl4_1_goal.commitCounter = 5;

// 4.2 Juggling Commits
const lvl4_2_init = createInitialGitState();
lvl4_2_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C2'] }
};
lvl4_2_init.branches = { main: 'C3', caption: 'C3' };
lvl4_2_init.head = { type: 'branch', name: 'main' };
lvl4_2_init.commitCounter = 3;

const lvl4_2_goal = createInitialGitState();
lvl4_2_goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  "C2'": { id: "C2'", parentIds: ['C1'] },
  "C3'": { id: "C3'", parentIds: ["C2'"] }
};
lvl4_2_goal.branches = { main: "C3'", caption: 'C3' };
lvl4_2_goal.head = { type: 'branch', name: 'main' };
lvl4_2_goal.commitCounter = 5;

// 4.3 Git Tags
const lvl4_4_init = createInitialGitState();
lvl4_4_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] }
};
lvl4_4_init.branches = { main: 'C2', side: 'C1' };
lvl4_4_init.head = { type: 'branch', name: 'main' };
lvl4_4_init.tags = {};
lvl4_4_init.commitCounter = 2;

const lvl4_4_goal = createInitialGitState();
lvl4_4_goal.commits = { ...lvl4_4_init.commits };
lvl4_4_goal.branches = { main: 'C2', side: 'C1' };
lvl4_4_goal.tags = { v0: 'C1', v1: 'C2' };
lvl4_4_goal.head = { type: 'commit', name: 'C2' };
lvl4_4_goal.commitCounter = 2;

// 4.4 Git Describe
const lvl4_5_init = createInitialGitState();
lvl4_5_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] }
};
lvl4_5_init.branches = { main: 'C2' };
lvl4_5_init.tags = { v1: 'C1' };
lvl4_5_init.head = { type: 'branch', name: 'main' };
lvl4_5_init.commitCounter = 2;

const lvl4_5_goal = createInitialGitState();
lvl4_5_goal.commits = {
  ...lvl4_5_init.commits,
  C3: { id: 'C3', parentIds: ['C2'] }
};
lvl4_5_goal.branches = { main: 'C3' };
lvl4_5_goal.tags = { v1: 'C1' };
lvl4_5_goal.head = { type: 'branch', name: 'main' };
lvl4_5_goal.commitCounter = 3;

// ==========================================
// 5. ПРОДВИНУТЫЕ ТЕМЫ (ADVANCED TOPICS)
// ==========================================

// 5.1 Rebasing over 9000 times
const lvl5_1_init = createInitialGitState();
lvl5_1_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C2'] },
  C4: { id: 'C4', parentIds: ['C1'] },
  C5: { id: 'C5', parentIds: ['C4'] },
  C6: { id: 'C6', parentIds: ['C1'] }
};
lvl5_1_init.branches = { main: 'C1', bugFix: 'C3', side: 'C5', another: 'C6' };
lvl5_1_init.head = { type: 'branch', name: 'main' };
lvl5_1_init.commitCounter = 6;

const lvl5_1_goal = createInitialGitState();
lvl5_1_goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  "C2'": { id: "C2'", parentIds: ['C1'] },
  "C3'": { id: "C3'", parentIds: ["C2'"] },
  "C4'": { id: "C4'", parentIds: ["C3'"] },
  "C5'": { id: "C5'", parentIds: ["C4'"] },
  "C6'": { id: "C6'", parentIds: ["C5'"] }
};
lvl5_1_goal.branches = { main: "C6'", bugFix: "C3'", side: "C5'", another: "C6'" };
lvl5_1_goal.head = { type: 'branch', name: 'main' };
lvl5_1_goal.commitCounter = 12;

// 5.2 Multiple parents (HEAD^2)
const lvl5_2_init = createInitialGitState();
lvl5_2_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C1'] },
  C4: { id: 'C4', parentIds: ['C2', 'C3'] }
};
lvl5_2_init.branches = { main: 'C4' };
lvl5_2_init.head = { type: 'branch', name: 'main' };
lvl5_2_init.commitCounter = 4;

const lvl5_2_goal = createInitialGitState();
lvl5_2_goal.commits = { ...lvl5_2_init.commits };
lvl5_2_goal.branches = { main: 'C4', bugFix: 'C3' };
lvl5_2_goal.head = { type: 'branch', name: 'bugFix' };
lvl5_2_goal.commitCounter = 4;

// ==========================================
// 6. УДАЛЕННЫЕ РЕПОЗИТОРИИ (GIT REMOTES)
// ==========================================

// 6.1 Clone Intro
const lvl6_1_init = createInitialGitState();
lvl6_1_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] }
};
lvl6_1_init.branches = { main: 'C1' };
lvl6_1_init.head = { type: 'branch', name: 'main' };
lvl6_1_init.commitCounter = 1;

const lvl6_1_goal = createInitialGitState();
lvl6_1_goal.commits = { ...lvl6_1_init.commits };
lvl6_1_goal.branches = { main: 'C1', 'o/main': 'C1' };
lvl6_1_goal.head = { type: 'branch', name: 'main' };
lvl6_1_goal.commitCounter = 1;

// 6.2 Remote branches
const lvl6_2_init = createInitialGitState();
lvl6_2_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] }
};
lvl6_2_init.branches = { main: 'C1', 'o/main': 'C1' };
lvl6_2_init.head = { type: 'branch', name: 'main' };
lvl6_2_init.commitCounter = 1;

const lvl6_2_goal = createInitialGitState();
lvl6_2_goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] }
};
lvl6_2_goal.branches = { main: 'C1', 'o/main': 'C1' };
lvl6_2_goal.head = { type: 'commit', name: 'C1' };
lvl6_2_goal.commitCounter = 2;

// 6.3 Git Fetch
const lvl6_3_init = createInitialGitState();
lvl6_3_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] }
};
lvl6_3_init.branches = { main: 'C1', 'o/main': 'C1' };
lvl6_3_init.head = { type: 'branch', name: 'main' };
lvl6_3_init.commitCounter = 1;

const lvl6_3_goal = createInitialGitState();
lvl6_3_goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] }
};
lvl6_3_goal.branches = { main: 'C1', 'o/main': 'C2' };
lvl6_3_goal.head = { type: 'branch', name: 'main' };
lvl6_3_goal.commitCounter = 2;

// 6.4 Git Pull
const lvl6_4_init = createInitialGitState();
lvl6_4_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] }
};
lvl6_4_init.branches = { main: 'C1', 'o/main': 'C2' };
lvl6_4_init.head = { type: 'branch', name: 'main' };
lvl6_4_init.commitCounter = 2;

const lvl6_4_goal = createInitialGitState();
lvl6_4_goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] }
};
lvl6_4_goal.branches = { main: 'C2', 'o/main': 'C2' };
lvl6_4_goal.head = { type: 'branch', name: 'main' };
lvl6_4_goal.commitCounter = 2;

// 6.5 Faking Teamwork
const lvl6_5_init = createInitialGitState();
lvl6_5_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] }
};
lvl6_5_init.branches = { main: 'C1', 'o/main': 'C1' };
lvl6_5_init.head = { type: 'branch', name: 'main' };
lvl6_5_init.commitCounter = 1;

const lvl6_5_goal = createInitialGitState();
lvl6_5_goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C2'] }
};
lvl6_5_goal.branches = { main: 'C1', 'o/main': 'C3' };
lvl6_5_goal.head = { type: 'branch', name: 'main' };
lvl6_5_goal.commitCounter = 3;

// 6.6 Git Push
const lvl6_6_init = createInitialGitState();
lvl6_6_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] }
};
lvl6_6_init.branches = { main: 'C2', 'o/main': 'C1' };
lvl6_6_init.head = { type: 'branch', name: 'main' };
lvl6_6_init.commitCounter = 2;

const lvl6_6_goal = createInitialGitState();
lvl6_6_goal.commits = { ...lvl6_6_init.commits };
lvl6_6_goal.branches = { main: 'C2', 'o/main': 'C2' };
lvl6_6_goal.head = { type: 'branch', name: 'main' };
lvl6_6_goal.commitCounter = 2;

// 6.7 Diverged History
const lvl6_7_init = createInitialGitState();
lvl6_7_init.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C1'] }
};
lvl6_7_init.branches = { main: 'C3', 'o/main': 'C2' };
lvl6_7_init.head = { type: 'branch', name: 'main' };
lvl6_7_init.commitCounter = 3;

const lvl6_7_goal = createInitialGitState();
lvl6_7_goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C1'] },
  "C3'": { id: "C3'", parentIds: ['C2'] }
};
lvl6_7_goal.branches = { main: "C3'", 'o/main': "C3'" };
lvl6_7_goal.head = { type: 'branch', name: 'main' };
lvl6_7_goal.commitCounter = 5;

// ==========================================
// ВСЕ УРОВНИ ИЗ LEARN GIT BRANCHING (20 УРОВНЕЙ)
// ==========================================
export const GIT_LEVELS: GitLevel[] = [
  // --- 1. ВВЕДЕНИЕ ---
  {
    id: 'intro1',
    sequenceId: 'intro',
    sequenceTitle: '1. Введение в Git',
    sequenceIndex: '1.1',
    number: 1,
    title: 'Введение в коммиты Git',
    difficulty: 'easy',
    xp: 30,
    description: 'Коммит в Git сохраняет снимок всех файлов вашего репозитория. Сделайте два коммита.',
    dialogue: {
      title: 'Что такое коммит в Git?',
      paragraphs: [
        'Репозиторий Git — это направленный граф снимков вашего проекта.',
        'Команда "git commit" сохраняет текущее состояние и перемещает текущую ветку вперед.'
      ],
      exampleCommands: ['git commit', 'git commit -m "Сообщение"']
    },
    hint: 'Выполните команду "git commit" два раза подряд.',
    initialState: lvl1_1_init,
    goalState: lvl1_1_goal,
    solutionHint: ['git commit', 'git commit']
  },
  {
    id: 'intro2',
    sequenceId: 'intro',
    sequenceTitle: '1. Введение в Git',
    sequenceIndex: '1.2',
    number: 2,
    title: 'Ветвление в Git (Branching)',
    difficulty: 'easy',
    xp: 35,
    description: 'Ветки — это легковесные указатели на коммиты. Создайте ветку "bugFix" и переключитесь на неё.',
    dialogue: {
      title: 'Легковесные ветки',
      paragraphs: [
        'Ветка в Git — это просто плавающий указатель на коммит. Вы можете создать ветку через "git branch bugFix" и перейти через "git checkout bugFix".',
        'А можно сделать всё одной командой: "git checkout -b bugFix"!'
      ],
      exampleCommands: ['git branch bugFix', 'git checkout bugFix', 'git checkout -b bugFix']
    },
    hint: 'Создайте ветку bugFix и переключитесь на неё: "git checkout -b bugFix".',
    initialState: lvl1_2_init,
    goalState: lvl1_2_goal,
    solutionHint: ['git checkout -b bugFix']
  },
  {
    id: 'intro3',
    sequenceId: 'intro',
    sequenceTitle: '1. Введение в Git',
    sequenceIndex: '1.3',
    number: 3,
    title: 'Слияние веток (git merge)',
    difficulty: 'medium',
    xp: 45,
    description: 'Слияние объединяет историю двух веток с созданием специального коммита с двумя родителями.',
    dialogue: {
      title: 'Как работает git merge?',
      paragraphs: [
        'Слияние объединяет работу из двух разных веток.',
        'Создайте ветку bugFix, сделайте в ней коммит, вернитесь в main, сделайте коммит в main и слейте: "git merge bugFix".'
      ],
      exampleCommands: ['git checkout -b bugFix', 'git commit', 'git checkout main', 'git commit', 'git merge bugFix']
    },
    hint: 'git checkout -b bugFix; git commit; git checkout main; git commit; git merge bugFix',
    initialState: lvl1_3_init,
    goalState: lvl1_3_goal,
    solutionHint: ['git checkout -b bugFix', 'git commit', 'git checkout main', 'git commit', 'git merge bugFix']
  },
  {
    id: 'intro4',
    sequenceId: 'intro',
    sequenceTitle: '1. Введение в Git',
    sequenceIndex: '1.4',
    number: 4,
    title: 'Перебазирование веток (git rebase)',
    difficulty: 'medium',
    xp: 50,
    description: 'Rebase переносит коммиты одной ветки поверх другой, создавая линейную и чистую историю.',
    dialogue: {
      title: 'Линейная история с Rebase',
      paragraphs: [
        'Второй способ объединения веток — это git rebase. Он берет коммиты текущей ветки и копирует их поверх целевой ветки.'
      ],
      exampleCommands: ['git rebase main']
    },
    hint: 'Находясь в ветке bugFix, выполните "git rebase main".',
    initialState: lvl1_4_init,
    goalState: lvl1_4_goal,
    solutionHint: ['git rebase main']
  },

  // --- 2. НАБИРАЕМ ОБОРОТЫ ---
  {
    id: 'ramp1',
    sequenceId: 'rampup',
    sequenceTitle: '2. Набираем обороты',
    sequenceIndex: '2.1',
    number: 5,
    title: 'Отделите свой HEAD (Detached HEAD)',
    difficulty: 'easy',
    xp: 35,
    description: 'HEAD обычно прикреплен к ветке. Но вы можете открепить его и направить прямо на коммит C4.',
    dialogue: {
      title: 'Отсоединенный HEAD',
      paragraphs: [
        'HEAD — это символический указатель на текущее место работы.',
        'Команда "git checkout <commit>" переводит репозиторий в состояние отсоединенного HEAD.'
      ],
      exampleCommands: ['git checkout C4']
    },
    hint: 'Переключитесь на коммит C4: "git checkout C4".',
    initialState: lvl2_1_init,
    goalState: lvl2_1_goal,
    solutionHint: ['git checkout C4']
  },
  {
    id: 'ramp2',
    sequenceId: 'rampup',
    sequenceTitle: '2. Набираем обороты',
    sequenceIndex: '2.2',
    number: 6,
    title: 'Относительные ссылки (^)',
    difficulty: 'medium',
    xp: 40,
    description: 'Оператор ^ позволяет переместиться на одного родителя назад.',
    dialogue: {
      title: 'Оператор каретки ^',
      paragraphs: [
        'Вместо ввода хеша коммита можно написать HEAD^, что означает "родитель текущего коммита".',
        'Можно также указать имя ветки: bugFix^.'
      ],
      exampleCommands: ['git checkout bugFix^', 'git checkout HEAD^']
    },
    hint: 'Переключитесь на родителя ветки bugFix: "git checkout bugFix^".',
    initialState: lvl2_2_init,
    goalState: lvl2_2_goal,
    solutionHint: ['git checkout bugFix^']
  },
  {
    id: 'ramp3',
    sequenceId: 'rampup',
    sequenceTitle: '2. Набираем обороты',
    sequenceIndex: '2.3',
    number: 7,
    title: 'Относительные ссылки №2 (~) и форсирование веток',
    difficulty: 'hard',
    xp: 50,
    description: 'Оператор ~<число> прыгает на несколько коммитов назад, а "git branch -f" принудительно двигает ветку.',
    dialogue: {
      title: 'Прыжки через тильду и флаг -f',
      paragraphs: [
        'HEAD~3 перемещает на 3 коммита назад.',
        'Команда "git branch -f main C6" принудительно перемещает ветку main на коммит C6.'
      ],
      exampleCommands: ['git branch -f main C6', 'git checkout HEAD~1', 'git branch -f bugFix HEAD~1']
    },
    hint: 'Переместите main на C6, bugFix на C0, и перейдите на C1.',
    initialState: lvl2_3_init,
    goalState: lvl2_3_goal,
    solutionHint: ['git branch -f main C6', 'git branch -f bugFix C0', 'git checkout C1']
  },
  {
    id: 'ramp4',
    sequenceId: 'rampup',
    sequenceTitle: '2. Набираем обороты',
    sequenceIndex: '2.4',
    number: 8,
    title: 'Отмена изменений: reset vs revert',
    difficulty: 'medium',
    xp: 45,
    description: 'Откатите локальную ветку через reset, а удаленную — через revert.',
    dialogue: {
      title: 'Reset против Revert',
      paragraphs: [
        'git reset отматывает указатель ветки назад (хорошо для локальной работы).',
        'git revert создает новый коммит, отменяющий изменения (идеально для опубликованных веток).'
      ],
      exampleCommands: ['git reset HEAD~1', 'git revert HEAD']
    },
    hint: 'Сбросьте local через "git reset HEAD~1", затем перейдите в pushed и сделайте "git revert HEAD".',
    initialState: lvl2_4_init,
    goalState: lvl2_4_goal,
    solutionHint: ['git reset HEAD~1', 'git checkout pushed', 'git revert HEAD']
  },

  // --- 3. ПЕРЕМЕЩЕНИЕ РАБОТЫ ---
  {
    id: 'move1',
    sequenceId: 'move',
    sequenceTitle: '3. Перемещение работы',
    sequenceIndex: '3.1',
    number: 9,
    title: 'Выборочный перенос: git cherry-pick',
    difficulty: 'medium',
    xp: 45,
    description: 'Скопируйте нужные коммиты C3, C4 и C7 в ветку main.',
    dialogue: {
      title: 'Магия cherry-pick',
      paragraphs: [
        'Команда "git cherry-pick <C1> <C2>..." берет указанные коммиты и применяет их прямо к текущей ветке!'
      ],
      exampleCommands: ['git cherry-pick C3 C4 C7']
    },
    hint: 'Находясь в main, выполните "git cherry-pick C3 C4 C7".',
    initialState: lvl3_1_init,
    goalState: lvl3_1_goal,
    solutionHint: ['git cherry-pick C3 C4 C7']
  },
  {
    id: 'move2',
    sequenceId: 'move',
    sequenceTitle: '3. Перемещение работы',
    sequenceIndex: '3.2',
    number: 10,
    title: 'Интерактивный Rebase (git rebase -i)',
    difficulty: 'hard',
    xp: 55,
    description: 'Переупорядочьте и отберите коммиты с помощью интерактивного rebase.',
    dialogue: {
      title: 'Интерактивный Rebase',
      paragraphs: [
        'С помощью "git rebase -i HEAD~4" вы можете менять порядок коммитов, исключать ненужные или объединять их.'
      ],
      exampleCommands: ['git rebase -i HEAD~4']
    },
    hint: 'Выполните "git rebase -i HEAD~4", чтобы переупорядочить коммиты.',
    initialState: lvl3_2_init,
    goalState: lvl3_2_goal,
    solutionHint: ['git rebase -i HEAD~4']
  },

  // --- 4. СБОРНАЯ СОЛЯНКА ---
  {
    id: 'mixed1',
    sequenceId: 'mixed',
    sequenceTitle: '4. Сборная солянка',
    sequenceIndex: '4.1',
    number: 11,
    title: 'Взять только один коммит',
    difficulty: 'medium',
    xp: 45,
    description: 'В ветке bugFix есть нужный багфикс (коммит C4). Перенесите только его в main.',
    dialogue: {
      title: 'Выборочный перенос багфикса',
      paragraphs: [
        'Часто вам нужно забрать из чужой ветки всего один коммит, не забирая остальные экспериментальные наработки.'
      ],
      exampleCommands: ['git cherry-pick C4']
    },
    hint: 'Находясь в main, выполните "git cherry-pick C4".',
    initialState: lvl4_1_init,
    goalState: lvl4_1_goal,
    solutionHint: ['git cherry-pick C4']
  },
  {
    id: 'mixed2',
    sequenceId: 'mixed',
    sequenceTitle: '4. Сборная солянка',
    sequenceIndex: '4.2',
    number: 12,
    title: 'Жонглирование коммитами',
    difficulty: 'hard',
    xp: 55,
    description: 'Измените старый коммит в истории с помощью rebase.',
    dialogue: {
      title: 'Правка старых коммитов',
      paragraphs: [
        'Используйте интерактивный rebase или перестановку веток, чтобы обновить коммиты в глубине истории.'
      ],
      exampleCommands: ['git rebase -i HEAD~2']
    },
    hint: 'Выполните "git rebase -i HEAD~2", чтобы переставить коммиты.',
    initialState: lvl4_2_init,
    goalState: lvl4_2_goal,
    solutionHint: ['git rebase -i HEAD~2']
  },
  {
    id: 'mixed4',
    sequenceId: 'mixed',
    sequenceTitle: '4. Сборная солянка',
    sequenceIndex: '4.4',
    number: 13,
    title: 'Теги в Git (git tag)',
    difficulty: 'medium',
    xp: 40,
    description: 'Поставьте тег v0 на коммит C1 и тег v1 на C2, затем перейдите на C2.',
    dialogue: {
      title: 'Неизменяемые теги версий',
      paragraphs: [
        'В отличие от веток, теги навсегда остаются на указанном коммите и обозначают релизы (v1.0, v2.0).'
      ],
      exampleCommands: ['git tag v0 C1', 'git tag v1 C2', 'git checkout C2']
    },
    hint: 'git tag v0 C1; git tag v1 C2; git checkout C2',
    initialState: lvl4_4_init,
    goalState: lvl4_4_goal,
    solutionHint: ['git tag v0 C1', 'git tag v1 C2', 'git checkout C2']
  },
  {
    id: 'mixed5',
    sequenceId: 'mixed',
    sequenceTitle: '4. Сборная солянка',
    sequenceIndex: '4.5',
    number: 14,
    title: 'Описание коммитов: git describe',
    difficulty: 'easy',
    xp: 35,
    description: 'Изучите команду git describe для определения расстояния до ближайшего тега.',
    dialogue: {
      title: 'Навигация по тегам',
      paragraphs: [
        'Команда "git describe" показывает, где вы находитесь относительно ближайшего якоря-тега.'
      ],
      exampleCommands: ['git describe', 'git commit']
    },
    hint: 'Сделайте коммит в main, чтобы продвинуться от тега v1.',
    initialState: lvl4_5_init,
    goalState: lvl4_5_goal,
    solutionHint: ['git commit']
  },

  // --- 5. ПРОДВИНУТЫЕ ТЕМЫ ---
  {
    id: 'adv1',
    sequenceId: 'advanced',
    sequenceTitle: '5. Продвинутые темы',
    sequenceIndex: '5.1',
    number: 15,
    title: 'Перебазирование более 9000 раз',
    difficulty: 'hard',
    xp: 60,
    description: 'Перебазируйте последовательно все ветки bugFix, side и another поверх main.',
    dialogue: {
      title: 'Многократный Rebase',
      paragraphs: [
        'Выстройте абсолютно линейную цепочку коммитов со всех параллельных веток!'
      ],
      exampleCommands: ['git rebase main bugFix', 'git rebase bugFix side', 'git rebase side another']
    },
    hint: 'Перебазируйте bugFix на main, side на bugFix, another на side, и верните main на вершину.',
    initialState: lvl5_1_init,
    goalState: lvl5_1_goal,
    solutionHint: ['git rebase main bugFix', 'git rebase bugFix side', 'git rebase side another', 'git rebase another main']
  },
  {
    id: 'adv2',
    sequenceId: 'advanced',
    sequenceTitle: '5. Продвинутые темы',
    sequenceIndex: '5.2',
    number: 16,
    title: 'Несколько родителей: HEAD^2',
    difficulty: 'medium',
    xp: 45,
    description: 'Используйте модификатор ^2 для выбора второго родителя коммита слияния.',
    dialogue: {
      title: 'Родители коммита слияния',
      paragraphs: [
        'У коммита слияния два родителя: HEAD^ — первый родитель, а HEAD^2 — второй!'
      ],
      exampleCommands: ['git checkout HEAD^2', 'git checkout -b bugFix HEAD^2']
    },
    hint: 'Создайте ветку bugFix на втором родителе коммита слияния: "git checkout -b bugFix HEAD^2".',
    initialState: lvl5_2_init,
    goalState: lvl5_2_goal,
    solutionHint: ['git checkout -b bugFix HEAD^2']
  },

  // --- 6. УДАЛЕННЫЕ РЕПОЗИТОРИИ ---
  {
    id: 'rem1',
    sequenceId: 'remote',
    sequenceTitle: '6. Удаленные репозитории',
    sequenceIndex: '6.1',
    number: 17,
    title: 'Введение в клонирование (git clone)',
    difficulty: 'easy',
    xp: 35,
    description: 'Сделайте клон удаленного репозитория для создания локальной копии.',
    dialogue: {
      title: 'Клонирование репозитория',
      paragraphs: [
        'Команда "git clone" создает локальную копию удаленного проекта и настраивает удаленные ветки o/main.'
      ],
      exampleCommands: ['git clone']
    },
    hint: 'Выполните команду "git clone".',
    initialState: lvl6_1_init,
    goalState: lvl6_1_goal,
    solutionHint: ['git clone']
  },
  {
    id: 'rem2',
    sequenceId: 'remote',
    sequenceTitle: '6. Удаленные репозитории',
    sequenceIndex: '6.2',
    number: 18,
    title: 'Удаленные ветки (o/main)',
    difficulty: 'easy',
    xp: 40,
    description: 'Сделайте коммит в локальный main, пока удаленный o/main остается на месте.',
    dialogue: {
      title: 'Разделение локальной и удаленной веток',
      paragraphs: [
        'Ветка o/main отражает состояние на сервере, а main — ваше локальное состояние.'
      ],
      exampleCommands: ['git commit', 'git checkout o/main']
    },
    hint: 'Выполните коммит и исследуйте разделение веток.',
    initialState: lvl6_2_init,
    goalState: lvl6_2_goal,
    solutionHint: ['git commit', 'git checkout C1']
  },
  {
    id: 'rem3',
    sequenceId: 'remote',
    sequenceTitle: '6. Удаленные репозитории',
    sequenceIndex: '6.3',
    number: 19,
    title: 'Загрузка изменений (git fetch)',
    difficulty: 'medium',
    xp: 45,
    description: 'Загрузите свежие коммиты с удаленного сервера без изменения локального кода.',
    dialogue: {
      title: 'Что делает git fetch?',
      paragraphs: [
        'git fetch скачивает новые коммиты с сервера и обновляет ветку o/main, не трогая ваши локальные файлы.'
      ],
      exampleCommands: ['git fetch']
    },
    hint: 'Имитируйте появление коммита на сервере и скачайте его: "git fakeTeamwork; git fetch".',
    initialState: lvl6_3_init,
    goalState: lvl6_3_goal,
    solutionHint: ['git fakeTeamwork', 'git fetch']
  },
  {
    id: 'rem4',
    sequenceId: 'remote',
    sequenceTitle: '6. Удаленные репозитории',
    sequenceIndex: '6.4',
    number: 20,
    title: 'Получение и слияние (git pull)',
    difficulty: 'medium',
    xp: 45,
    description: 'Команда git pull скачивает коммиты и сразу сливает их с текущей веткой.',
    dialogue: {
      title: 'git pull = fetch + merge',
      paragraphs: [
        'Вместо двух команд (fetch, затем merge) можно выполнить одну: git pull.'
      ],
      exampleCommands: ['git pull']
    },
    hint: 'Выполните команду "git pull", чтобы подтянуть изменения из o/main в main.',
    initialState: lvl6_4_init,
    goalState: lvl6_4_goal,
    solutionHint: ['git pull']
  },
  {
    id: 'rem5',
    sequenceId: 'remote',
    sequenceTitle: '6. Удаленные репозитории',
    sequenceIndex: '6.5',
    number: 21,
    title: 'Имитация командной работы (fakeTeamwork)',
    difficulty: 'medium',
    xp: 50,
    description: 'Сымитируйте появление коммитов от коллег на сервере с помощью fakeTeamwork.',
    dialogue: {
      title: 'Командная разработка',
      paragraphs: [
        'Пока вы пишете код локально, коллеги успели отправить свои изменения на сервер.'
      ],
      exampleCommands: ['git fakeTeamwork 2']
    },
    hint: 'Выполните "git fakeTeamwork 2", чтобы коллеги запушили 2 коммита в o/main.',
    initialState: lvl6_5_init,
    goalState: lvl6_5_goal,
    solutionHint: ['git fakeTeamwork 2']
  },
  {
    id: 'rem6',
    sequenceId: 'remote',
    sequenceTitle: '6. Удаленные репозитории',
    sequenceIndex: '6.6',
    number: 22,
    title: 'Отправка на сервер (git push)',
    difficulty: 'easy',
    xp: 40,
    description: 'Отправьте локальные наработки в удаленный репозиторий через git push.',
    dialogue: {
      title: 'Публикация работы',
      paragraphs: [
        'Команда "git push" передает ваши локальные коммиты на удаленный сервер и продвигает o/main.'
      ],
      exampleCommands: ['git push']
    },
    hint: 'Выполните команду "git push".',
    initialState: lvl6_6_init,
    goalState: lvl6_6_goal,
    solutionHint: ['git push']
  },
  {
    id: 'rem7',
    sequenceId: 'remote',
    sequenceTitle: '6. Удаленные репозитории',
    sequenceIndex: '6.7',
    number: 23,
    title: 'Разошедшаяся история (Diverged History)',
    difficulty: 'hard',
    xp: 60,
    description: 'История разошлась: на сервере появились новые коммиты, а у вас есть локальные. Синхронизируйтесь через rebase и запушьте.',
    dialogue: {
      title: 'Конфликт параллельной истории',
      paragraphs: [
        'Когда история разошлась, git push будет отклонен. Нужно сначала подтянуть изменения через "git pull --rebase" и затем сделать "git push"!'
      ],
      exampleCommands: ['git pull --rebase', 'git push']
    },
    hint: 'git pull --rebase; git push',
    initialState: lvl6_7_init,
    goalState: lvl6_7_goal,
    solutionHint: ['git pull --rebase', 'git push']
  }
];
