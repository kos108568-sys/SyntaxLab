import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const project = `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net8.0</TargetFramework><LangVersion>12</LangVersion><ImplicitUsings>disable</ImplicitUsings><Nullable>disable</Nullable><UseAppHost>false</UseAppHost></PropertyGroup></Project>`;

export async function runCsharp(code) {
  if (process.env.JDOODLE_CLIENT_ID && process.env.JDOODLE_CLIENT_SECRET) {
    return runCsharpWithJdoodle(code);
  }
  const directory = await mkdtemp(join(tmpdir(), 'syntaxlab-'));
  const name = `syntaxlab-${randomUUID()}`;
  try {
    await writeFile(join(directory, 'Program.cs'), code);
    await writeFile(join(directory, 'Submission.csproj'), project);
    await chmod(directory, 0o755);
    await chmod(join(directory, 'Program.cs'), 0o644);
    await chmod(join(directory, 'Submission.csproj'), 0o644);
    return await new Promise((resolve, reject) => {
      const args = ['run', '--rm', '--name', name, '--network', 'none', '--read-only',
        '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--pids-limit', '128',
        '--memory', '512m', '--memory-swap', '512m', '--cpus', '1', '--user', '65534:65534',
        '--tmpfs', '/tmp:rw,noexec,nosuid,size=64m', '--tmpfs', '/work:rw,exec,nosuid,size=128m',
        '--mount', `type=bind,source=${directory},target=/submission,readonly`,
        '-e', 'DOTNET_CLI_HOME=/tmp', '-e', 'DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1',
        '-e', 'DOTNET_CLI_TELEMETRY_OPTOUT=1', '-e', 'DOTNET_NOLOGO=1',
        '-e', 'LANG=C.UTF-8', '-w', '/work', process.env.CSHARP_IMAGE || 'mcr.microsoft.com/dotnet/sdk:8.0',
        'sh', '-c', 'cp /submission/* /work/; dotnet build Submission.csproj --nologo -v:q -o /work/out -p:UseSharedCompilation=false >&2 && dotnet /work/out/Submission.dll'];
      const child = spawn('docker', args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '', error = '', stopped = false;
      const stop = () => {
        stopped = true;
        // Killing the CLI alone does not stop its container.
        const cleanup = spawn('docker', ['rm', '-f', name], { windowsHide: true, stdio: 'ignore' });
        cleanup.on('error', () => {});
        child.kill();
      };
      const timeout = setTimeout(stop, 20000);
      child.stdout.on('data', chunk => { output += chunk; if (Buffer.byteLength(output) > 65536) stop(); });
      child.stderr.on('data', chunk => { error += chunk; if (Buffer.byteLength(error) > 65536) stop(); });
      child.on('error', err => { clearTimeout(timeout); reject(new Error(`Сервис выполнения недоступен: ${err.message}`)); });
      child.on('close', exitCode => {
        clearTimeout(timeout);
        resolve({ exitCode: stopped ? -1 : exitCode, output: output.slice(0, 65536),
          error: stopped ? 'Превышен лимит времени или вывода.' : exitCode === 0 ? '' : error.slice(0, 65536) });
      });
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function runCsharpWithJdoodle(code) {
  const response = await fetch('https://api.jdoodle.com/v1/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: code,
      language: 'csharp',
      versionIndex: '6'
    }),
    signal: AbortSignal.timeout(30_000)
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result || result.statusCode !== 200) {
    return {
      exitCode: 1,
      output: result?.output || '',
      error: result?.error || 'JDoodle could not execute the program.'
    };
  }

  const output = result.output || '';
  const buildLogEnd = /Time Elapsed[^\r\n]*\r?\n?/m.exec(output);
  return {
    exitCode: 0,
    output: buildLogEnd ? output.slice(buildLogEnd.index + buildLogEnd[0].length) : output,
    error: ''
  };
}
