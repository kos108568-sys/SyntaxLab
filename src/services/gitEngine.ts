export interface GitCommit {
  id: string;
  parentIds: string[];
  message?: string;
  isRoot?: boolean;
}

export interface GitHead {
  type: 'branch' | 'commit';
  name: string; // branch name (e.g. 'main') or commit id (e.g. 'C1')
}

export interface GitState {
  commits: Record<string, GitCommit>;
  branches: Record<string, string>; // branchName -> commitId
  head: GitHead;
  commitCounter: number;
}

export interface GitExecutionResult {
  nextState: GitState;
  output: string;
  isError: boolean;
  commandType?: 'commit' | 'branch' | 'checkout' | 'merge' | 'rebase' | 'reset' | 'revert' | 'cherry-pick' | 'other';
}

/**
 * Creates a clean initial Git state with a single root commit C0 on 'main'.
 */
export function createInitialGitState(): GitState {
  return {
    commits: {
      C0: { id: 'C0', parentIds: [], isRoot: true, message: 'Initial commit' }
    },
    branches: {
      main: 'C0'
    },
    head: {
      type: 'branch',
      name: 'main'
    },
    commitCounter: 0
  };
}

/**
 * Deep clones a GitState.
 */
export function cloneGitState(state: GitState): GitState {
  return {
    commits: { ...state.commits },
    branches: { ...state.branches },
    head: { ...state.head },
    commitCounter: state.commitCounter
  };
}

/**
 * Resolves current commit ID that HEAD is pointing to.
 */
export function getHeadCommitId(state: GitState): string {
  if (state.head.type === 'branch') {
    return state.branches[state.head.name] || 'C0';
  }
  return state.head.name;
}

/**
 * Finds all ancestors of a commit.
 */
export function getAncestors(commits: Record<string, GitCommit>, startCommitId: string): Set<string> {
  const ancestors = new Set<string>();
  const queue = [startCommitId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    ancestors.add(curr);
    const node = commits[curr];
    if (node) {
      for (const p of node.parentIds) {
        if (!ancestors.has(p)) {
          queue.push(p);
        }
      }
    }
  }

  return ancestors;
}

/**
 * Finds lowest common ancestor of two commits.
 */
export function findCommonAncestor(commits: Record<string, GitCommit>, aId: string, bId: string): string | null {
  const ancestorsA = getAncestors(commits, aId);
  const queue = [bId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (ancestorsA.has(curr)) return curr;
    visited.add(curr);
    const node = commits[curr];
    if (node) {
      for (const p of node.parentIds) {
        if (!visited.has(p)) queue.push(p);
      }
    }
  }

  return 'C0';
}

/**
 * Executes a Git command string against a GitState.
 */
export function executeGitCommand(
  currentState: GitState,
  commandLine: string
): GitExecutionResult {
  const trimmed = commandLine.trim();
  if (!trimmed) {
    return { nextState: currentState, output: '', isError: false };
  }

  const parts = trimmed.split(/\s+/);
  const mainCmd = parts[0].toLowerCase();

  if (mainCmd !== 'git') {
    if (mainCmd === 'help' || mainCmd === '?') {
      return {
        nextState: currentState,
        output: [
          'Поддерживаемые команды Git:',
          '  git commit [-m "сообщение"]  - создать новый коммит',
          '  git branch <имя_ветки>       - создать ветку',
          '  git branch -d <имя_ветки>    - удалить ветку',
          '  git checkout <ветка|коммит>  - переключиться на ветку/коммит (или git switch)',
          '  git checkout -b <ветка>      - создать ветку и переключиться (или git switch -c)',
          '  git merge <ветка>            - слить указанную ветку в текущую',
          '  git rebase <ветка>           - перебазировать текущую ветку поверх указанной',
          '  git cherry-pick <коммит...>  - скопировать коммиты в текущую ветку',
          '  git reset [HEAD~1 | коммит]  - переместить указатель ветки назад',
          '  git revert <коммит>          - создать компенсирующий коммит',
          '  git log                      - просмотр истории коммитов',
          '  undo                         - отменить последнюю выполненную команду',
          '  reset                        - сбросить уровень к начальному состоянию',
          '  clear                        - очистить терминал'
        ].join('\n'),
        isError: false,
        commandType: 'other'
      };
    }

    return {
      nextState: currentState,
      output: `Команда "${mainCmd}" не распознана. Используйте команды, начинающиеся с "git", или введите "help".`,
      isError: true
    };
  }

  const subCmd = (parts[1] || '').toLowerCase();
  const args = parts.slice(2);
  const state = cloneGitState(currentState);

  // 1. git commit
  if (subCmd === 'commit') {
    state.commitCounter += 1;
    const newCommitId = `C${state.commitCounter}`;
    const parentId = getHeadCommitId(state);

    state.commits[newCommitId] = {
      id: newCommitId,
      parentIds: [parentId],
      message: `Commit ${newCommitId}`
    };

    if (state.head.type === 'branch') {
      state.branches[state.head.name] = newCommitId;
      return {
        nextState: state,
        output: `[${state.head.name} ${newCommitId}] Создан коммит ${newCommitId} (родитель: ${parentId})`,
        isError: false,
        commandType: 'commit'
      };
    } else {
      // Detached HEAD
      state.head.name = newCommitId;
      return {
        nextState: state,
        output: `[detached HEAD ${newCommitId}] Создан коммит ${newCommitId} в отсоединенном HEAD (родитель: ${parentId})`,
        isError: false,
        commandType: 'commit'
      };
    }
  }

  // 2. git branch
  if (subCmd === 'branch') {
    if (args.length === 0) {
      // List branches
      const branchLines = Object.keys(state.branches).map(b => {
        const isCurrent = state.head.type === 'branch' && state.head.name === b;
        return `${isCurrent ? '* ' : '  '}${b} -> ${state.branches[b]}`;
      });
      return {
        nextState: state,
        output: branchLines.join('\n'),
        isError: false,
        commandType: 'branch'
      };
    }

    if (args[0] === '-d' || args[0] === '-D') {
      const branchToDelete = args[1];
      if (!branchToDelete) {
        return { nextState: state, output: 'Ошибка: укажите имя ветки для удаления: git branch -d <имя>', isError: true };
      }
      if (!state.branches[branchToDelete]) {
        return { nextState: state, output: `Ошибка: ветка "${branchToDelete}" не найдена.`, isError: true };
      }
      if (state.head.type === 'branch' && state.head.name === branchToDelete) {
        return { nextState: state, output: `Ошибка: нельзя удалить ветку "${branchToDelete}", пока вы на ней находитесь.`, isError: true };
      }
      delete state.branches[branchToDelete];
      return {
        nextState: state,
        output: `Ветка "${branchToDelete}" успешно удалена.`,
        isError: false,
        commandType: 'branch'
      };
    }

    const newBranchName = args[0];
    const targetCommit = args[1] 
      ? resolveRef(state, args[1]) 
      : getHeadCommitId(state);

    if (!targetCommit || !state.commits[targetCommit]) {
      return { nextState: state, output: `Ошибка: коммит "${args[1]}" не существует.`, isError: true };
    }

    state.branches[newBranchName] = targetCommit;
    return {
      nextState: state,
      output: `Создана новая ветка "${newBranchName}" на коммите ${targetCommit}.`,
      isError: false,
      commandType: 'branch'
    };
  }

  // 3. git checkout or git switch
  if (subCmd === 'checkout' || subCmd === 'switch') {
    if (args.length === 0) {
      return { nextState: state, output: 'Ошибка: укажите ветку или коммит: git checkout <имя>', isError: true };
    }

    // git checkout -b <branch> or git switch -c <branch>
    if (args[0] === '-b' || args[0] === '-c') {
      const newBranchName = args[1];
      if (!newBranchName) {
        return { nextState: state, output: 'Ошибка: укажите имя новой ветки: git checkout -b <имя>', isError: true };
      }
      const targetCommit = args[2] ? resolveRef(state, args[2]) : getHeadCommitId(state);
      if (!targetCommit || !state.commits[targetCommit]) {
        return { nextState: state, output: `Ошибка: коммит "${args[2]}" не найден.`, isError: true };
      }

      state.branches[newBranchName] = targetCommit;
      state.head = { type: 'branch', name: newBranchName };
      return {
        nextState: state,
        output: `Создана и активирована новая ветка "${newBranchName}" на ${targetCommit}`,
        isError: false,
        commandType: 'checkout'
      };
    }

    const ref = args[0];
    const resolved = resolveRef(state, ref);

    if (state.branches[ref]) {
      // Switching to a branch
      state.head = { type: 'branch', name: ref };
      return {
        nextState: state,
        output: `Переключено на ветку '${ref}'`,
        isError: false,
        commandType: 'checkout'
      };
    }

    if (resolved && state.commits[resolved]) {
      // Detaching HEAD onto commit
      state.head = { type: 'commit', name: resolved };
      return {
        nextState: state,
        output: `Примечание: переключение на '${resolved}'. Вы находитесь в состоянии «detached HEAD» (отсоединенный HEAD).`,
        isError: false,
        commandType: 'checkout'
      };
    }

    return {
      nextState: state,
      output: `Ошибка: путь/ветка '${ref}' не соответствует ни одной ветке или коммиту.`,
      isError: true
    };
  }

  // 4. git merge
  if (subCmd === 'merge') {
    if (args.length === 0) {
      return { nextState: state, output: 'Ошибка: укажите ветку для слияния: git merge <ветка>', isError: true };
    }

    const targetBranch = args[0];
    const targetCommitId = resolveRef(state, targetBranch);
    const currentCommitId = getHeadCommitId(state);

    if (!targetCommitId || !state.commits[targetCommitId]) {
      return { nextState: state, output: `Ошибка: ветка или ссылка '${targetBranch}' не существует.`, isError: true };
    }

    if (targetCommitId === currentCommitId) {
      return { nextState: state, output: 'Уже актуально (Already up to date).', isError: false };
    }

    // Fast-forward check: is currentCommitId an ancestor of targetCommitId?
    const ancestorsTarget = getAncestors(state.commits, targetCommitId);
    if (ancestorsTarget.has(currentCommitId)) {
      if (state.head.type === 'branch') {
        state.branches[state.head.name] = targetCommitId;
      } else {
        state.head.name = targetCommitId;
      }
      return {
        nextState: state,
        output: `Обновление Fast-forward: ${currentCommitId} -> ${targetCommitId}`,
        isError: false,
        commandType: 'merge'
      };
    }

    // Create merge commit with 2 parents: [current, target]
    state.commitCounter += 1;
    const mergeCommitId = `C${state.commitCounter}`;
    state.commits[mergeCommitId] = {
      id: mergeCommitId,
      parentIds: [currentCommitId, targetCommitId],
      message: `Merge branch '${targetBranch}'`
    };

    if (state.head.type === 'branch') {
      state.branches[state.head.name] = mergeCommitId;
    } else {
      state.head.name = mergeCommitId;
    }

    return {
      nextState: state,
      output: `Слияние выполнено с созданием коммита ${mergeCommitId} (родители: ${currentCommitId}, ${targetCommitId})`,
      isError: false,
      commandType: 'merge'
    };
  }

  // 5. git rebase
  if (subCmd === 'rebase') {
    if (args.length === 0) {
      return { nextState: state, output: 'Ошибка: укажите целевую ветку для rebase: git rebase <ветка>', isError: true };
    }

    const targetRef = args[0];
    const targetCommitId = resolveRef(state, targetRef);
    const currentCommitId = getHeadCommitId(state);

    if (!targetCommitId || !state.commits[targetCommitId]) {
      return { nextState: state, output: `Ошибка: ссылка '${targetRef}' не найдена.`, isError: true };
    }

    if (targetCommitId === currentCommitId) {
      return { nextState: state, output: 'Текущая ветка уже находится на вершине целевого коммита.', isError: false };
    }

    // Collect commits on current branch back to common ancestor
    const commonAncestor = findCommonAncestor(state.commits, currentCommitId, targetCommitId);
    const commitsToReplay: string[] = [];
    let curr = currentCommitId;

    while (curr && curr !== commonAncestor && state.commits[curr]) {
      commitsToReplay.unshift(curr);
      const parent = state.commits[curr].parentIds[0];
      curr = parent;
    }

    if (commitsToReplay.length === 0) {
      // Already ancestor, fast-forward current branch to target
      if (state.head.type === 'branch') {
        state.branches[state.head.name] = targetCommitId;
      } else {
        state.head.name = targetCommitId;
      }
      return {
        nextState: state,
        output: `Ветка перемотана вперед (Fast-forward) на ${targetCommitId}`,
        isError: false,
        commandType: 'rebase'
      };
    }

    // Replay commits on top of targetCommitId
    let newParentId = targetCommitId;
    for (const oldCommitId of commitsToReplay) {
      state.commitCounter += 1;
      const rebasedId = `C${state.commitCounter}'`;
      state.commits[rebasedId] = {
        id: rebasedId,
        parentIds: [newParentId],
        message: `Rebased copy of ${oldCommitId}`
      };
      newParentId = rebasedId;
    }

    if (state.head.type === 'branch') {
      state.branches[state.head.name] = newParentId;
    } else {
      state.head.name = newParentId;
    }

    return {
      nextState: state,
      output: `Успешно перебазировано ${commitsToReplay.length} коммитов поверх ${targetCommitId}. Новая вершина: ${newParentId}`,
      isError: false,
      commandType: 'rebase'
    };
  }

  // 6. git cherry-pick
  if (subCmd === 'cherry-pick') {
    if (args.length === 0) {
      return { nextState: state, output: 'Ошибка: укажите коммиты: git cherry-pick <C1> <C2>...', isError: true };
    }

    let currentParent = getHeadCommitId(state);
    const copied: string[] = [];

    for (const rawRef of args) {
      const sourceId = resolveRef(state, rawRef);
      if (!sourceId || !state.commits[sourceId]) {
        return { nextState: state, output: `Ошибка: коммит "${rawRef}" не найден.`, isError: true };
      }

      state.commitCounter += 1;
      const newId = `C${state.commitCounter}''`;
      state.commits[newId] = {
        id: newId,
        parentIds: [currentParent],
        message: `Cherry-picked from ${sourceId}`
      };
      currentParent = newId;
      copied.push(newId);
    }

    if (state.head.type === 'branch') {
      state.branches[state.head.name] = currentParent;
    } else {
      state.head.name = currentParent;
    }

    return {
      nextState: state,
      output: `Успешно применены коммиты через cherry-pick: ${copied.join(', ')}`,
      isError: false,
      commandType: 'cherry-pick'
    };
  }

  // 7. git reset
  if (subCmd === 'reset') {
    const targetRef = args[0] || 'HEAD~1';
    const targetId = resolveRef(state, targetRef);

    if (!targetId || !state.commits[targetId]) {
      return { nextState: state, output: `Ошибка: невозможно перейти к '${targetRef}'.`, isError: true };
    }

    if (state.head.type === 'branch') {
      state.branches[state.head.name] = targetId;
      return {
        nextState: state,
        output: `Ветка '${state.head.name}' возвращена на коммит ${targetId}`,
        isError: false,
        commandType: 'reset'
      };
    } else {
      state.head.name = targetId;
      return {
        nextState: state,
        output: `HEAD возвращен на коммит ${targetId}`,
        isError: false,
        commandType: 'reset'
      };
    }
  }

  // 8. git revert
  if (subCmd === 'revert') {
    if (args.length === 0) {
      return { nextState: state, output: 'Ошибка: укажите коммит для отмены: git revert <коммит>', isError: true };
    }

    const targetRef = args[0];
    const targetId = resolveRef(state, targetRef);
    if (!targetId || !state.commits[targetId]) {
      return { nextState: state, output: `Ошибка: коммит "${targetRef}" не найден.`, isError: true };
    }

    state.commitCounter += 1;
    const revertId = `C${state.commitCounter}`;
    const parentId = getHeadCommitId(state);

    state.commits[revertId] = {
      id: revertId,
      parentIds: [parentId],
      message: `Revert "${targetId}"`
    };

    if (state.head.type === 'branch') {
      state.branches[state.head.name] = revertId;
    } else {
      state.head.name = revertId;
    }

    return {
      nextState: state,
      output: `Создан коммит ${revertId}, отменяющий изменения из ${targetId}`,
      isError: false,
      commandType: 'revert'
    };
  }

  // 9. git log
  if (subCmd === 'log') {
    const lines: string[] = [];
    let curr: string | null = getHeadCommitId(state);
    while (curr && state.commits[curr]) {
      const c: GitCommit = state.commits[curr];
      lines.push(`commit ${c.id}`);
      if (c.parentIds.length > 1) {
        lines.push(`Merge: ${c.parentIds.join(' ')}`);
      }
      lines.push(`    ${c.message || 'No commit message'}\n`);
      curr = c.parentIds[0] || null;
    }
    return {
      nextState: state,
      output: lines.join('\n'),
      isError: false,
      commandType: 'other'
    };
  }

  return {
    nextState: state,
    output: `Команда "git ${subCmd}" пока не поддерживается или содержит опечатку. Введите "help" для списка команд.`,
    isError: true
  };
}

/**
 * Resolves relative references like HEAD~1, HEAD^, branch name or commit id.
 */
function resolveRef(state: GitState, ref: string): string | null {
  if (!ref) return null;

  // Direct commit ID
  if (state.commits[ref]) return ref;

  // Branch
  if (state.branches[ref]) return state.branches[ref];

  // HEAD
  let current = getHeadCommitId(state);
  if (ref === 'HEAD') return current;

  // HEAD~N or ref~N
  if (ref.includes('~')) {
    const [base, offsetStr] = ref.split('~');
    const offset = parseInt(offsetStr, 10) || 1;
    let currId = base === 'HEAD' ? getHeadCommitId(state) : (state.branches[base] || base);

    for (let i = 0; i < offset; i++) {
      const commit = state.commits[currId];
      if (!commit || commit.parentIds.length === 0) return null;
      currId = commit.parentIds[0];
    }
    return currId;
  }

  // HEAD^ or ref^
  if (ref.endsWith('^')) {
    const base = ref.slice(0, -1);
    const currId = base === 'HEAD' ? getHeadCommitId(state) : (state.branches[base] || base);
    const commit = state.commits[currId];
    return commit && commit.parentIds.length > 0 ? commit.parentIds[0] : null;
  }

  return null;
}

/**
 * Checks if current Git state matches the goal Git state (topology, branch pointers, HEAD).
 */
export function isGitGoalReached(current: GitState, goal: GitState): boolean {
  // 1. Check all goal branches exist in current
  for (const branchName of Object.keys(goal.branches)) {
    if (!current.branches[branchName]) return false;
  }

  // 2. Check HEAD target match
  if (goal.head.type !== current.head.type) return false;
  if (goal.head.type === 'branch' && goal.head.name !== current.head.name) return false;

  // 3. Check commit count or graph structure
  const currentCommitsCount = Object.keys(current.commits).length;
  const goalCommitsCount = Object.keys(goal.commits).length;

  if (currentCommitsCount !== goalCommitsCount) return false;

  // 4. Verify branch tips match relative to commit parent structures
  for (const branch of Object.keys(goal.branches)) {
    const curTip = current.branches[branch];
    const goalTip = goal.branches[branch];
    if (!curTip || !goalTip) return false;

    // Check parents count of the tip commit
    const curCommit = current.commits[curTip];
    const goalCommit = goal.commits[goalTip];
    if (!curCommit || !goalCommit) return false;
    if (curCommit.parentIds.length !== goalCommit.parentIds.length) return false;
  }

  return true;
}
