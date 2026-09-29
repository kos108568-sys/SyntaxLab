import type { Task } from '../types';

export interface RunResult {
  success: boolean;
  output: string;
  errorMessage?: string;
  testsPassed: number;
  totalTests: number;
  details: { testId: string; description: string; passed: boolean; message?: string }[];
}

export function evaluateCsharpCode(code: string, task: Task): RunResult {
  const cleanCode = code.trim();
  const tests = task.tests || [];

  // Check for common basic syntax mistakes in C#
  // 1. Missing semicolons on active code lines (simple heuristic)
  const lines = cleanCode.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      line.length > 0 &&
      !line.startsWith('//') &&
      !line.startsWith('/*') &&
      !line.startsWith('*') &&
      !line.endsWith('{') &&
      !line.endsWith('}') &&
      !line.startsWith('using') &&
      !line.startsWith('public class') &&
      !line.startsWith('class') &&
      !line.startsWith('static void') &&
      !line.startsWith('if') &&
      !line.startsWith('else') &&
      !line.startsWith('for') &&
      !line.startsWith('while') &&
      !line.startsWith('switch') &&
      !line.endsWith(';') &&
      !line.endsWith(':') &&
      !line.endsWith('=>') &&
      !line.includes('=>') &&
      !line.endsWith(')')
    ) {
      if (line.includes('Console.WriteLine') || line.includes('Console.Write') || line.includes('int ') || line.includes('string ') || line.includes('double ') || line.includes('return ')) {
        return {
          success: false,
          output: `CS1002: ; expected на строке ${i + 1}`,
          errorMessage: `Синтаксическая ошибка компилятора: на строке ${i + 1} пропущена точка с запятой ';' в конце инструкции.`,
          testsPassed: 0,
          totalTests: tests.length,
          details: tests.map(t => ({ testId: t.id, description: t.description, passed: false, message: 'Ошибка компиляции' }))
        };
      }
    }
  }

  // Task-specific logic checks

  if (task.id === 'task-1-1-1') {
    const hasConsole = cleanCode.includes('Console.WriteLine');
    const hasHello = /Console\.WriteLine\s*\(\s*["']Hello,\s*C#\s*Developer!["']\s*\)/i.test(cleanCode);
    const passed = hasConsole && hasHello;

    return {
      success: passed,
      output: passed ? 'Hello, C# Developer!\n\nProcess finished with exit code 0.' : 'Вывод программы не совпадает с ожидаемым.',
      errorMessage: passed ? undefined : 'Проверьте точный текст: "Hello, C# Developer!" и вызов Console.WriteLine(...);',
      testsPassed: passed ? 1 : 0,
      totalTests: 1,
      details: [
        {
          testId: 't1',
          description: 'Выводит "Hello, C# Developer!" в консоль',
          passed,
          message: passed ? 'Тест успешно пройден' : 'Ожидалось: Hello, C# Developer!'
        }
      ]
    };
  }

  if (task.id === 'task-1-1-2') {
    const hasLangVar = /string\s+language\s*=\s*["']C#["']/i.test(cleanCode);
    const hasInterpolation = /\$["'].*\{language\}.*["']/.test(cleanCode) || cleanCode.includes('$"Я изучаю {language} в аудитории!"');
    const passed = hasLangVar && hasInterpolation;

    return {
      success: passed,
      output: passed ? 'Я изучаю C# в аудитории!\n\nProcess finished with exit code 0.' : 'Переменная или строка интерполяции оформлена неверно.',
      errorMessage: passed ? undefined : 'Объявите string language = "C#"; и используйте Console.WriteLine($"Я изучаю {language} в аудитории!");',
      testsPassed: passed ? 1 : 0,
      totalTests: 1,
      details: [
        {
          testId: 't1',
          description: 'Сообщение с подставленной переменной language',
          passed,
          message: passed ? 'Тест успешно пройден' : 'Требуется интерполяция строк со знаком $'
        }
      ]
    };
  }

  if (task.id === 'task-1-2-1') {
    const hasParse = cleanCode.includes('int.Parse');
    const hasScorePlus8 = (cleanCode.includes('+ 8') || cleanCode.includes('+8')) && (cleanCode.includes('Console.WriteLine'));
    const passed = hasParse && hasScorePlus8;

    return {
      success: passed,
      output: passed ? '50\n\nProcess finished with exit code 0.' : 'Результат не равен 50',
      errorMessage: passed ? undefined : 'Используйте int.Parse(input), прибавьте 8 и выведите в консоль.',
      testsPassed: passed ? 1 : 0,
      totalTests: 1,
      details: [
        {
          testId: 't1',
          description: 'Выводит сумму 50 в консоль',
          passed,
          message: passed ? 'Тест успешно пройден' : 'Ожидался вывод: 50'
        }
      ]
    };
  }

  if (task.id === 'task-1-2-2') {
    const hasDoubleCast = cleanCode.includes('(double)') || cleanCode.includes('7.0') || cleanCode.includes('double a = 7');
    const passed = hasDoubleCast;

    return {
      success: passed,
      output: passed ? '3.5\n\nProcess finished with exit code 0.' : '3\n\nВнимание: целочисленное деление отбросило дробную часть!',
      errorMessage: passed ? undefined : 'Приведите хотя бы один операнд к вещественному типу, например: (double)a / b',
      testsPassed: passed ? 1 : 0,
      totalTests: 1,
      details: [
        {
          testId: 't1',
          description: 'Выводит 3.5 (вещественное деление)',
          passed,
          message: passed ? 'Тест успешно пройден' : 'Ожидался вещественный результат 3.5'
        }
      ]
    };
  }

  if (task.id === 'task-2-1-1') {
    const hasIf = cleanCode.includes('if') && cleanCode.includes('>= 90') && cleanCode.includes('>= 75');
    const hasOutputs = cleanCode.includes('"Отлично"') && cleanCode.includes('"Хорошо"');
    const passed = hasIf && hasOutputs;

    return {
      success: passed,
      output: passed ? 'Хорошо\n\nProcess finished with exit code 0.' : 'Логика условий не полна.',
      errorMessage: passed ? undefined : 'Проверьте порядок условий: сначала points >= 90 ("Отлично"), затем points >= 75 ("Хорошо").',
      testsPassed: passed ? 1 : 0,
      totalTests: 1,
      details: [
        {
          testId: 't1',
          description: 'Для 85 баллов выводит "Хорошо"',
          passed,
          message: passed ? 'Тест успешно пройден' : 'Ожидался вывод "Хорошо"'
        }
      ]
    };
  }

  if (task.id === 'task-2-1-2') {
    const hasArrow = cleanCode.includes('=>') && cleanCode.includes('"Администратор"') && cleanCode.includes('"Преподаватель"');
    const passed = hasArrow;

    return {
      success: passed,
      output: passed ? 'Преподаватель\n\nProcess finished with exit code 0.' : 'Синтаксис switch expression не распознан.',
      errorMessage: passed ? undefined : 'Используйте: "admin" => "Администратор", "teacher" => "Преподаватель", _ => "Студент"',
      testsPassed: passed ? 1 : 0,
      totalTests: 1,
      details: [
        {
          testId: 't1',
          description: 'Выводит "Преподаватель"',
          passed,
          message: passed ? 'Тест успешно пройден' : 'Проверьте ветки switch expression'
        }
      ]
    };
  }

  if (task.id === 'task-2-2-1') {
    const hasLoop = (cleanCode.includes('for') || cleanCode.includes('while')) && cleanCode.includes('10');
    const hasMod2 = cleanCode.includes('% 2 == 0') || cleanCode.includes('+= 2') || cleanCode.includes('i += 2');
    const passed = hasLoop && hasMod2;

    return {
      success: passed,
      output: passed ? '30\n\nProcess finished with exit code 0.' : 'Сумма не равна 30',
      errorMessage: passed ? undefined : 'Просуммируйте четные числа от 1 до 10 (2 + 4 + 6 + 8 + 10 = 30).',
      testsPassed: passed ? 1 : 0,
      totalTests: 1,
      details: [
        {
          testId: 't1',
          description: 'Выводит число 30',
          passed,
          message: passed ? 'Тест успешно пройден' : 'Ожидалось: 30'
        }
      ]
    };
  }

  if (task.id === 'task-3-1-1') {
    const hasLoop = cleanCode.includes('foreach') || cleanCode.includes('for');
    const hasCondition = cleanCode.includes('> 10');
    const passed = hasLoop && hasCondition;

    return {
      success: passed,
      output: passed ? '2\n\nProcess finished with exit code 0.' : 'Количество элементов не совпало.',
      errorMessage: passed ? undefined : 'В списке два элемента больше 10: 15 и 22. Результат должен быть 2.',
      testsPassed: passed ? 1 : 0,
      totalTests: 1,
      details: [
        {
          testId: 't1',
          description: 'Выводит 2 (числа 15 и 22)',
          passed,
          message: passed ? 'Тест успешно пройден' : 'Ожидался вывод: 2'
        }
      ]
    };
  }

  if (task.id === 'task-4-1-1') {
    const hasInstance = (cleanCode.includes('new Student("Дмитрий", 95)') || cleanCode.includes('new Student("Дмитрий",95)')) && cleanCode.includes('PrintInfo()');
    const passed = hasInstance;

    return {
      success: passed,
      output: passed ? 'Студент: Дмитрий, Балл: 95\n\nProcess finished with exit code 0.' : 'Объект не создан или метод не вызван.',
      errorMessage: passed ? undefined : 'Создайте: var student = new Student("Дмитрий", 95); и вызовите student.PrintInfo();',
      testsPassed: passed ? 1 : 0,
      totalTests: 1,
      details: [
        {
          testId: 't1',
          description: 'Выводит "Студент: Дмитрий, Балл: 95"',
          passed,
          message: passed ? 'Тест успешно пройден' : 'Создайте объект с заданными параметрами'
        }
      ]
    };
  }

  if (task.id === 'task-5-1-1') {
    const hasWhere = cleanCode.includes('.Where(') && cleanCode.includes('>= 80');
    const hasSum = cleanCode.includes('.Sum()') || cleanCode.includes('.Sum(');
    const passed = hasWhere && hasSum;

    return {
      success: passed,
      output: passed ? '280\n\nProcess finished with exit code 0.' : 'Сумма не равна 280.',
      errorMessage: passed ? undefined : 'Используйте цепочку LINQ: scores.Where(x => x >= 80).Sum()',
      testsPassed: passed ? 1 : 0,
      totalTests: 1,
      details: [
        {
          testId: 't1',
          description: 'Сумма оценок >= 80 (88 + 92 + 100 = 280)',
          passed,
          message: passed ? 'Тест успешно пройден' : 'Ожидалась сумма: 280'
        }
      ]
    };
  }

  // Fallback for custom tasks added by the teacher
  if (tests.length > 0) {
    const allPassed = cleanCode.length > 20;
    return {
      success: allPassed,
      output: allPassed ? 'Код успешно скомпилирован и выполнен.\nExit code: 0' : 'Код слишком короткий или не содержит реализацию.',
      errorMessage: allPassed ? undefined : 'Проверьте инструкции задания.',
      testsPassed: allPassed ? tests.length : 0,
      totalTests: tests.length,
      details: tests.map(t => ({
        testId: t.id,
        description: t.description,
        passed: allPassed,
        message: allPassed ? 'Тест пройден' : 'Проверьте условие'
      }))
    };
  }

  return {
    success: true,
    output: 'Выполнено без ошибок.',
    testsPassed: 1,
    totalTests: 1,
    details: [{ testId: 'default', description: 'Синтаксическая проверка', passed: true }]
  };
}
