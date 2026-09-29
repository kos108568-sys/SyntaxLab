import React, { useMemo } from 'react';
import type { GitState } from '../../services/gitEngine';

interface GitGraphVisualizerProps {
  state: GitState;
  isMini?: boolean;
  className?: string;
  title?: string;
}

interface NodeCoord {
  id: string;
  x: number;
  y: number;
  parentIds: string[];
}

const BRANCH_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  main: { bg: 'bg-indigo-600', text: 'text-indigo-200', border: 'border-indigo-400', glow: 'shadow-indigo-500/40' },
  master: { bg: 'bg-indigo-600', text: 'text-indigo-200', border: 'border-indigo-400', glow: 'shadow-indigo-500/40' },
  bugFix: { bg: 'bg-amber-600', text: 'text-amber-200', border: 'border-amber-400', glow: 'shadow-amber-500/40' },
  feature: { bg: 'bg-emerald-600', text: 'text-emerald-200', border: 'border-emerald-400', glow: 'shadow-emerald-500/40' },
  side: { bg: 'bg-cyan-600', text: 'text-cyan-200', border: 'border-cyan-400', glow: 'shadow-cyan-500/40' },
  local: { bg: 'bg-rose-600', text: 'text-rose-200', border: 'border-rose-400', glow: 'shadow-rose-500/40' },
  pushed: { bg: 'bg-purple-600', text: 'text-purple-200', border: 'border-purple-400', glow: 'shadow-purple-500/40' }
};

function getBranchColor(branchName: string) {
  return BRANCH_COLORS[branchName] || {
    bg: 'bg-violet-600',
    text: 'text-violet-200',
    border: 'border-violet-400',
    glow: 'shadow-violet-500/40'
  };
}

export const GitGraphVisualizer: React.FC<GitGraphVisualizerProps> = ({
  state,
  isMini = false,
  className = '',
  title
}) => {
  const { nodes, edges, branchPlacements, width, height } = useMemo(() => {
    const commits = state.commits;
    const commitKeys = Object.keys(commits);

    // 1. Calculate depth (distance from root) for each commit
    const depths: Record<string, number> = {};
    const lanes: Record<string, number> = {}; // 0 = main lane, 1 = upper lane, 2 = lower lane

    // BFS from root commits
    const rootIds = commitKeys.filter(k => commits[k].parentIds.length === 0);
    const queue = [...rootIds];
    for (const r of rootIds) {
      depths[r] = 0;
      lanes[r] = 0;
    }

    const visited = new Set<string>(rootIds);
    let nextLane = 1;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currDepth = depths[curr] || 0;
      const currLane = lanes[curr] || 0;

      // Find children
      const children = commitKeys.filter(k => commits[k].parentIds.includes(curr));
      children.sort();

      children.forEach((child, idx) => {
        const calculatedDepth = Math.max(depths[child] || 0, currDepth + 1);
        depths[child] = calculatedDepth;

        if (!visited.has(child)) {
          if (idx === 0) {
            lanes[child] = currLane; // Continue in the same lane
          } else {
            lanes[child] = nextLane++; // Branch off to a new lane
          }
          visited.add(child);
          queue.push(child);
        }
      });
    }

    // Set fallback depths for any unvisited
    for (const k of commitKeys) {
      if (depths[k] === undefined) {
        depths[k] = 1;
        lanes[k] = nextLane++;
      }
    }

    // Lane Y coordinates
    const laneHeight = isMini ? 48 : 80;
    const stepX = isMini ? 56 : 95;
    const startX = isMini ? 40 : 65;
    const startY = isMini ? 55 : 100;

    const nodeCoords: Record<string, NodeCoord> = {};
    let maxDepth = 0;
    let maxLane = 0;

    for (const k of commitKeys) {
      const d = depths[k];
      const l = lanes[k];
      if (d > maxDepth) maxDepth = d;
      if (l > maxLane) maxLane = l;

      nodeCoords[k] = {
        id: k,
        x: startX + d * stepX,
        y: startY + l * laneHeight,
        parentIds: commits[k].parentIds
      };
    }

    // 2. Build edges (connecting parent to child)
    const edgeList: { id: string; x1: number; y1: number; x2: number; y2: number }[] = [];
    for (const k of commitKeys) {
      const childCoord = nodeCoords[k];
      if (!childCoord) continue;

      for (const parentId of commits[k].parentIds) {
        const parentCoord = nodeCoords[parentId];
        if (parentCoord) {
          edgeList.push({
            id: `${parentId}->${k}`,
            x1: parentCoord.x,
            y1: parentCoord.y,
            x2: childCoord.x,
            y2: childCoord.y
          });
        }
      }
    }

    // 3. Map branches to commits
    const branchMap: Record<string, string[]> = {};
    for (const [branch, commitId] of Object.entries(state.branches)) {
      if (!branchMap[commitId]) branchMap[commitId] = [];
      branchMap[commitId].push(branch);
    }

    const calculatedWidth = Math.max(isMini ? 260 : 500, startX + (maxDepth + 1) * stepX + 60);
    const calculatedHeight = Math.max(isMini ? 120 : 220, startY + (maxLane + 1) * laneHeight + 60);

    return {
      nodes: Object.values(nodeCoords),
      edges: edgeList,
      branchPlacements: branchMap,
      width: calculatedWidth,
      height: calculatedHeight
    };
  }, [state, isMini]);

  const radius = isMini ? 12 : 18;

  return (
    <div className={`relative overflow-x-auto overflow-y-hidden select-none bg-slate-950/80 border border-slate-800 rounded-2xl ${className}`}>
      {title && (
        <div className="absolute top-2.5 left-3.5 z-10 flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
          <span>{title}</span>
        </div>
      )}

      <svg
        width={width}
        height={height}
        className="block min-w-full"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Edges / Branches lines */}
        {edges.map((edge) => {
          const isStraight = edge.y1 === edge.y2;
          const strokeColor = 'rgba(99, 102, 241, 0.7)';

          if (isStraight) {
            return (
              <line
                key={edge.id}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke={strokeColor}
                strokeWidth={isMini ? 2 : 3}
                strokeLinecap="round"
              />
            );
          }

          // Smooth cubic Bezier curve for branches and merges
          const dx = (edge.x2 - edge.x1) * 0.5;
          const pathD = `M ${edge.x1} ${edge.y1} C ${edge.x1 + dx} ${edge.y1}, ${edge.x2 - dx} ${edge.y2}, ${edge.x2} ${edge.y2}`;

          return (
            <path
              key={edge.id}
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isMini ? 2 : 3}
              strokeLinecap="round"
            />
          );
        })}

        {/* 2. Nodes / Commits */}
        {nodes.map((node) => {
          const isHeadDirect = state.head.type === 'commit' && state.head.name === node.id;
          const branchesOnNode = branchPlacements[node.id] || [];
          const isHeadOnBranch = branchesOnNode.some(
            b => state.head.type === 'branch' && state.head.name === b
          );

          const isHighlighted = isHeadDirect || isHeadOnBranch;

          return (
            <g key={node.id} className="transition-transform duration-300">
              {/* Pulsing ring for HEAD */}
              {isHighlighted && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius + 6}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  opacity="0.75"
                  className="animate-pulse"
                />
              )}

              {/* Commit Circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill={isHighlighted ? '#312e81' : '#0f172a'}
                stroke={isHighlighted ? '#818cf8' : '#475569'}
                strokeWidth={isMini ? 2 : 3}
                filter={isHighlighted ? 'url(#glow)' : undefined}
                className="cursor-pointer hover:stroke-indigo-400 transition-colors"
              />

              {/* Commit ID Text */}
              <text
                x={node.x}
                y={node.y + (isMini ? 3.5 : 5)}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize={isMini ? '9px' : '12px'}
                fontWeight="700"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                pointerEvents="none"
              >
                {node.id}
              </text>

              {/* 3. Branch labels and HEAD pointers positioned above node */}
              <g transform={`translate(${node.x}, ${node.y - radius - (isMini ? 10 : 16)})`}>
                {/* Pointer down to node */}
                {branchesOnNode.length > 0 && (
                  <path
                    d={`M 0 0 L 0 ${isMini ? 6 : 10}`}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                )}

                {/* Stacking branches */}
                {branchesOnNode.map((branch, bIdx) => {
                  const isCurrentHeadBranch = state.head.type === 'branch' && state.head.name === branch;
                  const colors = getBranchColor(branch);
                  const offsetY = -(bIdx * (isMini ? 16 : 24));

                  return (
                    <g key={branch} transform={`translate(0, ${offsetY})`}>
                      {/* Branch badge */}
                      <rect
                        x={isMini ? -24 : -34}
                        y={isMini ? -12 : -18}
                        width={isMini ? 48 : 68}
                        height={isMini ? 14 : 20}
                        rx={isMini ? 3 : 5}
                        className={`${colors.bg} ${colors.glow}`}
                        stroke="#ffffff"
                        strokeOpacity="0.25"
                        strokeWidth="1"
                      />
                      <text
                        x={0}
                        y={isMini ? -2 : -4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={isMini ? '8px' : '10px'}
                        fontWeight="700"
                        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                      >
                        {branch}
                        {isCurrentHeadBranch && ' *'}
                      </text>
                    </g>
                  );
                })}

                {/* Detached HEAD badge */}
                {isHeadDirect && (
                  <g transform={`translate(0, -${branchesOnNode.length * (isMini ? 16 : 24)})`}>
                    <rect
                      x={isMini ? -22 : -30}
                      y={isMini ? -12 : -18}
                      width={isMini ? 44 : 60}
                      height={isMini ? 14 : 20}
                      rx={isMini ? 3 : 5}
                      fill="#be185d"
                      stroke="#f472b6"
                      strokeWidth="1"
                    />
                    <text
                      x={0}
                      y={isMini ? -2 : -4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={isMini ? '8px' : '10px'}
                      fontWeight="700"
                      fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                    >
                      HEAD*
                    </text>
                  </g>
                )}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
