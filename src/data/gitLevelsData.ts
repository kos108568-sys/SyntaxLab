import { createInitialGitState, type GitState } from '../services/gitEngine';

export interface GitLevel {
  id: string;
  number: number;
  title: string;
  category: 'Основы' | 'Ветвление' | 'Продвинутый' | 'Песочница';
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

// 1. Level 1: Git Commits
const level1Initial = createInitialGitState();
level1Initial.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true, message: 'Initial commit' },
  C1: { id: 'C1', parentIds: ['C0'], message: 'First commit' }
};
level1Initial.branches = { main: 'C1' };
level1Initial.head = { type: 'branch', name: 'main' };
level1Initial.commitCounter = 1;

const level1Goal = createInitialGitState();
level1Goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C2'] }
};
level1Goal.branches = { main: 'C3' };
level1Goal.head = { type: 'branch', name: 'main' };
level1Goal.commitCounter = 3;

// 2. Level 2: Branching
const level2Initial = createInitialGitState();
level2Initial.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] }
};
level2Initial.branches = { main: 'C1' };
level2Initial.head = { type: 'branch', name: 'main' };
level2Initial.commitCounter = 1;

const level2Goal = createInitialGitState();
level2Goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] }
};
level2Goal.branches = { main: 'C1', bugFix: 'C1' };
level2Goal.head = { type: 'branch', name: 'bugFix' };
level2Goal.commitCounter = 1;

// 3. Level 3: Merge
const level3Initial = createInitialGitState();
level3Initial.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] }
};
level3Initial.branches = { main: 'C1' };
level3Initial.head = { type: 'branch', name: 'main' };
level3Initial.commitCounter = 1;

const level3Goal = createInitialGitState();
level3Goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C1'] },
  C4: { id: 'C4', parentIds: ['C3', 'C2'] }
};
level3Goal.branches = { main: 'C4', bugFix: 'C2' };
level3Goal.head = { type: 'branch', name: 'main' };
level3Goal.commitCounter = 4;

// 4. Level 4: Rebase
const level4Initial = createInitialGitState();
level4Initial.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C1'] }
};
level4Initial.branches = { main: 'C3', bugFix: 'C2' };
level4Initial.head = { type: 'branch', name: 'bugFix' };
level4Initial.commitCounter = 3;

const level4Goal = createInitialGitState();
level4Goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C1'] },
  "C2'": { id: "C2'", parentIds: ['C3'] }
};
level4Goal.branches = { main: 'C3', bugFix: "C2'" };
level4Goal.head = { type: 'branch', name: 'bugFix' };
level4Goal.commitCounter = 4;

// 5. Level 5: Detached HEAD
const level5Initial = createInitialGitState();
level5Initial.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] }
};
level5Initial.branches = { main: 'C1' };
level5Initial.head = { type: 'branch', name: 'main' };
level5Initial.commitCounter = 1;

const level5Goal = createInitialGitState();
level5Goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] }
};
level5Goal.branches = { main: 'C1' };
level5Goal.head = { type: 'commit', name: 'C1' };
level5Goal.commitCounter = 1;

// 6. Level 6: Relative refs
const level6Initial = createInitialGitState();
level6Initial.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C2'] }
};
level6Initial.branches = { main: 'C3', bugFix: 'C3' };
level6Initial.head = { type: 'branch', name: 'bugFix' };
level6Initial.commitCounter = 3;

const level6Goal = createInitialGitState();
level6Goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C2'] }
};
level6Goal.branches = { main: 'C3', bugFix: 'C2' };
level6Goal.head = { type: 'branch', name: 'bugFix' };
level6Goal.commitCounter = 3;

// 7. Level 7: Cherry-pick
const level7Initial = createInitialGitState();
level7Initial.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C2'] },
  C4: { id: 'C4', parentIds: ['C1'] }
};
level7Initial.branches = { main: 'C4', side: 'C3' };
level7Initial.head = { type: 'branch', name: 'main' };
level7Initial.commitCounter = 4;

const level7Goal = createInitialGitState();
level7Goal.commits = {
  C0: { id: 'C0', parentIds: [], isRoot: true },
  C1: { id: 'C1', parentIds: ['C0'] },
  C2: { id: 'C2', parentIds: ['C1'] },
  C3: { id: 'C3', parentIds: ['C2'] },
  C4: { id: 'C4', parentIds: ['C1'] },
  "C3''": { id: "C3''", parentIds: ['C4'] }
};
level7Goal.branches = { main: "C3''", side: 'C3' };
level7Goal.head = { type: 'branch', name: 'main' };
level7Goal.commitCounter = 5;

export const GIT_LEVELS: GitLevel[] = [
  {
    id: 'git-1',
    number: 1,
    title: 'Введение в коммиты Git',
    category: 'Основы',
    difficulty: 'easy',
    xp: 30,
    description: 'Коммит в Git сохраняет снимок всех файлов вашего репозитория. Сделайте 2 коммита.',
    dialogue: {
      title: 'Что такое коммит в Git?',
      paragraphs: [
        'Репозиторий Git — это направленный ациклический граф (DAG) снимков вашего кода.',
        'Каждый коммит содержит ссылку на своего родителя (предыдущий коммит) и уникальный идентификатор.',
        'Команда "git commit" создает новый узел в графе и автоматически передвигает текущую активную ветку вперед.'
      ],
      exampleCommands: ['git commit', 'git commit -m "My update"']
    },
    hint: 'Выполните команду "git commit" два раза подряд.',
    initialState: level1Initial,
    goalState: level1Goal,
    solutionHint: ['git commit', 'git commit']
  },
  {
    id: 'git-2',
    number: 2,
    title: 'Ветвление в Git (Branching)',
    category: 'Ветвление',
    difficulty: 'easy',
    xp: 35,
    description: 'Ветки в Git невероятно легковесны — это просто указатели на конкретные коммиты. Создайте ветку "bugFix" и переключитесь на неё.',
    dialogue: {
      title: 'Легковесные ветки',
      paragraphs: [
        'В отличие от других систем контроля версий, ветка в Git не копирует файлы — это просто ярлык, указывающий на коммит.',
        'Создание ветки выполняется командой "git branch <имя>", а переключение — "git checkout <имя>" (или современный "git switch <имя>").',
        'Чтобы создать ветку и сразу перейти на неё одной командой, используйте: "git checkout -b <имя>" (или "git switch -c <имя>").'
      ],
      exampleCommands: ['git branch bugFix', 'git checkout bugFix', 'git checkout -b bugFix']
    },
    hint: 'Создайте ветку bugFix и сделайте её активной с помощью checkout.',
    initialState: level2Initial,
    goalState: level2Goal,
    solutionHint: ['git checkout -b bugFix']
  },
  {
    id: 'git-3',
    number: 3,
    title: 'Слияние веток (git merge)',
    category: 'Ветвление',
    difficulty: 'medium',
    xp: 45,
    description: 'Слияние объединяет историю двух независимых веток, создавая специальный коммит с двумя родителями.',
    dialogue: {
      title: 'Как работает git merge?',
      paragraphs: [
        'Когда мы заканчиваем работу в отдельной ветке (например, bugFix), нам нужно вернуть изменения в основную ветку main.',
        'Команда "git merge bugFix", вызванная из ветки main, берет изменения из bugFix и создает коммит слияния, объединяющий обе ветки.'
      ],
      exampleCommands: ['git checkout -b bugFix', 'git commit', 'git checkout main', 'git commit', 'git merge bugFix']
    },
    hint: 'Создайте ветку bugFix, сделайте в ней коммит, вернитесь в main, сделайте коммит и слейте: git merge bugFix.',
    initialState: level3Initial,
    goalState: level3Goal,
    solutionHint: [
      'git checkout -b bugFix',
      'git commit',
      'git checkout main',
      'git commit',
      'git merge bugFix'
    ]
  },
  {
    id: 'git-4',
    number: 4,
    title: 'Перебазирование (git rebase)',
    category: 'Ветвление',
    difficulty: 'medium',
    xp: 50,
    description: 'Rebase переносит набор коммитов одной ветки поверх другой, делая историю абсолютно линейной.',
    dialogue: {
      title: 'Чистая линейная история с Rebase',
      paragraphs: [
        'Второй способ объединения веток — это git rebase. Он берет коммиты вашей текущей ветки и «воспроизводит» их поверх целевой ветки.',
        'Преимущество rebase — кристально чистая, последовательная история без лишних merge-коммитов.'
      ],
      exampleCommands: ['git rebase main']
    },
    hint: 'Находясь в ветке bugFix, выполните "git rebase main", чтобы перенести коммиты поверх main.',
    initialState: level4Initial,
    goalState: level4Goal,
    solutionHint: ['git rebase main']
  },
  {
    id: 'git-5',
    number: 5,
    title: 'Отсоединенный HEAD (Detached HEAD)',
    category: 'Продвинутый',
    difficulty: 'easy',
    xp: 35,
    description: 'Обычно HEAD указывает на ветку. Но вы можете направить HEAD прямо на коммит!',
    dialogue: {
      title: 'Что такое указатель HEAD?',
      paragraphs: [
        'HEAD — это символическое имя текущего активного состояния репозитория. Обычно HEAD прикреплен к имени ветки (HEAD -> main).',
        'Если вы сделаете "git checkout <хэш_коммита>", HEAD отсоединится от ветки и укажет напрямую на коммит.'
      ],
      exampleCommands: ['git checkout C1']
    },
    hint: 'Выполните команду "git checkout C1", чтобы отсоединить HEAD от ветки main.',
    initialState: level5Initial,
    goalState: level5Goal,
    solutionHint: ['git checkout C1']
  },
  {
    id: 'git-6',
    number: 6,
    title: 'Относительные ссылки (HEAD^ и HEAD~)',
    category: 'Продвинутый',
    difficulty: 'medium',
    xp: 40,
    description: 'Относительные ссылки позволяют перемещаться по дереву коммитов без запоминания хэшей.',
    dialogue: {
      title: 'Символы ^ и ~',
      paragraphs: [
        'Символ ^ перемещает на одного предка назад: HEAD^ означает непосредственный родитель HEAD.',
        'Символ ~<число> позволяет прыгнуть на несколько коммитов назад: HEAD~2 перемещает на два шага назад по истории.'
      ],
      exampleCommands: ['git checkout HEAD^', 'git checkout HEAD~2']
    },
    hint: 'Переместите ветку bugFix на коммит C2 с помощью команды "git branch -f bugFix HEAD~1" или через checkout.',
    initialState: level6Initial,
    goalState: level6Goal,
    solutionHint: ['git checkout HEAD^', 'git branch -f bugFix HEAD']
  },
  {
    id: 'git-7',
    number: 7,
    title: 'Выборочный перенос (git cherry-pick)',
    category: 'Продвинутый',
    difficulty: 'hard',
    xp: 55,
    description: 'Скопируйте конкретный коммит из параллельной ветки в текущую с помощью cherry-pick.',
    dialogue: {
      title: 'Магия git cherry-pick',
      paragraphs: [
        'Если вам нужны не все коммиты из чужой ветки, а только один конкретный багфикс или фича, используйте "git cherry-pick <коммит>".',
        'Git скопирует этот коммит и применит его прямо к вершине вашей текущей ветки!'
      ],
      exampleCommands: ['git cherry-pick C3']
    },
    hint: 'Находясь в ветке main, скопируйте коммит C3: "git cherry-pick C3".',
    initialState: level7Initial,
    goalState: level7Goal,
    solutionHint: ['git cherry-pick C3']
  }
];
