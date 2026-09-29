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
  tags?: Record<string, string>;     // tagName -> commitId
  head: GitHead;
  commitCounter: number;
}

export interface GitExecutionResult {
  nextState: GitState;
  output: string;
  isError: boolean;
  commandType?: 'commit' | 'branch' | 'checkout' | 'merge' | 'rebase' | 'reset' | 'revert' | 'cherry-pick' | 'tag' | 'remote' | 'other';
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
    tags: {},
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
    tags: { ...(state.tags || {}) },
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
 * Resolves relative references like HEAD~1, HEAD^, HEAD^2, branch name, tag or commit id.
 */
export function resolveRef(state: GitState, ref: string): string | null {
  if (!ref) return null;

  // Direct commit ID
  if (state.commits[ref]) return ref;

  // Branch
  if (state.branches[ref]) return state.branches[ref];

  // Tag
  if (state.tags && state.tags[ref]) return state.tags[ref];

  // HEAD
  let current = getHeadCommitId(state);
  if (ref === 'HEAD') return current;

  // Multiple parent operator like HEAD^2 or ref^2 (second parent of merge)
  if (ref.includes('^2')) {
    const [base] = ref.split('^2');
    const currId = base === 'HEAD' ? getHeadCommitId(state) : (state.branches[base] || (state.tags && state.tags[base]) || base);
    const commit = state.commits[currId];
    return commit && commit.parentIds.length > 1 ? commit.parentIds[1] : null;
  }

  // HEAD~N or ref~N
  if (ref.includes('~')) {
    const [base, offsetStr] = ref.split('~');
    const offset = parseInt(offsetStr, 10) || 1;
    let currId = base === 'HEAD' ? getHeadCommitId(state) : (state.branches[base] || (state.tags && state.tags[base]) || base);

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
    const currId = base === 'HEAD' ? getHeadCommitId(state) : (state.branches[base] || (state.tags && state.tags[base]) || base);
    const commit = state.commits[currId];
    return commit && commit.parentIds.length > 0 ? commit.parentIds[0] : null;
  }

  return null;
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
          'Поддерживаемые команды Git (Learn Git Branching):',
          '  git commit [-m "msg"]        - создать коммит',
          '  git branch <имя>             - создать ветку',
          '  git branch -f <ветка> <цель> - принудительно переместить ветку на коммит',
          '  git branch -d <ветка>        - удалить ветку',
          '  git checkout <ветка|коммит>  - переключиться (или git switch)',
          '  git checkout -b <ветка>      - создать и переключиться (или git switch -c)',
          '  git merge <ветка>            - слить ветку в текущую',
          '  git rebase <ветка>           - перебазировать текущую ветку поверх указанной',
          '  git cherry-pick <C1> <C2>... - скопировать коммиты в текущую ветку',
          '  git reset [HEAD~1 | коммит]  - переместить указатель ветки назад',
          '  git revert <коммит>          - создать компенсирующий коммит',
          '  git tag <имя> [коммит]       - создать фиксированный тег версии',
          '  git describe [коммит]        - показать ближайший тег и расстояние',
          '  git clone                    - клонировать удаленный репозиторий',
          '  git fakeTeamwork [кол-во]    - сымитировать коммиты от коллег на remote',
          '  git fetch                    - скачать коммиты из удаленного репозитория',
          '  git pull [--rebase]          - скачать и объединить с локальной веткой',
          '  git push                     - отправить коммиты в удаленный репозиторий',
          '  undo                         - отменить последнюю выполненную команду',
          '  reset                        - сбросить уровень к начальному состоянию',
          '  clear                        - очистить экран терминала'
        ].join('\n'),
        isError: false,
        commandType: 'other'
      };
    }

    return {
      nextState: currentState,
      output: `Команда "${mainCmd}" не распознана. Введите команду Git или "help".`,
      isError: true
    };
  }

  const subCmd = (parts[1] || '').toLowerCase();
  const args = parts.slice(2);
  const state = cloneGitState(currentState);
  if (!state.tags) state.tags = {};

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

    // Force move branch: git branch -f <branch> <target>
    if (args[0] === '-f') {
      const branchToMove = args[1];
      const target = args[2] ? resolveRef(state, args[2]) : getHeadCommitId(state);
      if (!branchToMove || !target || !state.commits[target]) {
        return { nextState: state, output: 'Ошибка: использование: git branch -f <ветка> <коммит>', isError: true };
      }
      state.branches[branchToMove] = target;
      return {
        nextState: state,
        output: `Ветка "${branchToMove}" принудительно перемещена на ${target}.`,
        isError: false,
        commandType: 'branch'
      };
    }

    // Delete branch: git branch -d <branch>
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

    // git checkout -b <branch> [target]
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
      state.head = { type: 'branch', name: ref };
      return {
        nextState: state,
        output: `Переключено на ветку '${ref}'`,
        isError: false,
        commandType: 'checkout'
      };
    }

    if (resolved && state.commits[resolved]) {
      state.head = { type: 'commit', name: resolved };
      return {
        nextState: state,
        output: `Переключение на '${resolved}'. Вы находитесь в состоянии «detached HEAD» (отсоединенный HEAD).`,
        isError: false,
        commandType: 'checkout'
      };
    }

    return {
      nextState: state,
      output: `Ошибка: ссылка '${ref}' не соответствует ни одной ветке, тегу или коммиту.`,
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

    // Interactive rebase simulation: git rebase -i HEAD~N
    const isInteractive = args[0] === '-i';
    const targetRef = isInteractive ? args[1] : args[0];
    const targetCommitId = resolveRef(state, targetRef);
    const currentCommitId = getHeadCommitId(state);

    if (!targetCommitId || !state.commits[targetCommitId]) {
      return { nextState: state, output: `Ошибка: ссылка '${targetRef}' не найдена.`, isError: true };
    }

    if (targetCommitId === currentCommitId) {
      return { nextState: state, output: 'Текущая ветка уже находится на вершине целевого коммита.', isError: false };
    }

    const commonAncestor = findCommonAncestor(state.commits, currentCommitId, targetCommitId);
    const commitsToReplay: string[] = [];
    let curr = currentCommitId;

    while (curr && curr !== commonAncestor && state.commits[curr]) {
      commitsToReplay.unshift(curr);
      const parent = state.commits[curr].parentIds[0];
      curr = parent;
    }

    if (commitsToReplay.length === 0) {
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
      output: isInteractive 
        ? `[Интерактивный Rebase] История переупорядочена и воспроизведена. Новая вершина: ${newParentId}`
        : `Успешно перебазировано ${commitsToReplay.length} коммитов поверх ${targetCommitId}. Новая вершина: ${newParentId}`,
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
    const targetRef = args[0] || 'HEAD';
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

  // 9. git tag
  if (subCmd === 'tag') {
    if (args.length === 0) {
      const tagLines = Object.keys(state.tags).map(t => `${t} -> ${state.tags![t]}`);
      return {
        nextState: state,
        output: tagLines.length > 0 ? tagLines.join('\n') : 'Теги отсутствуют.',
        isError: false,
        commandType: 'tag'
      };
    }

    if (args[0] === '-d') {
      const tagToDelete = args[1];
      if (!tagToDelete || !state.tags[tagToDelete]) {
        return { nextState: state, output: `Ошибка: тег "${tagToDelete}" не найден.`, isError: true };
      }
      delete state.tags[tagToDelete];
      return {
        nextState: state,
        output: `Тег "${tagToDelete}" удален.`,
        isError: false,
        commandType: 'tag'
      };
    }

    const tagName = args[0];
    const targetCommit = args[1] ? resolveRef(state, args[1]) : getHeadCommitId(state);

    if (!targetCommit || !state.commits[targetCommit]) {
      return { nextState: state, output: `Ошибка: коммит "${args[1]}" не существует.`, isError: true };
    }

    state.tags[tagName] = targetCommit;
    return {
      nextState: state,
      output: `Создан постоянный тег "${tagName}" на коммите ${targetCommit}.`,
      isError: false,
      commandType: 'tag'
    };
  }

  // 10. git describe
  if (subCmd === 'describe') {
    const targetRef = args[0] || 'HEAD';
    const targetCommit = resolveRef(state, targetRef);
    if (!targetCommit || !state.commits[targetCommit]) {
      return { nextState: state, output: `Ошибка: коммит "${targetRef}" не найден.`, isError: true };
    }

    const tagEntries = Object.entries(state.tags || {});
    if (tagEntries.length === 0) {
      return { nextState: state, output: `fatal: No tags can describe '${targetRef}'.`, isError: true };
    }

    // Find closest tag ancestor
    let closestTag = tagEntries[0][0];
    let minDistance = 0;

    for (const [tag, tagCommit] of tagEntries) {
      if (tagCommit === targetCommit) {
        return {
          nextState: state,
          output: tag,
          isError: false,
          commandType: 'other'
        };
      }
      const ancestors = getAncestors(state.commits, targetCommit);
      if (ancestors.has(tagCommit)) {
        closestTag = tag;
        minDistance = 1; // Simplified distance for visualizer
      }
    }

    return {
      nextState: state,
      output: `${closestTag}_${minDistance}_g${targetCommit}`,
      isError: false,
      commandType: 'other'
    };
  }

  // 11. git clone
  if (subCmd === 'clone') {
    const curHeadCommit = getHeadCommitId(state);
    state.branches['o/main'] = curHeadCommit;
    return {
      nextState: state,
      output: `Клонирование в 'repo'...\nУдаленная ветка 'o/main' настроена на ${curHeadCommit}.`,
      isError: false,
      commandType: 'remote'
    };
  }

  // 12. git fakeTeamwork
  if (subCmd === 'faketeamwork') {
    const count = parseInt(args[0], 10) || 1;
    const remoteBranch = 'o/main';
    let currentRemoteTip = state.branches[remoteBranch] || getHeadCommitId(state);

    const created: string[] = [];
    for (let i = 0; i < count; i++) {
      state.commitCounter += 1;
      const fakeId = `C${state.commitCounter}`;
      state.commits[fakeId] = {
        id: fakeId,
        parentIds: [currentRemoteTip],
        message: `Remote coworker commit ${fakeId}`
      };
      currentRemoteTip = fakeId;
      created.push(fakeId);
    }
    state.branches[remoteBranch] = currentRemoteTip;

    return {
      nextState: state,
      output: `[Имитация командной работы] Коллеги запушили ${count} коммит(ов) в ${remoteBranch}: ${created.join(', ')}`,
      isError: false,
      commandType: 'remote'
    };
  }

  // 13. git fetch
  if (subCmd === 'fetch') {
    return {
      nextState: state,
      output: `Все удаленные ссылки и ветки (o/main) успешно синхронизированы.`,
      isError: false,
      commandType: 'remote'
    };
  }

  // 14. git pull
  if (subCmd === 'pull') {
    const isRebase = args.includes('--rebase');
    const remoteBranch = 'o/main';
    const remoteCommit = state.branches[remoteBranch] || state.branches['origin/main'];

    if (!remoteCommit) {
      return { nextState: state, output: 'Ошибка: удаленная ветка не настроена (выполните git clone).', isError: true };
    }

    if (isRebase) {
      return executeGitCommand(state, `git rebase ${remoteBranch}`);
    } else {
      return executeGitCommand(state, `git merge ${remoteBranch}`);
    }
  }

  // 15. git push
  if (subCmd === 'push') {
    const curCommit = getHeadCommitId(state);
    const remoteBranch = 'o/main';
    const remoteTip = state.branches[remoteBranch];

    if (remoteTip) {
      const ancestorsOfCurrent = getAncestors(state.commits, curCommit);
      if (!ancestorsOfCurrent.has(remoteTip)) {
        return {
          nextState: state,
          output: `error: failed to push some refs to 'origin'.\nПодсказка: История разошлась (diverged). Сначала подтяните изменения через 'git pull' или 'git fetch && git rebase o/main'.`,
          isError: true,
          commandType: 'remote'
        };
      }
    }

    state.branches[remoteBranch] = curCommit;
    return {
      nextState: state,
      output: `Успешно отправлено в origin/${state.head.name}: ${curCommit}`,
      isError: false,
      commandType: 'remote'
    };
  }

  // 16. git log
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
 * Checks if current Git state matches the goal Git state (topology, branch pointers, HEAD, tags).
 */
export function isGitGoalReached(current: GitState, goal: GitState): boolean {
  // 1. Check all goal branches exist in current
  for (const branchName of Object.keys(goal.branches)) {
    if (!current.branches[branchName]) return false;
  }

  // 2. Check tags if goal has them
  if (goal.tags && Object.keys(goal.tags).length > 0) {
    if (!current.tags) return false;
    for (const tagName of Object.keys(goal.tags)) {
      if (!current.tags[tagName]) return false;
    }
  }

  // 3. Check HEAD target match
  if (goal.head.type !== current.head.type) return false;
  if (goal.head.type === 'branch' && goal.head.name !== current.head.name) return false;

  // 4. Check commit count or graph structure
  const currentCommitsCount = Object.keys(current.commits).length;
  const goalCommitsCount = Object.keys(goal.commits).length;

  if (currentCommitsCount !== goalCommitsCount) return false;

  // 5. Verify branch tips match relative to commit parent structures
  for (const branch of Object.keys(goal.branches)) {
    const curTip = current.branches[branch];
    const goalTip = goal.branches[branch];
    if (!curTip || !goalTip) return false;

    const curCommit = current.commits[curTip];
    const goalCommit = goal.commits[goalTip];
    if (!curCommit || !goalCommit) return false;
    if (curCommit.parentIds.length !== goalCommit.parentIds.length) return false;
  }

  return true;
}
