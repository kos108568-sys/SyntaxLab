import test from 'node:test';
import assert from 'node:assert';
import { evaluateCsharpCode } from '../services/csharpRunner.ts';

test('C# Runner: Comment-only bypass is rejected', () => {
  const result = evaluateCsharpCode('// Console.WriteLine("Hello, C# Developer!");', {
    id: 'task-1-1-1',
    lessonId: 'les-1-1',
    title: 'Test',
    type: 'code_challenge',
    difficulty: 'easy',
    xp: 25,
    instructions: 'Test',
    tests: [{ id: 't1', description: 'Check output', expectedOutput: 'Hello, C# Developer!' }]
  });
  assert.strictEqual(result.success, false);
});

test('C# Runner: Unmodified starter code is rejected', () => {
  const starter = `using System;
class Program {
  static void Main() {
    // Write code here
  }
}`;
  const result = evaluateCsharpCode(starter, {
    id: 'task-1-1-1',
    lessonId: 'les-1-1',
    title: 'Test',
    type: 'code_challenge',
    difficulty: 'easy',
    xp: 25,
    instructions: 'Test',
    initialCode: starter,
    tests: [{ id: 't1', description: 'Check output', expectedOutput: 'Hello, C# Developer!' }]
  });
  assert.strictEqual(result.success, false);
});

test('C# Runner: Switch expressions and properties evaluate correctly (task-2-1-2)', () => {
  const code = `using System;
class Program {
  static void Main() {
    int roleCode = 2;
    string title = roleCode switch {
      1 => "Студент",
      2 => "Преподаватель",
      _ => "Гость"
    };
    Console.WriteLine(title);
  }
}`;
  const result = evaluateCsharpCode(code, {
    id: 'task-2-1-2',
    lessonId: 'les-2-1',
    title: 'Switch Expression',
    type: 'code_challenge',
    difficulty: 'medium',
    xp: 35,
    instructions: 'Test',
    tests: [{ id: 't1', description: 'Output is Преподаватель', expectedOutput: 'Преподаватель' }]
  });
  assert.strictEqual(result.success, true);
  assert.match(result.output, /Преподаватель/);
});

test('C# Runner: LINQ Sum and collections evaluate correctly (task-7-1-2)', () => {
  const code = `using System;
using System.Collections.Generic;
using System.Linq;

class Program {
  static void Main() {
    var scores = new List<int> { 10, 20, 30, 40 };
    int total = scores.Sum();
    Console.WriteLine(total);
  }
} `;
  const result = evaluateCsharpCode(code, {
    id: 'task-7-1-2',
    lessonId: 'les-7-1',
    title: 'LINQ Sum',
    type: 'code_challenge',
    difficulty: 'medium',
    xp: 40,
    instructions: 'Test',
    tests: [{ id: 't1', description: 'Total score is 100', expectedOutput: '100' }]
  });
  assert.strictEqual(result.success, true);
  assert.match(result.output, /100/);
});

test('C# Runner: Security check blocks sandbox escape keywords', () => {
  const maliciousCode = `using System;
class Program {
  static void Main() {
    window.location = "http://evil.com";
  }
}`;
  const result = evaluateCsharpCode(maliciousCode, {
    id: 'task-sec',
    lessonId: 'les-sec',
    title: 'Security',
    type: 'code_challenge',
    difficulty: 'easy',
    xp: 10,
    instructions: 'Test',
    tests: [{ id: 't1', description: 'Output', expectedOutput: 'ok' }]
  });
  assert.strictEqual(result.success, false);
  assert.match(result.errorMessage || '', /недопустимый системный вызов/);
});
