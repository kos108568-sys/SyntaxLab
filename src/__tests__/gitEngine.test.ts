import test from 'node:test';
import assert from 'node:assert';
import { GIT_LEVELS } from '../data/gitLevelsData.ts';
import { executeGitCommand, isGitGoalReached, cloneGitState } from '../services/gitEngine.ts';

test('Git Engine: All 23 levels fail in initial state', () => {
  for (const lvl of GIT_LEVELS) {
    const initial = cloneGitState(lvl.initialState);
    const passed = isGitGoalReached(initial, lvl.goalState);
    assert.strictEqual(passed, false, `Level ${lvl.number} (${lvl.title}) should not pass in initial state`);
  }
});

test('Git Engine: All 23 levels pass with their official solution hints', () => {
  for (const lvl of GIT_LEVELS) {
    let state = cloneGitState(lvl.initialState);
    for (const cmd of lvl.solutionHint) {
      const res = executeGitCommand(state, cmd);
      state = res.nextState;
    }
    const passed = isGitGoalReached(state, lvl.goalState);
    assert.strictEqual(passed, true, `Level ${lvl.number} (${lvl.title}) should pass with solutionHint`);
  }
});

test('Git Engine: Detached HEAD level 2.1 requires C4, rejects C0', () => {
  const lvl = GIT_LEVELS.find(l => l.id === 'ramp1')!;
  let stateC0 = cloneGitState(lvl.initialState);
  stateC0 = executeGitCommand(stateC0, 'git checkout C0').nextState;
  assert.strictEqual(isGitGoalReached(stateC0, lvl.goalState), false);

  let stateC4 = cloneGitState(lvl.initialState);
  stateC4 = executeGitCommand(stateC4, 'git checkout C4').nextState;
  assert.strictEqual(isGitGoalReached(stateC4, lvl.goalState), true);
});
