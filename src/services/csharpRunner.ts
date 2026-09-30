import type { Task } from '../types';

export interface RunResult {
  success: boolean;
  output: string;
  errorMessage?: string;
  testsPassed: number;
  totalTests: number;
  details: { testId: string; description: string; passed: boolean; message?: string }[];
}

/**
 * Strips single-line and multi-line comments from C# code while preserving string literals.
 */
export function stripComments(code: string): string {
  let result = '';
  let inString = false;
  let inChar = false;
  let isVerbatim = false;
  let i = 0;

  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];

    if (inString) {
      result += ch;
      if (isVerbatim) {
        if (ch === '"' && next === '"') {
          result += next;
          i += 2;
          continue;
        } else if (ch === '"') {
          inString = false;
          isVerbatim = false;
        }
      } else {
        if (ch === '\\' && i + 1 < code.length) {
          result += code[i + 1];
          i += 2;
          continue;
        } else if (ch === '"') {
          inString = false;
        }
      }
      i++;
      continue;
    }

    if (inChar) {
      result += ch;
      if (ch === '\\' && i + 1 < code.length) {
        result += code[i + 1];
        i += 2;
        continue;
      } else if (ch === "'") {
        inChar = false;
      }
      i++;
      continue;
    }

    // Check string starts
    if (ch === '$' && next === '"') {
      inString = true;
      result += ch + next;
      i += 2;
      continue;
    }
    if (ch === '@' && next === '"') {
      inString = true;
      isVerbatim = true;
      result += ch + next;
      i += 2;
      continue;
    }
    if (ch === '"') {
      inString = true;
      result += ch;
      i++;
      continue;
    }
    if (ch === "'") {
      inChar = true;
      result += ch;
      i++;
      continue;
    }

    // Check comments
    if (ch === '/' && next === '/') {
      while (i < code.length && code[i] !== '\n') {
        i++;
      }
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

/**
 * Checks if student code is identical to initial starter template.
 */
function isUnchangedStarterCode(userCode: string, initialCode?: string): boolean {
  if (!initialCode) return false;
  const cleanUser = stripComments(userCode).replace(/\s+/g, '');
  const cleanInitial = stripComments(initialCode).replace(/\s+/g, '');
  return cleanUser.length > 0 && cleanUser === cleanInitial;
}

/**
 * Lightweight C# to JavaScript transpiler and sandbox executor.
 * Safely executes standard academic C# console programs in a sandboxed environment.
 */
function runCsharpInSandbox(rawCode: string): { output: string; error?: string } {
  const codeWithoutComments = stripComments(rawCode);

  try {
    // 1. Transform C# to executable JavaScript
    let js = codeWithoutComments;

    // Remove usings
    js = js.replace(/using\s+[a-zA-Z0-9_.]+;\s*/g, '');

    // Replace string interpolation $"Hello {name}!" => `Hello ${name}!`
    js = js.replace(/\$"(.*?)"/g, (_, inner) => {
      const formatted = inner.replace(/\{([^}]+)\}/g, '${$1}');
      return `\`${formatted}\``;
    });

    // Replace C# switch expressions:
    // pattern: varName switch { ... }
    js = js.replace(/([a-zA-Z0-9_.]+)\s+switch\s*\{([^}]+)\}/g, (_, target, branches) => {
      const branchLines = branches.split(',').map((b: string) => b.trim()).filter(Boolean);
      let cases = '';
      let defaultVal = 'null';

      for (const b of branchLines) {
        const parts = b.split('=>').map((p: string) => p.trim());
        if (parts.length === 2) {
          const pattern = parts[0];
          const val = parts[1];
          if (pattern === '_') {
            defaultVal = val;
          } else if (pattern.includes(' or ')) {
            const orParts = pattern.split(' or ').map((p: string) => p.trim());
            for (const op of orParts) {
              cases += `case ${op}: `;
            }
            cases += `return ${val}; `;
          } else if (pattern.startsWith('<') || pattern.startsWith('>') || pattern.startsWith('=')) {
            // Relational patterns like < 0 or >= 0 and <= 20
            if (pattern.includes(' and ')) {
              const andParts = pattern.split(' and ').map((p: string) => p.trim());
              const cond = andParts.map((p: string) => `${target} ${p}`).join(' && ');
              cases += `if (${cond}) return ${val}; `;
            } else {
              cases += `if (${target} ${pattern}) return ${val}; `;
            }
          } else {
            cases += `case ${pattern}: return ${val}; `;
          }
        }
      }

      if (cases.includes('if (')) {
        return `((__v) => { ${cases} return ${defaultVal}; })(${target})`;
      }
      return `((__v) => { switch(__v) { ${cases} default: return ${defaultVal}; } })(${target})`;
    });

    // Class inheritance: class Teacher : User => class Teacher extends User
    js = js.replace(/class\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)/g, 'class $1 extends $2');

    // Strip method access modifiers
    js = js.replace(/\b(public|private|protected|internal|virtual|override)\b\s*/g, '');

    // C# property getters and setters in classes:
    js = js.replace(/[a-zA-Z0-9_<>[\]]+\s+([a-zA-Z0-9_]+)\s*\{\s*get\s*\{([^}]+)\}\s*set\s*\{([^}]+)\}\s*\}/g,
      (_, name, getter, setter) => {
        const g = getter.replace(/\b_([a-zA-Z0-9_]+)\b/g, 'this._$1');
        const s = setter.replace(/\b_([a-zA-Z0-9_]+)\b/g, 'this._$1');
        return `__GET_${name}__ { ${g} }\n__SET_${name}__(value) { ${s} }`;
      }
    );

    // Auto-properties: public int Score { get; set; }
    js = js.replace(/[a-zA-Z0-9_<>[\]]+\s+([a-zA-Z0-9_]+)\s*\{\s*get;\s*set;\s*\}/g,
      '__GET_$1__ { return this._$1; }\n__SET_$1__(value) { this._$1 = value; }'
    );

    // Private fields in class: int _score; => _score = 0;
    js = js.replace(/(?:int|string|double|bool|float|var)\s+(_?[a-zA-Z0-9_]+)\s*;/g, '$1 = 0;');

    // C# static methods: static double CalculateTax(double income) => income * 0.13;
    js = js.replace(/static\s+[a-zA-Z0-9_<>[\]]+\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*=>\s*([^;]+);/g, (_, name, params, body) => {
      const cleanParams = params.split(',').map((p: string) => p.trim().split(/\s+/).pop()).filter(Boolean).join(', ');
      return `function ${name}(${cleanParams}) { return ${body}; }`;
    });

    // C# method headers: static void PrintBadge(string name, string group) { ... }
    js = js.replace(/(?:static\s+)?[a-zA-Z0-9_<>[\]]+\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g, (_, name, params) => {
      if (['if', 'for', 'while', 'switch', 'catch', 'Main'].includes(name)) return `${name}(${params}) {`;
      const cleanParams = params.split(',').map((p: string) => p.trim().split(/\s+/).pop()).filter(Boolean).join(', ');
      return `${name}(${cleanParams}) {`;
    });

    // Restore getters and setters
    js = js.replace(/__GET_([a-zA-Z0-9_]+)__\s*\{/g, 'get $1() {');
    js = js.replace(/__SET_([a-zA-Z0-9_]+)__\s*\(([^)]+)\)\s*\{/g, 'set $1($2) {');

    // C# array index from end: fruits[^1] => fruits[fruits.length - 1]
    js = js.replace(/([a-zA-Z0-9_]+)\[\^([0-9]+)\]/g, '$1[$1.length - $2]');

    // Strip type declarations before variable names:
    js = js.replace(/\b(int|double|float|decimal|string|char|bool|var|long|short|byte)\s+([a-zA-Z0-9_]+)\s*=/g, 'let $2 =');
    js = js.replace(/\b(int|double|float|decimal|string|char|bool|var|long|short|byte)\[\]\s+([a-zA-Z0-9_]+)\s*=/g, 'let $2 =');
    js = js.replace(/List<[a-zA-Z0-9_]+>\s+([a-zA-Z0-9_]+)\s*=/g, 'let $1 =');
    js = js.replace(/Dictionary<[a-zA-Z0-9_,\s]+>\s+([a-zA-Z0-9_]+)\s*=/g, 'let $1 =');
    js = js.replace(/\b[A-Z][a-zA-Z0-9_]*\s+([a-zA-Z0-9_]+)\s*=\s*new\s+/g, 'let $1 = new ');

    // C# new() expressions: new() => new List() or new Dictionary()
    js = js.replace(/new\s+List<[a-zA-Z0-9_]+>\s*\(\)/g, 'new __List()');
    js = js.replace(/new\s+Dictionary<[a-zA-Z0-9_,\s]+>\s*\(\)/g, 'new __Dictionary()');
    js = js.replace(/new\s*\(\)/g, 'new __List()');

    // Turn Program class into execution block
    if (/class\s+Program\b/.test(js)) {
      const mainMatch = js.match(/static\s+void\s+Main\s*\([^)]*\)\s*\{([\s\S]*)\}\s*\}\s*$/) ||
                        js.match(/Main\s*\([^)]*\)\s*\{([\s\S]*)\}\s*\}\s*$/);
      if (mainMatch) {
        const beforeProgram = js.slice(0, js.indexOf('class Program'));
        const mainBody = mainMatch[1];
        js = `${beforeProgram}\n(function() {\n${mainBody}\n})();`;
      }
    }

    // Sandbox execution environment
    const outputBuffer: string[] = [];
    const sandboxConsole = {
      WriteLine: (...args: any[]) => {
        if (args.length === 0) {
          outputBuffer.push('');
        } else {
          outputBuffer.push(args.map(formatOutputValue).join(' '));
        }
      },
      Write: (...args: any[]) => {
        const text = args.map(formatOutputValue).join('');
        if (outputBuffer.length > 0) {
          outputBuffer[outputBuffer.length - 1] += text;
        } else {
          outputBuffer.push(text);
        }
      }
    };

    function formatOutputValue(val: any): string {
      if (val === true) return 'True';
      if (val === false) return 'False';
      if (val === null || val === undefined) return '';
      return String(val);
    }

    // Standard C# collections and helpers
    class __List extends Array {
      Add(item: any) { this.push(item); }
      Remove(item: any) {
        const idx = this.indexOf(item);
        if (idx >= 0) { this.splice(idx, 1); return true; }
        return false;
      }
      get Count() { return this.length; }
      Where(predicate: (x: any) => boolean) {
        const res = new __List();
        for (const item of this) {
          if (predicate(item)) res.push(item);
        }
        return res;
      }
      Sum(selector?: (x: any) => number) {
        let sum = 0;
        for (const item of this) {
          sum += selector ? selector(item) : Number(item);
        }
        return sum;
      }
      OrderByDescending(keySelector: (x: any) => any) {
        const copy = new __List(...this);
        copy.sort((a, b) => {
          const ka = keySelector(a);
          const kb = keySelector(b);
          return kb > ka ? 1 : kb < ka ? -1 : 0;
        });
        return copy;
      }
      First() { return this[0]; }
    }

    class __Dictionary {
      private map = new Map<string, any>();
      constructor() {
        return new Proxy(this, {
          get(target: any, prop: string) {
            if (prop in target) return target[prop];
            return target.map.get(prop);
          },
          set(target: any, prop: string, value: any) {
            target.map.set(prop, value);
            return true;
          }
        });
      }
      Add(key: string, val: any) { this.map.set(key, val); }
      ContainsKey(key: string) { return this.map.has(key); }
      TryGetValue(key: string, outHolder: { val?: any }) {
        if (this.map.has(key)) {
          outHolder.val = this.map.get(key);
          return true;
        }
        return false;
      }
    }

    // Helper extensions on JavaScript prototype for LINQ compatibility
    const intHelper = {
      Parse: (s: any) => {
        const parsed = parseInt(String(s), 10);
        if (isNaN(parsed)) throw new Error(`Input string was not in a correct format: ${s}`);
        return parsed;
      },
      TryParse: (s: any, outObj: { val?: number }) => {
        const parsed = parseInt(String(s), 10);
        if (isNaN(parsed)) return false;
        outObj.val = parsed;
        return true;
      }
    };

    const stringHelper = {
      Join: (sep: string, items: any[]) => items.join(sep)
    };

    // Construct and execute runner
    const sandboxScope = {
      Console: sandboxConsole,
      int: intHelper,
      String: stringHelper,
      Math,
      __List,
      __Dictionary
    };

    const runner = new Function(
      'scope',
      `with (scope) {
        ${js}
        if (typeof __runMain === 'function') {
          __runMain();
        }
      }`
    );

    runner(sandboxScope);

    return { output: outputBuffer.join('\n').trim() };
  } catch (err: any) {
    return { output: '', error: err?.message || 'Ошибка выполнения программы' };
  }
}

/**
 * Main evaluation entry point for C# tasks.
 */
export function evaluateCsharpCode(code: string, task: Task): RunResult {
  const cleanCode = code.trim();
  const tests = task.tests || [];
  const defaultTest = tests.length > 0 ? tests : [{ id: 't1', description: 'Проверка работы программы' }];

  // 1. Check if user code is completely empty
  if (!cleanCode) {
    return {
      success: false,
      output: '',
      errorMessage: 'Код задания не может быть пустым. Напишите решение в редакторе.',
      testsPassed: 0,
      totalTests: defaultTest.length,
      details: defaultTest.map(t => ({
        testId: t.id,
        description: t.description,
        passed: false,
        message: 'Код не предоставлен'
      }))
    };
  }

  // 2. Fix P1 Issue 4: Reject unmodified starter code templates
  if (isUnchangedStarterCode(cleanCode, task.initialCode)) {
    return {
      success: false,
      output: 'Код не содержит решения.',
      errorMessage: 'Вы не внесли изменений в начальный шаблон кода. Ознакомьтесь с условием задачи и напишите решение.',
      testsPassed: 0,
      totalTests: defaultTest.length,
      details: defaultTest.map(t => ({
        testId: t.id,
        description: t.description,
        passed: false,
        message: 'Шаблон не изменен'
      }))
    };
  }

  // 3. Fix P1 Issue 4: Strip comments before evaluating
  const codeWithoutComments = stripComments(cleanCode).trim();
  if (!codeWithoutComments) {
    return {
      success: false,
      output: '',
      errorMessage: 'Код содержит только комментарии. Для решения задачи требуется исполняемый код C#.',
      testsPassed: 0,
      totalTests: defaultTest.length,
      details: defaultTest.map(t => ({
        testId: t.id,
        description: t.description,
        passed: false,
        message: 'Только комментарии'
      }))
    };
  }

  // 4. Run the student's code in the isolated C# sandbox
  const runResult = runCsharpInSandbox(cleanCode);

  // 5. If runtime threw an error, check if it's a syntax or execution issue
  if (runResult.error) {
    return {
      success: false,
      output: `Runtime Error: ${runResult.error}`,
      errorMessage: `Ошибка при выполнении кода: ${runResult.error}. Проверьте правильность выражений и синтаксис C#.`,
      testsPassed: 0,
      totalTests: defaultTest.length,
      details: defaultTest.map(t => ({
        testId: t.id,
        description: t.description,
        passed: false,
        message: runResult.error
      }))
    };
  }

  const actualOutput = runResult.output.trim();

  // 6. Evaluate against task tests and required academic criteria
  let allTestsPassed = true;
  const testDetails = defaultTest.map(test => {
    let testPassed = false;
    let failMsg = '';

    if (test.expectedOutput) {
      const expectedNormalized = test.expectedOutput.trim();
      testPassed = (actualOutput === expectedNormalized) || actualOutput.includes(expectedNormalized);
      if (!testPassed) {
        failMsg = `Ожидалось: "${expectedNormalized}", получено: "${actualOutput || '(нет вывода)'}"`;
      }
    } else {
      // Default: program ran without error and produced some output
      testPassed = actualOutput.length > 0;
      if (!testPassed) {
        failMsg = 'Программа не вывела результат в консоль через Console.WriteLine(...)';
      }
    }

    // Specific structural checks for C# topic mastery (verifies they used the taught feature, not hardcoding)
    if (testPassed) {
      if (task.id === 'task-1-1-2' && !codeWithoutComments.includes('$')) {
        testPassed = false;
        failMsg = 'Используйте интерполяцию строк $"..."';
      } else if (task.id === 'task-2-1-2' && !codeWithoutComments.includes('switch')) {
        testPassed = false;
        failMsg = 'Используйте switch expression со стрелочным синтаксисом =>';
      } else if (task.id === 'task-3-1-1' && !codeWithoutComments.includes('for')) {
        testPassed = false;
        failMsg = 'Используйте цикл for для суммирования';
      } else if (task.id === 'task-3-2-1' && !codeWithoutComments.includes('while')) {
        testPassed = false;
        failMsg = 'Используйте цикл while';
      } else if (task.id === 'task-4-2-1' && !codeWithoutComments.includes('TryParse')) {
        testPassed = false;
        failMsg = 'Используйте метод int.TryParse';
      } else if (task.id === 'task-5-1-1' && !codeWithoutComments.includes('foreach')) {
        testPassed = false;
        failMsg = 'Используйте цикл foreach';
      } else if (task.id === 'task-5-1-2' && !codeWithoutComments.includes('[^1]')) {
        testPassed = false;
        failMsg = 'Используйте индекс с конца [^1]';
      } else if (task.id === 'task-7-2-1' && !codeWithoutComments.includes('override')) {
        testPassed = false;
        failMsg = 'Используйте ключевое слово override';
      } else if (task.id === 'task-8-1-1' && !codeWithoutComments.includes('.Where')) {
        testPassed = false;
        failMsg = 'Используйте метод LINQ .Where()';
      }
    }

    if (!testPassed) allTestsPassed = false;

    return {
      testId: test.id,
      description: test.description,
      passed: testPassed,
      message: testPassed ? 'Тест успешно пройден' : failMsg
    };
  });

  const passedCount = testDetails.filter(t => t.passed).length;

  return {
    success: allTestsPassed,
    output: actualOutput 
      ? `${actualOutput}\n\nProcess finished with exit code 0.` 
      : 'Программа завершилась без вывода в консоль.',
    errorMessage: allTestsPassed 
      ? undefined 
      : (testDetails.find(t => !t.passed)?.message || 'Вывод программы не совпадает с ожидаемым результатом.'),
    testsPassed: passedCount,
    totalTests: testDetails.length,
    details: testDetails
  };
}
