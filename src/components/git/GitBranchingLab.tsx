import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { GIT_LEVELS, type GitLevel } from '../../data/gitLevelsData';
import { 
  createInitialGitState, 
  cloneGitState, 
  executeGitCommand, 
  isGitGoalReached, 
  type GitState 
} from '../../services/gitEngine';
import { GitGraphVisualizer } from './GitGraphVisualizer';
import { GitTerminal, type TerminalLogEntry } from './GitTerminal';
import { 
  GitBranch, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Eye, 
  Grid, 
  SlidersHorizontal,
  X,
  Play,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const GitBranchingLab: React.FC = () => {
  const { completeTask } = useApp();

  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [isSandbox, setIsSandbox] = useState<boolean>(false);
  const [gitState, setGitState] = useState<GitState>(() => cloneGitState(GIT_LEVELS[0].initialState));
  const [historyStack, setHistoryStack] = useState<GitState[]>([]);
  const [logs, setLogs] = useState<TerminalLogEntry[]>([]);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(true);
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(false);
  const [selectedSequenceFilter, setSelectedSequenceFilter] = useState<string>('all');
  const [levelCompleted, setLevelCompleted] = useState<boolean>(false);
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);

  const currentLevel: GitLevel = GIT_LEVELS[currentLevelIndex] || GIT_LEVELS[0];

  // Initialize level
  const startLevel = useCallback((lvlIndex: number) => {
    const lvl = GIT_LEVELS[lvlIndex];
    if (!lvl) return;

    setCurrentLevelIndex(lvlIndex);
    setIsSandbox(false);
    const initial = cloneGitState(lvl.initialState);
    setGitState(initial);
    setHistoryStack([]);
    setLevelCompleted(false);
    setShowTutorialModal(true);
    setShowGoalModal(false);

    setLogs([
      {
        id: 'init-1',
        output: `=== Уровень ${lvl.number}: ${lvl.title} ===\n${lvl.description}\nВведите "help" для справки или нажмите "Цель" для подсказки.`
      }
    ]);
  }, []);

  // Sandbox switch
  const startSandbox = () => {
    setIsSandbox(true);
    const clean = createInitialGitState();
    setGitState(clean);
    setHistoryStack([]);
    setLevelCompleted(false);
    setShowTutorialModal(false);
    setShowGoalModal(false);

    setLogs([
      {
        id: 'sandbox-1',
        output: `=== РЕЖИМ СВОБОДНОЙ ПЕСОЧНИЦЫ (SANDBOX) ===\nЗдесь нет ограничений и условий. Создавайте ветки, экспериментируйте с merge, rebase, cherry-pick и reset.\nДля сброса введите "reset", для отмены — "undo".`
      }
    ]);
  };

  // Check goal on state change
  useEffect(() => {
    if (isSandbox || levelCompleted) return;

    if (isGitGoalReached(gitState, currentLevel.goalState)) {
      setLevelCompleted(true);
      if (!completedLevels.includes(currentLevel.id)) {
        setCompletedLevels(prev => [...prev, currentLevel.id]);
        completeTask(currentLevel.id, currentLevel.xp);
      }
    }
  }, [gitState, currentLevel, isSandbox, levelCompleted, completedLevels, completeTask]);

  // Execute terminal command
  const handleExecuteCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    // Special commands
    if (trimmed.toLowerCase() === 'undo') {
      handleUndo();
      return;
    }

    if (trimmed.toLowerCase() === 'reset') {
      handleReset();
      return;
    }

    if (trimmed.toLowerCase() === 'clear') {
      setLogs([]);
      return;
    }

    if (trimmed.toLowerCase() === 'goal') {
      setShowGoalModal(prev => !prev);
      return;
    }

    if (trimmed.toLowerCase() === 'levels') {
      setShowLevelSelect(true);
      return;
    }

    // Save previous state to history stack for undo
    setHistoryStack(prev => [...prev, cloneGitState(gitState)]);

    // Execute via GitEngine
    const result = executeGitCommand(gitState, trimmed);
    setGitState(result.nextState);

    setLogs(prev => [
      ...prev,
      {
        id: `cmd-${Date.now()}-${Math.random()}`,
        command: trimmed,
        output: result.output,
        isError: result.isError
      }
    ]);
  };

  // Undo command
  const handleUndo = () => {
    if (historyStack.length === 0) {
      setLogs(prev => [
        ...prev,
        {
          id: `undo-${Date.now()}`,
          output: 'Нечего отменять (история команд пуста).',
          isError: true
        }
      ]);
      return;
    }

    const previousState = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    setGitState(previousState);
    setLevelCompleted(false);

    setLogs(prev => [
      ...prev,
      {
        id: `undo-${Date.now()}`,
        command: 'undo',
        output: 'Последнее действие отменено. Состояние репозитория возвращено на шаг назад.'
      }
    ]);
  };

  // Reset level to initial
  const handleReset = () => {
    if (isSandbox) {
      startSandbox();
      return;
    }
    const initial = cloneGitState(currentLevel.initialState);
    setGitState(initial);
    setHistoryStack([]);
    setLevelCompleted(false);

    setLogs(prev => [
      ...prev,
      {
        id: `reset-${Date.now()}`,
        command: 'reset',
        output: `Уровень "${currentLevel.title}" сброшен к исходному состоянию.`
      }
    ]);
  };

  const handleNextLevel = () => {
    if (currentLevelIndex < GIT_LEVELS.length - 1) {
      startLevel(currentLevelIndex + 1);
    } else {
      startSandbox();
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {!isSandbox && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
              <button
                type="button"
                disabled={currentLevelIndex <= 0}
                onClick={() => startLevel(currentLevelIndex - 1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
                title="Предыдущий уровень"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs px-2 font-bold text-indigo-400">
                {currentLevel.sequenceIndex}
              </span>
              <button
                type="button"
                disabled={currentLevelIndex >= GIT_LEVELS.length - 1}
                onClick={() => startLevel(currentLevelIndex + 1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
                title="Следующий уровень"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
                <GitBranch className="w-5 h-5 animate-pulse" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {isSandbox ? 'Git Песочница (Свободный режим)' : `${currentLevel.sequenceIndex}: ${currentLevel.title}`}
              </h1>
              {!isSandbox && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  +{currentLevel.xp} XP
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isSandbox 
                ? 'Свободная среда для экспериментов с ветками, слияниями и перебазированием.' 
                : `${currentLevel.sequenceTitle} — ${currentLevel.description}`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isSandbox && (
            <>
              <button
                type="button"
                onClick={() => setShowTutorialModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Теория</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGoalModal(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  showGoalModal 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>{showGoalModal ? 'Скрыть цель' : 'Показать цель'}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowLevelSelect(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Grid className="w-4 h-4" />
            <span>Уровни ({completedLevels.length}/{GIT_LEVELS.length})</span>
          </button>

          <button
            type="button"
            onClick={isSandbox ? () => startLevel(0) : startSandbox}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
              isSandbox
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>{isSandbox ? 'К уровням' : 'Песочница'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout: Visualizer on Top, Terminal on Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left/Main Column: Visual Tree & Goal */}
        <div className={`${showGoalModal && !isSandbox ? 'lg:col-span-7' : 'lg:col-span-7'} space-y-4`}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <span>Текущее дерево репозитория</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                Коммитов: {Object.keys(gitState.commits).length} | Веток: {Object.keys(gitState.branches).length}
              </span>
            </div>

            <GitGraphVisualizer
              state={gitState}
              className="h-[300px] w-full"
              title="Ваш репозиторий"
            />
          </div>

          {/* Collapsible / Side Goal View if opened */}
          {showGoalModal && !isSandbox && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-bold text-amber-300 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Целевое дерево (Чего нужно достичь):</span>
                </span>
                <span className="text-[11px] text-amber-400/80 font-mono">
                  Подсказка: {currentLevel.hint}
                </span>
              </div>

              <GitGraphVisualizer
                state={currentLevel.goalState}
                isMini={true}
                className="h-[180px] w-full border-amber-500/20"
                title="Цель уровня"
              />
            </div>
          )}
        </div>

        {/* Right Column: Linux-like Git Terminal */}
        <div className={`${showGoalModal && !isSandbox ? 'lg:col-span-5' : 'lg:col-span-5'} flex flex-col`}>
          <GitTerminal
            head={gitState.head}
            logs={logs}
            onExecuteCommand={handleExecuteCommand}
            onUndo={handleUndo}
            onReset={handleReset}
            onToggleGoal={() => setShowGoalModal(prev => !prev)}
          />
        </div>
      </div>

      {/* MODAL 1: Theory / Introduction Tutorial Modal (Learn Git Branching Style) */}
      {showTutorialModal && !isSandbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <GitBranch className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-wider">
                    {currentLevel.sequenceTitle} • Уровень {currentLevel.sequenceIndex}
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {currentLevel.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTutorialModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              {currentLevel.dialogue.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}

              {currentLevel.dialogue.exampleCommands && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 mt-3">
                  <span className="text-xs font-semibold text-slate-400 block">Примеры команд для этого шага:</span>
                  {currentLevel.dialogue.exampleCommands.map(cmd => (
                    <div key={cmd} className="font-mono text-xs text-indigo-300 flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">$</span>
                      <span>{cmd}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="text-xs text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Награда: +{currentLevel.xp} XP</span>
              </div>

              <button
                type="button"
                onClick={() => setShowTutorialModal(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Понятно, поехали!</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Level Victory Celebration */}
      {levelCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl shadow-emerald-500/10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Уровень пройден! 🎉</h2>
              <p className="text-xs text-slate-400 mt-1">
                Вы успешно воспроизвели целевое дерево Git и освоили механику уровня!
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-around text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Заработано</span>
                <span className="text-amber-400 font-bold text-sm">+{currentLevel.xp} XP</span>
              </div>
              <div className="border-l border-slate-800 h-8"></div>
              <div>
                <span className="text-slate-500 block">Команд</span>
                <span className="text-indigo-400 font-bold text-sm">{historyStack.length}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setLevelCompleted(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Посмотреть дерево
              </button>

              <button
                type="button"
                onClick={handleNextLevel}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Следующий уровень</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Level Selector Menu */}
      {showLevelSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Grid className="w-5 h-5 text-indigo-400" />
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Каталог уровней Git Branching</h2>
                  <p className="text-[11px] text-slate-400">23 интерактивных упражнения из оригинального Learn Git Branching</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLevelSelect(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sequence Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { id: 'all', label: 'Все (23)' },
                { id: 'intro', label: '1. Введение' },
                { id: 'rampup', label: '2. Обороты' },
                { id: 'move', label: '3. Перемещение' },
                { id: 'mixed', label: '4. Солянка' },
                { id: 'advanced', label: '5. Продвинутые' },
                { id: 'remote', label: '6. Удаленные' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedSequenceFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all text-xs cursor-pointer ${
                    selectedSequenceFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Level Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {GIT_LEVELS
                .filter(lvl => selectedSequenceFilter === 'all' || lvl.sequenceId === selectedSequenceFilter)
                .map((lvl) => {
                  const originalIdx = GIT_LEVELS.findIndex(l => l.id === lvl.id);
                  const isCurrent = !isSandbox && currentLevelIndex === originalIdx;
                  const isDone = completedLevels.includes(lvl.id);

                  return (
                    <div
                      key={lvl.id}
                      onClick={() => { startLevel(originalIdx); setShowLevelSelect(false); }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-indigo-600/10 border-indigo-500/40 text-white shadow-sm'
                          : isDone
                          ? 'bg-slate-950/60 border-emerald-500/30 hover:border-emerald-500/50'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                          isDone 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : isCurrent 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isDone ? '✓' : lvl.sequenceIndex}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-200">{lvl.title}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50">
                              {lvl.sequenceTitle}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              lvl.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-950/40' :
                              lvl.difficulty === 'medium' ? 'text-amber-400 bg-amber-950/40' :
                              'text-red-400 bg-red-950/40'
                            }`}>
                              {lvl.difficulty}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{lvl.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-amber-400 font-semibold">+{lvl.xp} XP</span>
                        <Play className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
                      </div>
                    </div>
                  );
                })}

              {/* Sandbox card */}
              <div
                onClick={() => { startSandbox(); setShowLevelSelect(false); }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSandbox
                    ? 'bg-emerald-600/10 border-emerald-500/40 text-white'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Свободная Песочница (Sandbox)</h4>
                    <p className="text-[11px] text-slate-400">Без заданий и ограничений — свободная отработка любых git команд</p>
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
