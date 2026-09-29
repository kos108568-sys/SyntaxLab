import React, { useState, useRef, useEffect } from 'react';
import type { GitHead } from '../../services/gitEngine';
import { Terminal as TerminalIcon, CornerDownLeft, Undo2, RotateCcw, HelpCircle, Eye, Sparkles } from 'lucide-react';

export interface TerminalLogEntry {
  id: string;
  command?: string;
  output: string;
  isError?: boolean;
  branchName?: string;
}

interface GitTerminalProps {
  head: GitHead;
  logs: TerminalLogEntry[];
  onExecuteCommand: (command: string) => void;
  onUndo: () => void;
  onReset: () => void;
  onToggleGoal: () => void;
  disabled?: boolean;
}

export const GitTerminal: React.FC<GitTerminalProps> = ({
  head,
  logs,
  onExecuteCommand,
  onUndo,
  onReset,
  onToggleGoal,
  disabled = false
}) => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  const endOfLogsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when logs update
  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Keep focus on terminal input
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;

      setCommandHistory(prev => [...prev, trimmed]);
      setHistoryIndex(-1);
      setInput('');
      onExecuteCommand(trimmed);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInput(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIdx);
        setInput(commandHistory[nextIdx]);
      }
    }
  };

  const promptBranch = head.type === 'branch' ? head.name : `HEAD (${head.name})`;

  return (
    <div
      onClick={handleTerminalClick}
      className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col font-mono text-xs shadow-2xl overflow-hidden cursor-text h-full min-h-[300px]"
    >
      {/* Terminal Title Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
          </div>
          <TerminalIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-300">git-bash: ~/repo</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            ({promptBranch})
          </span>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleGoal(); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px]"
            title="Показать / скрыть цель уровня"
          >
            <Eye className="w-3 h-3 text-indigo-400" />
            <span>Цель</span>
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUndo(); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px]"
            title="Отменить последнюю команду"
          >
            <Undo2 className="w-3 h-3 text-amber-400" />
            <span>Undo</span>
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onReset(); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px]"
            title="Сбросить уровень к началу"
          >
            <RotateCcw className="w-3 h-3 text-rose-400" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onExecuteCommand('help'); }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Справка по командам"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Log Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono leading-relaxed">
        {logs.map((log) => (
          <div key={log.id} className="space-y-1">
            {log.command && (
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-400 font-bold">$</span>
                <span className="text-slate-100 font-bold">{log.command}</span>
              </div>
            )}
            <div
              className={`whitespace-pre-wrap pl-3 border-l-2 ${
                log.isError
                  ? 'border-rose-500/60 text-rose-300'
                  : 'border-indigo-500/40 text-slate-300'
              }`}
            >
              {log.output}
            </div>
          </div>
        ))}
        <div ref={endOfLogsRef} />
      </div>

      {/* Interactive Command Prompt */}
      <div className="bg-slate-900/60 border-t border-slate-800/80 px-4 py-3 flex items-center gap-2">
        <span className="text-emerald-400 font-bold select-none text-sm">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Введите команду (например: git commit, git checkout -b bugFix, help)..."
          className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-600 font-mono text-xs focus:ring-0"
          autoFocus
        />
        <button
          type="button"
          onClick={() => {
            if (input.trim()) {
              setCommandHistory(prev => [...prev, input.trim()]);
              setHistoryIndex(-1);
              onExecuteCommand(input.trim());
              setInput('');
            }
          }}
          disabled={!input.trim() || disabled}
          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
        >
          <CornerDownLeft className="w-3 h-3" />
          <span>Enter</span>
        </button>
      </div>

      {/* Suggested Quick-Pills for Beginners */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-900 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 select-none">
        <span className="flex items-center gap-1 text-slate-400 font-semibold mr-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Быстрый ввод:
        </span>
        {[
          'git commit',
          'git checkout -b bugFix',
          'git checkout main',
          'git merge bugFix',
          'git rebase main',
          'git checkout HEAD^'
        ].map(cmd => (
          <button
            key={cmd}
            type="button"
            onClick={(e) => { e.stopPropagation(); setInput(cmd); inputRef.current?.focus(); }}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800/80 transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
};
