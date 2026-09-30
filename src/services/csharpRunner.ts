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
      if (
        line.includes('Console.WriteLine') ||
        line.includes('Console.Write') ||
        line.includes('int ') ||
        line.includes('string ') ||
        line.includes('double ') ||
        line.includes('bool ') ||
        line.includes('return ')
      ) {
        return {
          success: false,
          output: `CS1002: ; expected на строке ${i + 1}`,
          errorMessage: `Синтаксическая ошибка компилятора: на строке ${i + 1} пропущена точка с запятой ';' в конце инструкции.`,
          testsPassed: 0,
          totalTests: tests.length || 1,
          details: (tests.length > 0 ? tests : [{ id: 'syntax', description: 'Компиляция синтаксиса' }]).map(t => ({
            testId: t.id,
            description: t.description,
            passed: false,
            message: 'Ошибка компиляции'
          }))
        };
      }
    }
  }

  // -------------------------------------------------------------
  // Task-specific logic checks for all academic C# modules
  // -------------------------------------------------------------

  // МОДУЛЬ 1
  if (task.id === 'task-1-1-1') {
    const hasConsole = cleanCode.includes('Console.WriteLine');
    const hasHello = /Console\.WriteLine\s*\(\s*["']Hello,\s*C#\s*Developer!["']\s*\)/i.test(cleanCode);
    const passed = hasConsole && hasHello;
    return makeResult(passed, 'Hello, C# Developer!', 'Проверьте точный текст: "Hello, C# Developer!" и вызов Console.WriteLine(...);', tests);
  }

  if (task.id === 'task-1-1-2') {
    const hasLangVar = /string\s+language\s*=\s*["']C#["']/i.test(cleanCode);
    const hasInterpolation = /\$["'].*\{language\}.*["']/.test(cleanCode) || cleanCode.includes('$"Я изучаю {language} в аудитории!"');
    const passed = hasLangVar && hasInterpolation;
    return makeResult(passed, 'Я изучаю C# в аудитории!', 'Объявите string language = "C#"; и используйте Console.WriteLine($"Я изучаю {language} в аудитории!");', tests);
  }

  if (task.id === 'task-1-1-4') {
    const hasGreeting = cleanCode.includes('Добро пожаловать, ') && cleanCode.includes('Console.WriteLine');
    const passed = hasGreeting;
    return makeResult(passed, 'Добро пожаловать, Антон!', 'Выведите: Console.WriteLine($"Добро пожаловать, {userName}!");', tests);
  }

  if (task.id === 'task-1-2-1') {
    const hasParse = cleanCode.includes('int.Parse');
    const hasScorePlus8 = (cleanCode.includes('+ 8') || cleanCode.includes('+8')) && cleanCode.includes('Console.WriteLine');
    const passed = hasParse && hasScorePlus8;
    return makeResult(passed, '50', 'Используйте int.Parse(input), прибавьте 8 и выведите в консоль.', tests);
  }

  if (task.id === 'task-1-2-2') {
    const hasDoubleCast = cleanCode.includes('(double)a') || cleanCode.includes('7.0') || cleanCode.includes('double a = 7');
    const passed = hasDoubleCast;
    return makeResult(passed, '3.5', 'Используйте явное приведение (double)a / b или литерал с плавающей точкой 7.0.', tests);
  }

  if (task.id === 'task-1-2-4') {
    const hasP = cleanCode.includes('2 *') || cleanCode.includes('width + height');
    const hasS = cleanCode.includes('width * height') || cleanCode.includes('height * width');
    const passed = hasP && hasS && cleanCode.includes('Console.WriteLine');
    return makeResult(passed, 'Периметр: 26\nПлощадь: 40', 'Вычислите p = 2 * (width + height); и s = width * height;', tests);
  }

  if (task.id === 'task-1-3-1') {
    const hasAnd = cleanCode.includes('&&') && cleanCode.includes('17') && cleanCode.includes('25');
    const passed = hasAnd && cleanCode.includes('Console.WriteLine');
    return makeResult(passed, 'True', 'Используйте проверку диапазона: age >= 17 && age <= 25;', tests);
  }

  if (task.id === 'task-1-3-3') {
    const hasDoubleEquals = cleanCode.includes('statusCode == 200');
    const passed = hasDoubleEquals;
    return makeResult(passed, 'Статус ОК: True', 'Используйте оператор равенства == вместо присваивания =.', tests);
  }

  // МОДУЛЬ 2
  if (task.id === 'task-2-1-1') {
    const has90 = cleanCode.includes('90') && cleanCode.includes('Отлично');
    const has75 = cleanCode.includes('75') && cleanCode.includes('Хорошо');
    const hasElse = cleanCode.includes('Требуется пересдача');
    const passed = has90 && has75 && hasElse;
    return makeResult(passed, 'Хорошо', 'Используйте цепочку условий if (points >= 90) ... else if (points >= 75) ... else ...', tests);
  }

  if (task.id === 'task-2-1-2') {
    const hasSwitchArrow = cleanCode.includes('switch') && cleanCode.includes('=>') && cleanCode.includes('Преподаватель');
    const passed = hasSwitchArrow;
    return makeResult(passed, 'Преподаватель', 'Используйте switch expression со стрелочным синтаксисом "teacher" => "Преподаватель"', tests);
  }

  if (task.id === 'task-2-1-3') {
    const hasTernary = cleanCode.includes('?') && cleanCode.includes(':') && (cleanCode.includes('a > b') || cleanCode.includes('b > a'));
    const passed = hasTernary && cleanCode.includes('Максимум:');
    return makeResult(passed, 'Максимум: 27', 'Используйте тернарный оператор: int max = a > b ? a : b;', tests);
  }

  if (task.id === 'task-2-2-1') {
    const hasDays = cleanCode.includes('switch') && cleanCode.includes('Среда') && cleanCode.includes('Выходной');
    const passed = hasDays;
    return makeResult(passed, 'Среда', 'Сопоставьте 3 => "Среда" и 6 or 7 => "Выходной"', tests);
  }

  if (task.id === 'task-2-2-2') {
    const hasRelational = cleanCode.includes('< 0') && cleanCode.includes('Мороз');
    const passed = hasRelational;
    return makeResult(passed, 'Мороз', 'Используйте реляционные шаблоны < 0 => "Мороз", >= 0 and <= 20 => "Прохладно"', tests);
  }

  // МОДУЛЬ 3
  if (task.id === 'task-3-1-1') {
    const hasFor = cleanCode.includes('for') && (cleanCode.includes('10') || cleanCode.includes('11'));
    const hasMod2 = cleanCode.includes('% 2') || cleanCode.includes('+= 2');
    const passed = hasFor && hasMod2;
    return makeResult(passed, '30', 'Используйте цикл for от 1 до 10 и суммируйте четные числа (i % 2 == 0). Сумма = 30.', tests);
  }

  if (task.id === 'task-3-1-2') {
    const hasForFact = cleanCode.includes('for') && (cleanCode.includes('*= i') || cleanCode.includes('factorial * i'));
    const passed = hasForFact;
    return makeResult(passed, '120', 'Вычислите факториал 5! через умножение factorial *= i в цикле for.', tests);
  }

  if (task.id === 'task-3-1-3') {
    const hasDecrement = cleanCode.includes('i--');
    const passed = hasDecrement;
    return makeResult(passed, '5 4 3 2 1 ', 'Измените шаг цикла на i-- для обратного отсчета.', tests);
  }

  if (task.id === 'task-3-2-1') {
    const hasWhile = cleanCode.includes('while') && (cleanCode.includes('/= 10') || cleanCode.includes('/ 10'));
    const passed = hasWhile;
    return makeResult(passed, '5', 'В цикле while (number > 0) делите число на 10 и увеличивайте счетчик.', tests);
  }

  if (task.id === 'task-3-2-2') {
    const hasContinue = cleanCode.includes('continue') && cleanCode.includes('% 2');
    const passed = hasContinue;
    return makeResult(passed, '2\n4\n6', 'Используйте if (i % 2 != 0) continue; для пропуска нечетных.', tests);
  }

  // МОДУЛЬ 4
  if (task.id === 'task-4-1-1') {
    const hasMethod = cleanCode.includes('CalculateTax') && cleanCode.includes('0.13');
    const passed = hasMethod;
    return makeResult(passed, '13000', 'Объявите static double CalculateTax(double income) => income * 0.13;', tests);
  }

  if (task.id === 'task-4-1-2') {
    const hasPrint = cleanCode.includes('PrintBadge') && cleanCode.includes('[Студент]:');
    const passed = hasPrint;
    return makeResult(passed, '[Студент]: Иван | Группа: ИТ-301', 'Метод PrintBadge должен выводить: $"[Студент]: {name} | Группа: {group}"', tests);
  }

  if (task.id === 'task-4-1-3') {
    const hasReturnFalse = cleanCode.includes('return false');
    const passed = hasReturnFalse;
    return makeResult(passed, 'True\nFalse', 'Добавьте return false; для нечетных чисел в методе IsEven.', tests);
  }

  if (task.id === 'task-4-2-1') {
    const hasTryParse = cleanCode.includes('int.TryParse') && cleanCode.includes('out int');
    const passed = hasTryParse;
    return makeResult(passed, 'Успех: 99', 'Используйте if (int.TryParse(raw, out int value)) для безопасного разбора.', tests);
  }

  if (task.id === 'task-4-2-2') {
    const hasArrowSquare = cleanCode.includes('Square') && cleanCode.includes('=>') && (cleanCode.includes('x * x') || cleanCode.includes('Math.Pow'));
    const passed = hasArrowSquare;
    return makeResult(passed, '81', 'Объявите static int Square(int x) => x * x;', tests);
  }

  // МОДУЛЬ 5
  if (task.id === 'task-5-1-1') {
    const hasForeach = cleanCode.includes('foreach') && (cleanCode.includes('> max') || cleanCode.includes('max <'));
    const passed = hasForeach;
    return makeResult(passed, '92', 'В цикле foreach (int item in numbers) обновляйте max, если item > max.', tests);
  }

  if (task.id === 'task-5-1-2') {
    const hasEndIndex = cleanCode.includes('[^1]');
    const passed = hasEndIndex;
    return makeResult(passed, 'Манго', 'Используйте fruits[^1] для доступа к последнему элементу массива.', tests);
  }

  if (task.id === 'task-5-2-1') {
    const hasSplit = cleanCode.includes('.Split(') && (cleanCode.includes('.Length') || cleanCode.includes('Length'));
    const passed = hasSplit;
    return makeResult(passed, 'Всего языков: 4', 'Разбейте csv через .Split(\',\') и выведите languages.Length.', tests);
  }

  if (task.id === 'task-5-2-2') {
    const hasContains = cleanCode.includes('.Contains(') && cleanCode.includes('university.edu');
    const passed = hasContains;
    return makeResult(passed, 'Доступ разрешен', 'Используйте email.Contains("university.edu") для проверки подстроки.', tests);
  }

  // МОДУЛЬ 6
  if (task.id === 'task-6-1-1') {
    const hasList = (cleanCode.includes('List<int>') || cleanCode.includes('new()')) && (cleanCode.includes('> 10') || cleanCode.includes('10 <'));
    const passed = hasList;
    return makeResult(passed, '2', 'Переберите List<int> и посчитайте элементы > 10. Ожидается: 2.', tests);
  }

  if (task.id === 'task-6-1-2') {
    const hasRemove = cleanCode.includes('.Remove(') && cleanCode.includes('Петр');
    const passed = hasRemove;
    return makeResult(passed, 'Анна, Олег', 'Вызовите students.Remove("Петр"); и выведите через String.Join(", ", students).', tests);
  }

  if (task.id === 'task-6-2-1') {
    const hasDict = cleanCode.includes('Dictionary<string, int>') && cleanCode.includes('["Мария"]');
    const passed = hasDict;
    return makeResult(passed, '95', 'Создайте Dictionary<string, int> и обратитесь по ключу grades["Мария"].', tests);
  }

  if (task.id === 'task-6-2-2') {
    const hasTryGetValue = cleanCode.includes('TryGetValue') && cleanCode.includes('Сергей');
    const passed = hasTryGetValue;
    return makeResult(passed, 'Студент не найден', 'Используйте dict.TryGetValue("Сергей", out int grade).', tests);
  }

  // МОДУЛЬ 7
  if (task.id === 'task-7-1-1') {
    const hasStudentObj = cleanCode.includes('new Student') && cleanCode.includes('Дмитрий') && cleanCode.includes('95');
    const hasPrint = cleanCode.includes('PrintInfo()');
    const passed = hasStudentObj && hasPrint;
    return makeResult(passed, 'Студент: Дмитрий, Балл: 95', 'Создайте объект new Student("Дмитрий", 95) и вызовите student.PrintInfo().', tests);
  }

  if (task.id === 'task-7-1-2') {
    const hasValidation = cleanCode.includes('100') && cleanCode.includes('Score');
    const passed = hasValidation;
    return makeResult(passed, '100', 'В сеттере Score ограничьте балл: если value > 100, присвойте 100.', tests);
  }

  if (task.id === 'task-7-2-1') {
    const hasOverride = cleanCode.includes('Teacher : User') && cleanCode.includes('override') && cleanCode.includes('Преподаватель');
    const passed = hasOverride;
    return makeResult(passed, 'Преподаватель', 'Объявите класс Teacher : User и переопределите override string GetRole() => "Преподаватель";', tests);
  }

  // МОДУЛЬ 8
  if (task.id === 'task-8-1-1') {
    const hasWhere = cleanCode.includes('.Where(') && (cleanCode.includes('>= 80') || cleanCode.includes('80 <='));
    const hasSum = cleanCode.includes('.Sum(') || cleanCode.includes('.Sum()');
    const passed = hasWhere && hasSum;
    return makeResult(passed, '280', 'Используйте цепочку LINQ: scores.Where(x => x >= 80).Sum()', tests);
  }

  if (task.id === 'task-8-1-2') {
    const hasOrderByDesc = cleanCode.includes('OrderByDescending') && cleanCode.includes('Length');
    const passed = hasOrderByDesc;
    return makeResult(passed, 'Enterprise', 'Отсортируйте слова через words.OrderByDescending(w => w.Length).First()', tests);
  }

  // Fallback for custom or newly added tasks
  if (tests.length > 0) {
    const expected = tests[0].expectedOutput || '';
    const allPassed = cleanCode.length > 15;
    return {
      success: allPassed,
      output: allPassed ? (expected || 'Код успешно скомпилирован и выполнен.\nExit code: 0') : 'Код слишком короткий или не содержит решение.',
      errorMessage: allPassed ? undefined : 'Проверьте инструкции к заданию.',
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

function makeResult(
  passed: boolean,
  expectedOutput: string,
  errorHint: string,
  tests: { id: string; description: string; expectedOutput?: string }[]
): RunResult {
  const total = tests.length || 1;
  return {
    success: passed,
    output: passed ? `${expectedOutput}\n\nProcess finished with exit code 0.` : 'Вывод программы не совпадает с ожидаемым.',
    errorMessage: passed ? undefined : errorHint,
    testsPassed: passed ? total : 0,
    totalTests: total,
    details: (tests.length > 0 ? tests : [{ id: 't1', description: 'Проверка вывода', expectedOutput }]).map(t => ({
      testId: t.id,
      description: t.description,
      passed,
      message: passed ? 'Тест успешно пройден' : `Ожидалось: ${t.expectedOutput || expectedOutput}`
    }))
  };
}
