import React, { useState, useEffect, useRef } from 'react';
import type { Task, Lesson } from '../../types';
import { useApp } from '../../context/AppContext';
import { evaluateCsharpCode } from '../../services/csharpRunner';
import type { RunResult } from '../../services/csharpRunner';
import {
  Play,
  CheckCircle2,
  Lightbulb,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Terminal as TerminalIcon,
  BookOpen,
  Award,
  Flame,
  Check,
  X,
  ShieldAlert
} from 'lucide-react';

interface TaskPlayerModalProps {
  task: Task;
  lesson: Lesson;
  onClose: () => void;
  onNextTask?: () => void;
}

const normalizeCode = (raw?: string) => {
  if (!raw) return '';
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, '    ');
};

export const TaskPlayerModal: React.FC<TaskPlayerModalProps> = ({
  task,
  lesson,
  onClose,
  onNextTask
}) => {
  const { 
    completeTask, 
    reportTaskAttempt, 
    requestTeacherHelp, 
    completedTaskIds,
    studentsInClass,
    currentUser,
    recordStudentTelemetry
  } = useApp();

  const isAlreadyCompleted = completedTaskIds.includes(task.id);
  const currentStudentData = currentUser ? studentsInClass.find(s => s.id === currentUser.id) : null;

  const [code, setCode] = useState(() => normalizeCode(task.initialCode));
  const [selectedQuizOptionId, setSelectedQuizOptionId] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  const [showHintIndex, setShowHintIndex] = useState<number | null>(null);
  const [isAskingHelp, setIsAskingHelp] = useState(false);
  const [helpQuestionText, setHelpQuestionText] = useState('');
  const [helpSent, setHelpSent] = useState(false);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  const awayStartRef = useRef<number | null>(null);
  const isAwayRef = useRef(false);

  // Tab switch & window blur anti-cheat telemetry tracking
  useEffect(() => {
    const handleAway = () => {
      if (isAwayRef.current) return;
      isAwayRef.current = true;
      awayStartRef.current = Date.now();

      recordStudentTelemetry(
        {
          id: `tel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'tab_switch_away',
          timestamp: new Date().toISOString(),
          taskId: task.id,
          taskTitle: task.title,
          details: 'Свернул вкладку или переключился на другое окно / приложение'
        },
        {
          isCurrentlyAway: true,
          tabSwitchCount: (currentStudentData?.tabSwitchCount || 0) + 1,
          currentTaskId: task.id,
          currentTaskTitle: task.title
        }
      );
    };

    const handleBack = () => {
      if (!isAwayRef.current) return;
      isAwayRef.current = false;
      const durationSec = awayStartRef.current 
        ? Math.max(1, Math.round((Date.now() - awayStartRef.current) / 1000))
        : 1;
      awayStartRef.current = null;

      recordStudentTelemetry(
        {
          id: `tel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'tab_switch_back',
          timestamp: new Date().toISOString(),
          taskId: task.id,
          taskTitle: task.title,
          details: `Вернулся в окно задания (отсутствовал ${durationSec} сек)`,
          durationSeconds: durationSec
        },
        {
          isCurrentlyAway: false,
          totalAwaySeconds: (currentStudentData?.totalAwaySeconds || 0) + durationSec,
          currentTaskId: task.id,
          currentTaskTitle: task.title
        }
      );
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleAway();
      } else {
        handleBack();
      }
    };

    const onWindowBlur = () => {
      handleAway();
    };

    const onWindowFocus = () => {
      handleBack();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [task.id, task.title, currentStudentData?.tabSwitchCount, currentStudentData?.totalAwaySeconds, recordStudentTelemetry]);

  // Handle Clipboard Paste Anti-Cheat Event
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData?.getData('text') || '';
    if (pasted.length > 5) {
      setPasteNotice(`Вставка из буфера (${pasted.length} симв.) зафиксирована античитом`);
      setTimeout(() => setPasteNotice(null), 4000);

      recordStudentTelemetry(
        {
          id: `tel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'code_paste',
          timestamp: new Date().toISOString(),
          taskId: task.id,
          taskTitle: task.title,
          details: `Вставил ${pasted.length} символов кода из буфера обмена`,
          pastedChars: pasted.length
        },
        {
          pasteCount: (currentStudentData?.pasteCount || 0) + 1,
          pastedCharsTotal: (currentStudentData?.pastedCharsTotal || 0) + pasted.length,
          lastCodeSnippet: pasted.slice(0, 200),
          currentTaskId: task.id,
          currentTaskTitle: task.title
        }
      );
    }
  };

  // Tab key indent handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Run Code logic
  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      const result = evaluateCsharpCode(code, task);
      setRunResult(result);
      setIsRunning(false);
      reportTaskAttempt(task.id, result.success);

      if (result.success) {
        completeTask(task.id, task.xp);
        setShowSuccessCelebration(true);

        recordStudentTelemetry(
          {
            id: `tel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: 'task_completed',
            timestamp: new Date().toISOString(),
            taskId: task.id,
            taskTitle: task.title,
            details: 'Код успешно скомпилирован и прошел все юнит-тесты'
          },
          {
            completedTasksCount: (currentStudentData?.completedTasksCount || 0) + 1,
            totalAttemptsCount: (currentStudentData?.totalAttemptsCount || 0) + 1,
            lastCodeSnippet: code,
            lastErrorMessage: undefined,
            status: 'active'
          }
        );
      } else {
        const errorText = result.errorMessage || result.output || 'Ошибка компиляции C#';
        recordStudentTelemetry(
          {
            id: `tel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: 'code_error',
            timestamp: new Date().toISOString(),
            taskId: task.id,
            taskTitle: task.title,
            details: errorText,
            errorMessage: errorText
          },
          {
            totalErrorsCount: (currentStudentData?.totalErrorsCount || 0) + 1,
            totalAttemptsCount: (currentStudentData?.totalAttemptsCount || 0) + 1,
            lastCodeSnippet: code,
            lastErrorMessage: errorText,
            status: 'stuck'
          }
        );
      }
    }, 400);
  };

  // Submit Quiz logic
  const handleQuizAnswer = (optionId: string) => {
    if (quizSubmitted) return;
    setSelectedQuizOptionId(optionId);
    setQuizSubmitted(true);

    const option = task.quizOptions?.find(o => o.id === optionId);
    const isCorrect = Boolean(option?.isCorrect);
    reportTaskAttempt(task.id, isCorrect);

    if (isCorrect) {
      completeTask(task.id, task.xp);
      setShowSuccessCelebration(true);

      recordStudentTelemetry(
        {
          id: `tel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'task_completed',
          timestamp: new Date().toISOString(),
          taskId: task.id,
          taskTitle: task.title,
          details: 'Тестовый вопрос решен верно с 1-й попытки'
        },
        {
          completedTasksCount: (currentStudentData?.completedTasksCount || 0) + 1,
          totalAttemptsCount: (currentStudentData?.totalAttemptsCount || 0) + 1,
          status: 'active'
        }
      );
    } else {
      recordStudentTelemetry(
        {
          id: `tel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'quiz_error',
          timestamp: new Date().toISOString(),
          taskId: task.id,
          taskTitle: task.title,
          details: 'Неверный выбор в контрольном вопросе',
          errorMessage: 'Выбран неверный вариант ответа'
        },
        {
          totalErrorsCount: (currentStudentData?.totalErrorsCount || 0) + 1,
          totalAttemptsCount: (currentStudentData?.totalAttemptsCount || 0) + 1,
          status: 'stuck'
        }
      );
    }
  };

  // Ask Teacher for Help logic
  const handleSendHelpRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpQuestionText.trim()) return;
    requestTeacherHelp(helpQuestionText.trim());
    setHelpSent(true);
    setIsAskingHelp(false);
    setTimeout(() => setHelpSent(false), 5000);
  };

  const handleResetCode = () => {
    setCode(normalizeCode(task.initialCode));
    setRunResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl my-auto shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Player Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <TerminalIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-400 font-semibold">{lesson.title}</span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400">Шаг практики</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white">{task.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>+{task.xp} XP</span>
            </div>

            {isAlreadyCompleted && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                <Check className="w-3.5 h-3.5" />
                Пройдено
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Teacher hint banner if available */}
        {currentStudentData?.teacherComment && (
          <div className="bg-indigo-950/50 border-b border-indigo-500/30 px-4 py-2 flex items-center gap-2 text-xs text-indigo-200">
            <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Подсказка преподавателя:</strong> "{currentStudentData.teacherComment}"
            </span>
          </div>
        )}

        {/* Teacher help notification */}
        {helpSent && (
          <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2 text-xs text-amber-300">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Запрос отправлен на радар преподавателя! Он видит вашу текущую задачу и экран.
            </span>
          </div>
        )}

        {/* Content Body: Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Theory & Instructions (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-y-auto space-y-4 bg-slate-900/60">
            
            {/* Instructions */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Инструкция к заданию
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                {task.instructions}
              </p>
            </div>

            {/* Theory Snippet */}
            {task.theorySnippet && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Краткая справка по C#
                </h3>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 overflow-x-auto whitespace-pre">
                  {normalizeCode(task.theorySnippet)}
                </pre>
              </div>
            )}

            {/* Requirements / Test cases */}
            {task.tests && task.tests.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Критерии проверки:
                </h3>
                <div className="space-y-1.5">
                  {task.tests.map((t, idx) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 text-slate-300"
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono">
                        {idx + 1}
                      </span>
                      <span>{t.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hints Accordion */}
            {task.hints && task.hints.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Подсказки
                </h3>
                <div className="space-y-1.5">
                  {task.hints.map((hint, idx) => (
                    <div key={idx} className="border border-slate-800 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowHintIndex(showHintIndex === idx ? null : idx)}
                        className="w-full text-left p-2 bg-slate-950/50 hover:bg-slate-950 text-xs text-slate-300 flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                          <Lightbulb className="w-3.5 h-3.5" />
                          Подсказка #{idx + 1}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {showHintIndex === idx ? 'Скрыть' : 'Показать'}
                        </span>
                      </button>
                      {showHintIndex === idx && (
                        <div className="p-2.5 bg-slate-950 text-xs text-slate-300 border-t border-slate-800">
                          {hint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Code Editor or Quiz (7 cols) */}
          <div className="lg:col-span-7 flex flex-col overflow-hidden bg-slate-950">
            
            {/* Editor Toolbar */}
            {task.type !== 'quiz' && (
              <div className="p-2.5 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block"></span>
                  <span className="ml-2 text-slate-300 font-medium">Program.cs</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetCode}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Сбросить код</span>
                  </button>
                </div>
              </div>
            )}

            {/* Task Type: Code Challenge or Bug Hunt */}
            {task.type !== 'quiz' ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Code Textarea with Line Numbers */}
                <div className="flex-1 p-3 overflow-y-auto font-mono text-xs sm:text-sm flex flex-col bg-slate-950">
                  {pasteNotice && (
                    <div className="mb-2 py-1 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>{pasteNotice}</span>
                    </div>
                  )}
                  <div className="flex flex-1 gap-3">
                    <div className="select-none text-right text-slate-600 font-mono text-xs pt-0.5 leading-relaxed shrink-0 pr-2 border-r border-slate-800/80">
                      {code.split('\n').map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    <textarea
                      rows={12}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onPaste={handlePaste}
                      spellCheck={false}
                      className="flex-1 w-full h-full min-h-[220px] bg-transparent text-slate-100 font-mono resize-none focus:outline-none leading-relaxed selection:bg-indigo-600/30 whitespace-pre"
                    />
                  </div>
                </div>

                {/* Console Output Panel */}
                <div className="border-t border-slate-800 bg-slate-900/90 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <TerminalIcon className="w-3.5 h-3.5 text-slate-400" />
                      Терминал / Диагностика .NET
                    </span>
                    {runResult && (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        runResult.success
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {runResult.success ? 'Успешно' : 'Ошибка выполнения'}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800/80 font-mono text-xs max-h-28 overflow-y-auto">
                    {isRunning ? (
                      <p className="text-indigo-400 animate-pulse">Компиляция C# кода (dotnet run)...</p>
                    ) : runResult ? (
                      <div className="space-y-1">
                        <pre className={runResult.success ? 'text-emerald-300' : 'text-amber-300'}>
                          {runResult.output}
                        </pre>
                        {runResult.errorMessage && (
                          <p className="text-red-400 mt-1 font-sans">{runResult.errorMessage}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500">Нажмите "Запустить код", чтобы скомпилировать и проверить вывод программы.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Quiz Type */
              <div className="flex-1 p-6 flex flex-col justify-center space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Выберите правильный ответ:</h3>
                <div className="space-y-2.5">
                  {task.quizOptions?.map((option) => {
                    const isSelected = selectedQuizOptionId === option.id;
                    const showCorrect = quizSubmitted && option.isCorrect;
                    const showIncorrect = quizSubmitted && isSelected && !option.isCorrect;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={quizSubmitted}
                        onClick={() => handleQuizAnswer(option.id)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                          showCorrect
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                            : showIncorrect
                            ? 'bg-red-950/40 border-red-500 text-red-200'
                            : isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.text}</span>
                          {showCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {showIncorrect && <X className="w-4 h-4 text-red-400" />}
                        </div>
                        {quizSubmitted && option.explanation && (
                          <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80 font-normal">
                            {option.explanation}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Player Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          
          {/* Ask Teacher Button */}
          <div className="flex items-center gap-2">
            {!isAskingHelp ? (
              <button
                type="button"
                onClick={() => setIsAskingHelp(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs font-medium transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Поднять руку / Позвать преподавателя</span>
              </button>
            ) : (
              <form onSubmit={handleSendHelpRequest} className="flex items-center gap-2">
                <input
                  type="text"
                  value={helpQuestionText}
                  onChange={(e) => setHelpQuestionText(e.target.value)}
                  placeholder="В чем вопрос? (видит преподаватель)"
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
                />
                <button
                  type="submit"
                  disabled={!helpQuestionText.trim()}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-lg"
                >
                  Позвать
                </button>
                <button
                  type="button"
                  onClick={() => setIsAskingHelp(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Отмена
                </button>
              </form>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {task.type !== 'quiz' && (
              <button
                type="button"
                disabled={isRunning}
                onClick={handleRunCode}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Компиляция...' : 'Запустить код'}</span>
              </button>
            )}

            {onNextTask && (
              <button
                type="button"
                onClick={onNextTask}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all"
              >
                <span>Следующий шаг</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Success Modal Overlay */}
        {showSuccessCelebration && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Задание выполнено!</h3>
                <p className="text-xs text-slate-400 mt-1">Все тесты успешно пройдены, код скомпилирован.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-around text-xs">
                <div>
                  <span className="text-slate-400 block">Получено</span>
                  <span className="text-base font-bold text-amber-400 font-mono">+{task.xp} XP</span>
                </div>
                <div className="h-6 w-px bg-slate-800"></div>
                <div>
                  <span className="text-slate-400 block">Серия</span>
                  <span className="text-base font-bold text-orange-400 font-mono flex items-center gap-1 justify-center">
                    <Flame className="w-4 h-4 fill-orange-500" />
                    +{1} день
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessCelebration(false);
                  if (onNextTask) onNextTask();
                  else onClose();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all"
              >
                Продолжить путь
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
