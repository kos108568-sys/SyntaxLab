import type { Course } from '../types';

export const initialCsharpCourse: Course = {
  id: 'csharp-foundations',
  title: 'C# Pro: От Базового Синтаксиса до ООП и LINQ',
  language: 'C#',
  description: 'Академический интерактивный курс для аудиторных занятий. Никакой воды — реальный код, компиляторные проверки и строгая практика.',
  version: '12.0 (.NET 8)',
  modules: [
    // ==========================================
    // МОДУЛЬ 1: ВВЕДЕНИЕ И БАЗОВЫЙ СИНТАКСИС
    // ==========================================
    {
      id: 'mod-1',
      courseId: 'csharp-foundations',
      title: 'Модуль 1: Базовый синтаксис, переменные и типы данных',
      orderIndex: 1,
      description: 'Точка входа Main, вывод Console.WriteLine, строгая статическая типизация, переменные и консольный ввод.',
      iconName: 'Terminal',
      lessons: [
        {
          id: 'les-1-1',
          moduleId: 'mod-1',
          title: '1.1 Первая программа и вывод в консоль',
          slug: 'first-program',
          orderIndex: 1,
          description: 'Изучаем структуру программы, Console.WriteLine, интерполяцию строк и чтение ввода.',
          estimatedMinutes: 15,
          tasks: [
            {
              id: 'task-1-1-1',
              lessonId: 'les-1-1',
              title: 'Вывод приветствия разработчика',
              type: 'code_challenge',
              difficulty: 'easy',
              xp: 25,
              instructions: 'Напишите код, который выводит в консоль строку "Hello, C# Developer!". Соблюдайте регистр букв и знаки препинания.',
              theorySnippet: `// В C# для вывода данных в стандартный поток используется класс Console.
// Метод WriteLine автоматически переводит курсор на новую строку:
Console.WriteLine("Текст сообщения");`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        // Напишите команду вывода ниже:
        
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Hello, C# Developer!");
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Hello, C# Developer!" в консоль',
                  expectedOutput: 'Hello, C# Developer!'
                }
              ],
              hints: [
                'Используйте Console.WriteLine(...)',
                'Не забудьте точку с запятой в конце инструкции ;',
                'Строка должна быть заключена в двойные кавычки'
              ]
            },
            {
              id: 'task-1-1-2',
              lessonId: 'les-1-1',
              title: 'Интерполяция строк ($)',
              type: 'code_challenge',
              difficulty: 'easy',
              xp: 30,
              instructions: 'Объявите строковую переменную language со значением "C#". Затем выведите сообщение "Я изучаю {language} в аудитории!" с помощью интерполяции строк ($"...{...}...").',
              theorySnippet: `// Интерполяция строк в C# обозначается знаком $ перед строковым литералом:
string name = "Алексей";
Console.WriteLine($"Привет, {name}!");`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        // 1. Объявите string language = "C#";
        // 2. Выведите строку через $
        
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        string language = "C#";
        Console.WriteLine($"Я изучаю {language} в аудитории!");
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Сообщение с подставленной переменной language',
                  expectedOutput: 'Я изучаю C# в аудитории!'
                }
              ],
              hints: [
                'Используйте знак $ перед открывающей двойной кавычкой: $"Я изучаю {language} в аудитории!"',
                'Переменная объявляется как: string language = "C#";'
              ]
            },
            {
              id: 'task-1-1-3',
              lessonId: 'les-1-1',
              title: 'Проверка понимания: Console.Write vs Console.WriteLine',
              type: 'quiz',
              difficulty: 'easy',
              xp: 20,
              instructions: 'В чем ключевое отличие Console.WriteLine от Console.Write?',
              quizOptions: [
                {
                  id: 'q1',
                  text: 'Console.WriteLine добавляет символ перевода строки (\\n) в конце вывода',
                  isCorrect: true,
                  explanation: 'Совершенно верно! WriteLine переносит курсор на новую строку, а Write оставляет его на текущей.'
                },
                {
                  id: 'q2',
                  text: 'Console.Write может выводить только числа, а WriteLine — любые типы',
                  isCorrect: false,
                  explanation: 'Оба метода перегружены для приема практически любых типов данных.'
                },
                {
                  id: 'q3',
                  text: 'Console.WriteLine работает быстрее, так как не буферизирует вывод',
                  isCorrect: false,
                  explanation: 'Оба метода работают через один и тот же стандартный поток TextWriter.'
                }
              ],
              hints: ['Обратите внимание на суффикс Line в названии метода']
            },
            {
              id: 'task-1-1-4',
              lessonId: 'les-1-1',
              title: 'Чтение строки с Console.ReadLine()',
              type: 'code_challenge',
              difficulty: 'easy',
              xp: 30,
              instructions: 'Объявите переменную userName и прочитайте значение из консоли с помощью Console.ReadLine(). Затем выведите приветствие: $"Добро пожаловать, {userName}!". (Для проверки используется имя "Антон").',
              theorySnippet: `// Метод Console.ReadLine() считывает всю введенную строку до нажатия Enter:
string input = Console.ReadLine();
Console.WriteLine($"Вы ввели: {input}");`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        // Считайте имя пользователя через Console.ReadLine()
        // Выведите: Добро пожаловать, {userName}!
        string userName = "Антон";
        Console.WriteLine($"Добро пожаловать, {userName}!");
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        string userName = "Антон";
        Console.WriteLine($"Добро пожаловать, {userName}!");
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит приветствие с именем',
                  expectedOutput: 'Добро пожаловать, Антон!'
                }
              ],
              hints: [
                'Используйте интерполяцию: Console.WriteLine($"Добро пожаловать, {userName}!");'
              ]
            }
          ]
        },
        {
          id: 'les-1-2',
          moduleId: 'mod-1',
          title: '1.2 Типы данных, приведение и парсинг',
          slug: 'data-types-conversions',
          orderIndex: 2,
          description: 'Целочисленные, вещественные типы, строки, bool, приведение типов и безопасный парсинг.',
          estimatedMinutes: 20,
          tasks: [
            {
              id: 'task-1-2-1',
              lessonId: 'les-1-2',
              title: 'Парсинг строки в целое число',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 35,
              instructions: 'Дана строковая переменная input = "42". Преобразуйте её в целочисленную переменную score с помощью int.Parse() и прибавьте к ней 8. Выведите результат.',
              theorySnippet: `// Для преобразования строки в целое число используется int.Parse():
string raw = "100";
int number = int.Parse(raw);`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        string input = "42";
        // Преобразуйте input в int, прибавьте 8 и выведите в консоль:
        
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        string input = "42";
        int score = int.Parse(input);
        Console.WriteLine(score + 8);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит сумму 50 в консоль',
                  expectedOutput: '50'
                }
              ],
              hints: [
                'Используйте: int score = int.Parse(input);',
                'Затем: Console.WriteLine(score + 8);'
              ]
            },
            {
              id: 'task-1-2-2',
              lessonId: 'les-1-2',
              title: 'Поиск ошибки: Целочисленное деление',
              type: 'spot_bug',
              difficulty: 'medium',
              xp: 30,
              instructions: 'В коде ниже программист хотел вычислить точное среднее значение 7 / 2 (ожидая 3.5), но получает 3. Исправьте код, сделав хотя бы один из операндов вещественным типом (double).',
              theorySnippet: `// В C# деление двух int дает int (дробная часть отбрасывается):
// 7 / 2 == 3
// Чтобы получить дробь, нужно явное приведение или литерал double:
// (double)7 / 2 == 3.5 или 7.0 / 2 == 3.5`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        int a = 7;
        int b = 2;
        // Ошибка: деление int на int
        double result = a / b;
        Console.WriteLine(result);
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        int a = 7;
        int b = 2;
        double result = (double)a / b;
        Console.WriteLine(result);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит 3.5 или 3,5',
                  expectedOutput: '3.5'
                }
              ],
              hints: [
                'Используйте явное приведение типа: (double)a / b',
                'Либо объявите double a = 7;'
              ]
            },
            {
              id: 'task-1-2-3',
              lessonId: 'les-1-2',
              title: 'Квиз: Размеры и точность типов в .NET',
              type: 'quiz',
              difficulty: 'easy',
              xp: 20,
              instructions: 'Какой тип данных в C# обеспечивает наивысшую точность для финансовых вычислений без погрешностей округления чисел с плавающей точкой?',
              quizOptions: [
                {
                  id: 'q1',
                  text: 'decimal (128 бит / 16 байт, основание 10)',
                  isCorrect: true,
                  explanation: 'Абсолютно верно! decimal использует десятичное представление с фиксированной запятой, что исключает ошибки округления в денежных операциях.'
                },
                {
                  id: 'q2',
                  text: 'double (64 бит / 8 байт, стандарт IEEE 754)',
                  isCorrect: false,
                  explanation: 'double использует двоичное представление и подвержен погрешностям вроде 0.1 + 0.2 != 0.3.'
                },
                {
                  id: 'q3',
                  text: 'long (64 бит / 8 байт целое число)',
                  isCorrect: false,
                  explanation: 'long может хранить только целые числа, он не подходит для дробных сумм.'
                }
              ],
              hints: ['Ищите тип, специально созданный для финансов']
            },
            {
              id: 'task-1-2-4',
              lessonId: 'les-1-2',
              title: 'Вычисление периметра и площади',
              type: 'code_challenge',
              difficulty: 'easy',
              xp: 35,
              instructions: 'Даны стороны прямоугольника int width = 5 и int height = 8. Вычислите его периметр P = 2 * (width + height) и площадь S = width * height. Выведите две строки: "Периметр: {P}" и "Площадь: {S}".',
              theorySnippet: `int a = 10;
int b = 20;
int sum = a + b;
Console.WriteLine($"Сумма: {sum}");`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        int width = 5;
        int height = 8;
        
        // Вычислите периметр и площадь:
        
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        int width = 5;
        int height = 8;
        int p = 2 * (width + height);
        int s = width * height;
        Console.WriteLine($"Периметр: {p}");
        Console.WriteLine($"Площадь: {s}");
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит правильный периметр 26 и площадь 40',
                  expectedOutput: 'Периметр: 26\nПлощадь: 40'
                }
              ],
              hints: [
                'p = 2 * (width + height);',
                's = width * height;'
              ]
            }
          ]
        },
        {
          id: 'les-1-3',
          moduleId: 'mod-1',
          title: '1.3 Логические операции и булевы выражения',
          slug: 'boolean-logic',
          orderIndex: 3,
          description: 'Логические операторы И (&&), ИЛИ (||), НЕ (!), приоритет и ленивые вычисления.',
          estimatedMinutes: 15,
          tasks: [
            {
              id: 'task-1-3-1',
              lessonId: 'les-1-3',
              title: 'Проверка диапазона чисел через &&',
              type: 'code_challenge',
              difficulty: 'easy',
              xp: 30,
              instructions: 'Дана переменная int age = 20. Напишите булево выражение, проверяющее, что возраст находится в студенческом диапазоне от 17 до 25 включительно (age >= 17 && age <= 25). Сохраните результат в bool isStudentAge и выведите его в консоль.',
              theorySnippet: `// Оператор && (логическое И) возвращает true только если оба операнда истинны:
bool inRange = x >= 10 && x <= 50;`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        int age = 20;
        // Объявите bool isStudentAge и выведите в консоль:
        
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        int age = 20;
        bool isStudentAge = age >= 17 && age <= 25;
        Console.WriteLine(isStudentAge);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит True',
                  expectedOutput: 'True'
                }
              ],
              hints: [
                'Используйте: bool isStudentAge = age >= 17 && age <= 25;',
                'Затем: Console.WriteLine(isStudentAge);'
              ]
            },
            {
              id: 'task-1-3-2',
              lessonId: 'les-1-3',
              title: 'Квиз: Ленивые вычисления (Short-Circuit Evaluation)',
              type: 'quiz',
              difficulty: 'medium',
              xp: 25,
              instructions: 'Что произойдет при вычислении выражения: `false && (10 / 0 == 1)`?',
              quizOptions: [
                {
                  id: 'q1',
                  text: 'Результат будет false, ошибки деления на ноль не возникнет благодаря Short-Circuiting',
                  isCorrect: true,
                  explanation: 'Верно! Оператор && проверяет левый операнд. Так как он false, правая часть даже не вычисляется, и DivideByZeroException не выбрасывается.'
                },
                {
                  id: 'q2',
                  text: 'Программа выбросит исключение DivideByZeroException',
                  isCorrect: false,
                  explanation: 'Это произошло бы при использовании не-короткого оператора &, но с && правая часть игнорируется.'
                },
                {
                  id: 'q3',
                  text: 'Ошибка компиляции',
                  isCorrect: false,
                  explanation: 'Код синтаксически корректен и успешно компилируется.'
                }
              ],
              hints: ['Вспомните, как работает оператор && при ложном первом условии']
            },
            {
              id: 'task-1-3-3',
              lessonId: 'les-1-3',
              title: 'Поиск ошибки: = вместо == в условии',
              type: 'spot_bug',
              difficulty: 'easy',
              xp: 25,
              instructions: 'Студент хотел проверить, равен ли статус коду 200, но допустил опечатку с оператором присваивания. Исправьте ошибку.',
              theorySnippet: `// = это присваивание: int x = 5;
// == это сравнение на равенство: if (x == 5)`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        int statusCode = 200;
        bool isOk = statusCode == 200;
        Console.WriteLine($"Статус ОК: {isOk}");
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        int statusCode = 200;
        bool isOk = statusCode == 200;
        Console.WriteLine($"Статус ОК: {isOk}");
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит Статус ОК: True',
                  expectedOutput: 'Статус ОК: True'
                }
              ],
              hints: ['Убедитесь, что используется оператор сравнения ==']
            }
          ]
        }
      ]
    },

    // ==========================================
    // МОДУЛЬ 2: УПРАВЛЯЮЩИЕ КОНСТРУКЦИИ И ВЕТВЛЕНИЯ
    // ==========================================
    {
      id: 'mod-2',
      courseId: 'csharp-foundations',
      title: 'Модуль 2: Управляющие конструкции и ветвления',
      orderIndex: 2,
      description: 'Условия if-else, тернарный оператор, классический switch и современные pattern matching выражения.',
      iconName: 'GitBranch',
      lessons: [
        {
          id: 'les-2-1',
          moduleId: 'mod-2',
          title: '2.1 Ветвления if / else if / else',
          slug: 'conditionals',
          orderIndex: 1,
          description: 'Принятие решений в коде на основе булевых выражений и тернарный оператор.',
          estimatedMinutes: 20,
          tasks: [
            {
              id: 'task-2-1-1',
              lessonId: 'les-2-1',
              title: 'Проверка студенческой оценки',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 40,
              instructions: 'Дана переменная int points = 85. Если points >= 90, выведите "Отлично". Иначе если points >= 75, выведите "Хорошо". В остальных случаях выведите "Требуется пересдача".',
              theorySnippet: `if (условие)
{
    // ...
}
else if (другое_условие)
{
    // ...
}
else
{
    // ...
}`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        int points = 85;
        // Напишите проверку условий:
        
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        int points = 85;
        if (points >= 90)
        {
            Console.WriteLine("Отлично");
        }
        else if (points >= 75)
        {
            Console.WriteLine("Хорошо");
        }
        else
        {
            Console.WriteLine("Требуется пересдача");
        }
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Для 85 баллов выводит "Хорошо"',
                  expectedOutput: 'Хорошо'
                }
              ],
              hints: [
                'Используйте структуру if (...) { ... } else if (...) { ... } else { ... }',
                'Проверку points >= 90 ставьте первой'
              ]
            },
            {
              id: 'task-2-1-2',
              lessonId: 'les-2-1',
              title: 'Современные Switch Expressions в C#',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 45,
              instructions: 'Используйте switch expression (стрелочный синтаксис C# 8+), чтобы получить строковый статус роли: "admin" => "Администратор", "teacher" => "Преподаватель", _ => "Студент". Для role = "teacher" выведите результат.',
              theorySnippet: `// Современный switch-expression компактен:
string title = role switch
{
    "admin" => "Администратор",
    "teacher" => "Преподаватель",
    _ => "Студент"
};`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        string role = "teacher";
        // Напишите switch expression:
        string title = role switch
        {
            // дополните ветки
        };
        Console.WriteLine(title);
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        string role = "teacher";
        string title = role switch
        {
            "admin" => "Администратор",
            "teacher" => "Преподаватель",
            _ => "Студент"
        };
        Console.WriteLine(title);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Преподаватель"',
                  expectedOutput: 'Преподаватель'
                }
              ],
              hints: [
                'Символ _ (дефис подчеркивания) обозначает дефолтный случай (default)',
                'Не забудьте точку с запятой после закрывающей фигурной скобки switch-выражения'
              ]
            },
            {
              id: 'task-2-1-3',
              lessonId: 'les-2-1',
              title: 'Тернарный условный оператор (?:)',
              type: 'code_challenge',
              difficulty: 'easy',
              xp: 30,
              instructions: 'Даны два числа: int a = 15; int b = 27;. С помощью тернарного оператора ?: найдите максимальное число и выведите его в консоль: "Максимум: {max}".',
              theorySnippet: `// Тернарный оператор имеет форму: условие ? значение_если_true : значение_если_false
int max = a > b ? a : b;`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        int a = 15;
        int b = 27;
        // Найдите max через тернарный оператор:
        
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        int a = 15;
        int b = 27;
        int max = a > b ? a : b;
        Console.WriteLine($"Максимум: {max}");
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Максимум: 27"',
                  expectedOutput: 'Максимум: 27'
                }
              ],
              hints: [
                'int max = a > b ? a : b;',
                'Console.WriteLine($"Максимум: {max}");'
              ]
            }
          ]
        },
        {
          id: 'les-2-2',
          moduleId: 'mod-2',
          title: '2.2 Pattern Matching и сопоставление с шаблоном',
          slug: 'pattern-matching',
          orderIndex: 2,
          description: 'Реляционные шаблоны, логические связки and/or в паттернах C# 9+.',
          estimatedMinutes: 20,
          tasks: [
            {
              id: 'task-2-2-1',
              lessonId: 'les-2-2',
              title: 'Определение дня недели по номеру',
              type: 'code_challenge',
              difficulty: 'easy',
              xp: 35,
              instructions: 'Дано число int day = 3. Используя switch-expression, сопоставьте: 1 => "Понедельник", 2 => "Вторник", 3 => "Среда", 4 => "Четверг", 5 => "Пятница", 6 or 7 => "Выходной", _ => "Некорректный день". Выведите результат.',
              theorySnippet: `string dayName = day switch
{
    1 => "Понедельник",
    6 or 7 => "Выходной",
    _ => "Ошибка"
};`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        int day = 3;
        // Напишите switch expression:
        
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        int day = 3;
        string dayName = day switch
        {
            1 => "Понедельник",
            2 => "Вторник",
            3 => "Среда",
            4 => "Четверг",
            5 => "Пятница",
            6 or 7 => "Выходной",
            _ => "Некорректный день"
        };
        Console.WriteLine(dayName);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Среда" для day = 3',
                  expectedOutput: 'Среда'
                }
              ],
              hints: [
                'Используйте стрелочный синтаксис: 3 => "Среда",',
                'Для выходных: 6 or 7 => "Выходной",'
              ]
            },
            {
              id: 'task-2-2-2',
              lessonId: 'les-2-2',
              title: 'Реляционные шаблоны температуры (<, >= and <)',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 45,
              instructions: 'Дана переменная int temp = -5. Используя реляционные шаблоны в switch, классифицируйте погоду: < 0 => "Мороз", >= 0 and <= 20 => "Прохладно", _ => "Тепло". Выведите результат в консоль.',
              theorySnippet: `// Реляционные шаблоны (Relational Patterns) в C# 9+:
string status = temp switch
{
    < 0 => "Мороз",
    >= 0 and <= 20 => "Прохладно",
    _ => "Тепло"
};`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        int temp = -5;
        // Напишите реляционный switch:
        
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        int temp = -5;
        string status = temp switch
        {
            < 0 => "Мороз",
            >= 0 and <= 20 => "Прохладно",
            _ => "Тепло"
        };
        Console.WriteLine(status);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Мороз" для -5',
                  expectedOutput: 'Мороз'
                }
              ],
              hints: [
                'Используйте операторы < 0 => "Мороз",',
                'Дефолтная ветка: _ => "Тепло"'
              ]
            },
            {
              id: 'task-2-2-3',
              lessonId: 'les-2-2',
              title: 'Квиз: Ключевое слово when в switch',
              type: 'quiz',
              difficulty: 'medium',
              xp: 25,
              instructions: 'Для чего используется ключевое слово `when` в ветках конструкции switch?',
              quizOptions: [
                {
                  id: 'q1',
                  text: 'Для задания дополнительного булевого условия (case guard) фильтрации ветки',
                  isCorrect: true,
                  explanation: 'Верно! when позволяет добавить произвольное логическое условие: case int n when n % 2 == 0.'
                },
                {
                  id: 'q2',
                  text: 'Для запуска асинхронного таймера ожидания перед выполнением ветки',
                  isCorrect: false,
                  explanation: 'Слово when в паттерн-матчинге не связано с таймерами.'
                },
                {
                  id: 'q3',
                  text: 'Для завершения работы метода',
                  isCorrect: false,
                  explanation: 'Для выхода из метода используется return.'
                }
              ],
              hints: ['Подумайте о фильтрации (case guard)']
            }
          ]
        }
      ]
    },

    // ==========================================
    // МОДУЛЬ 3: ЦИКЛЫ И ИТЕРАЦИИ
    // ==========================================
    {
      id: 'mod-3',
      courseId: 'csharp-foundations',
      title: 'Модуль 3: Циклы и алгоритмы итераций',
      orderIndex: 3,
      description: 'Многократное повторение инструкций: циклы for, while, do-while, алгоритмы накопления, break и continue.',
      iconName: 'Layers',
      lessons: [
        {
          id: 'les-3-1',
          moduleId: 'mod-3',
          title: '3.1 Цикл for и счетчики',
          slug: 'loops-for',
          orderIndex: 1,
          description: 'Классический цикл for, шаги итераций и накопители.',
          estimatedMinutes: 20,
          tasks: [
            {
              id: 'task-3-1-1',
              lessonId: 'les-3-1',
              title: 'Сумма четных чисел от 1 до 10',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 40,
              instructions: 'Напишите цикл for, который находит сумму всех четных чисел в диапазоне от 1 до 10 включительно (2 + 4 + 6 + 8 + 10 = 30) и выводит итоговую сумму в консоль.',
              theorySnippet: `int sum = 0;
for (int i = 1; i <= n; i++)
{
    if (i % 2 == 0)
    {
        sum += i;
    }
}`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        int sum = 0;
        // Напишите цикл for от 1 до 10:
        
        Console.WriteLine(sum);
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        int sum = 0;
        for (int i = 1; i <= 10; i++)
        {
            if (i % 2 == 0)
            {
                sum += i;
            }
        }
        Console.WriteLine(sum);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит число 30',
                  expectedOutput: '30'
                }
              ],
              hints: [
                'Проверка четности: i % 2 == 0',
                'Границы цикла: for (int i = 1; i <= 10; i++)'
              ]
            },
            {
              id: 'task-3-1-2',
              lessonId: 'les-3-1',
              title: 'Вычисление факториала числа (n!)',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 45,
              instructions: 'Дано число int n = 5. Вычислите факториал числа 5! = 1 * 2 * 3 * 4 * 5 = 120 с помощью цикла for и выведите результат.',
              theorySnippet: `int fact = 1;
for (int i = 1; i <= n; i++)
{
    fact *= i;
}`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        int n = 5;
        int factorial = 1;
        // Вычислите факториал в цикле for:
        
        Console.WriteLine(factorial);
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        int n = 5;
        int factorial = 1;
        for (int i = 1; i <= n; i++)
        {
            factorial *= i;
        }
        Console.WriteLine(factorial);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит 120 для 5!',
                  expectedOutput: '120'
                }
              ],
              hints: [
                'Инициализируйте int factorial = 1;',
                'В цикле умножайте: factorial *= i;'
              ]
            },
            {
              id: 'task-3-1-3',
              lessonId: 'les-3-1',
              title: 'Поиск бага: Бесконечный цикл из-за ошибки шага',
              type: 'spot_bug',
              difficulty: 'medium',
              xp: 35,
              instructions: 'В коде ниже разработчик хотел вывести обратный отсчет от 5 до 1, но случайно увеличивал счетчик i++ вместо уменьшения i--, из-за чего цикл зацикливался. Исправьте ошибку.',
              theorySnippet: `// Для обратного счета счетчик нужно уменьшать:
for (int i = 5; i >= 1; i--)
{
    Console.WriteLine(i);
}`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        // Ошибка: счетчик увеличивается вместо уменьшения
        for (int i = 5; i >= 1; i--)
        {
            Console.Write(i + " ");
        }
        Console.WriteLine();
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        for (int i = 5; i >= 1; i--)
        {
            Console.Write(i + " ");
        }
        Console.WriteLine();
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "5 4 3 2 1 "',
                  expectedOutput: '5 4 3 2 1 '
                }
              ],
              hints: ['Измените шаг на i--']
            }
          ]
        },
        {
          id: 'les-3-2',
          moduleId: 'mod-3',
          title: '3.2 Циклы while, do-while, break и continue',
          slug: 'loops-while',
          orderIndex: 2,
          description: 'Циклы с предусловием и постусловием, пропуск и прерывание итераций.',
          estimatedMinutes: 20,
          tasks: [
            {
              id: 'task-3-2-1',
              lessonId: 'les-3-2',
              title: 'Подсчет количества цифр в числе через while',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 45,
              instructions: 'Дано положительное число int number = 12345. С помощью цикла while (number > 0) посчитайте, сколько в нем цифр (деля на 10 на каждом шаге), и выведите количество.',
              theorySnippet: `int count = 0;
while (num > 0)
{
    num /= 10;
    count++;
}`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        int number = 12345;
        int count = 0;
        
        // Напишите цикл while:
        
        Console.WriteLine(count);
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        int number = 12345;
        int count = 0;
        while (number > 0)
        {
            number /= 10;
            count++;
        }
        Console.WriteLine(count);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит 5 для числа 12345',
                  expectedOutput: '5'
                }
              ],
              hints: [
                'В теле цикла делите: number /= 10;',
                'И увеличивайте счетчик: count++;'
              ]
            },
            {
              id: 'task-3-2-2',
              lessonId: 'les-3-2',
              title: 'Оператор continue для пропуска нечетных',
              type: 'code_challenge',
              difficulty: 'easy',
              xp: 35,
              instructions: 'В цикле for от 1 до 6 используйте оператор continue, чтобы пропустить нечетные числа. Выведите только четные числа через Console.WriteLine.',
              theorySnippet: `for (int i = 1; i <= 10; i++)
{
    if (i % 2 != 0) continue; // переход к следующей итерации
    Console.WriteLine(i);
}`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        for (int i = 1; i <= 6; i++)
        {
            // Если i нечетное, используйте continue
            
            Console.WriteLine(i);
        }
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        for (int i = 1; i <= 6; i++)
        {
            if (i % 2 != 0)
            {
                continue;
            }
            Console.WriteLine(i);
        }
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит четные числа 2, 4, 6',
                  expectedOutput: '2\n4\n6'
                }
              ],
              hints: [
                'if (i % 2 != 0) continue;'
              ]
            },
            {
              id: 'task-3-2-3',
              lessonId: 'les-3-2',
              title: 'Квиз: Особенность цикла do-while',
              type: 'quiz',
              difficulty: 'easy',
              xp: 20,
              instructions: 'Какая ключевая особенность отличает цикл `do-while` от обычного `while`?',
              quizOptions: [
                {
                  id: 'q1',
                  text: 'Тело цикла do-while гарантированно выполнится хотя бы 1 раз, так как проверка в конце',
                  isCorrect: true,
                  explanation: 'Правильно! Проверка условия происходит после выполнения тела цикла (постусловие).'
                },
                {
                  id: 'q2',
                  text: 'do-while выполняется быстрее, потому что компилируется без переходов',
                  isCorrect: false,
                  explanation: 'Оба цикла генерируют схожие инструкции IL.'
                },
                {
                  id: 'q3',
                  text: 'В do-while нельзя использовать оператор break',
                  isCorrect: false,
                  explanation: 'Операторы break и continue работают во всех циклах C#.'
                }
              ],
              hints: ['Вспомните, где находится условие: в начале или в конце?']
            }
          ]
        }
      ]
    },

    // ==========================================
    // МОДУЛЬ 4: МЕТОДЫ И ФУНКЦИИ
    // ==========================================
    {
      id: 'mod-4',
      courseId: 'csharp-foundations',
      title: 'Модуль 4: Методы и функции (Декомпозиция программ)',
      orderIndex: 4,
      description: 'Разделение логики на повторно используемые функции, параметры, возврат значений, перегрузка, ref/out и методы-стрелки.',
      iconName: 'Box',
      lessons: [
        {
          id: 'les-4-1',
          moduleId: 'mod-4',
          title: '4.1 Объявление методов и возврат значений',
          slug: 'methods-basics',
          orderIndex: 1,
          description: 'Статические методы, параметры, сигнатура и возвращаемые значения.',
          estimatedMinutes: 20,
          tasks: [
            {
              id: 'task-4-1-1',
              lessonId: 'les-4-1',
              title: 'Статический метод расчета налога CalculateTax',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 45,
              instructions: 'Напишите статический метод CalculateTax, который принимает параметр double income и возвращает 13% от дохода (income * 0.13). В методе Main вызовите его для дохода 100000 и выведите результат.',
              theorySnippet: `public static double CalculateTax(double income)
{
    return income * 0.13;
}`,
              initialCode: `using System;

class Program
{
    // Объявите метод CalculateTax здесь:
    
    static void Main()
    {
        double tax = CalculateTax(100000);
        Console.WriteLine(tax);
    }
}`,
              solutionCode: `using System;

class Program
{
    public static double CalculateTax(double income)
    {
        return income * 0.13;
    }

    static void Main()
    {
        double tax = CalculateTax(100000);
        Console.WriteLine(tax);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Возвращает 13000',
                  expectedOutput: '13000'
                }
              ],
              hints: [
                'public static double CalculateTax(double income) { return income * 0.13; }'
              ]
            },
            {
              id: 'task-4-1-2',
              lessonId: 'les-4-1',
              title: 'Процедурный метод void PrintBadge',
              type: 'code_challenge',
              difficulty: 'easy',
              xp: 35,
              instructions: 'Напишите метод static void PrintBadge(string name, string group), который выводит в консоль строку: $"[Студент]: {name} | Группа: {group}". Вызовите его для ("Иван", "ИТ-301").',
              theorySnippet: `static void PrintMessage(string msg)
{
    Console.WriteLine(msg);
}`,
              initialCode: `using System;

class Program
{
    // Объявите метод PrintBadge:
    
    static void Main()
    {
        PrintBadge("Иван", "ИТ-301");
    }
}`,
              solutionCode: `using System;

class Program
{
    static void PrintBadge(string name, string group)
    {
        Console.WriteLine($"[Студент]: {name} | Группа: {group}");
    }

    static void Main()
    {
        PrintBadge("Иван", "ИТ-301");
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит карточку студента',
                  expectedOutput: '[Студент]: Иван | Группа: ИТ-301'
                }
              ],
              hints: [
                'static void PrintBadge(string name, string group)',
                'Console.WriteLine($"[Студент]: {name} | Группа: {group}");'
              ]
            },
            {
              id: 'task-4-1-3',
              lessonId: 'les-4-1',
              title: 'Поиск бага: Не все пути к коду возвращают значение (CS0161)',
              type: 'spot_bug',
              difficulty: 'medium',
              xp: 35,
              instructions: 'В коде ниже метод IsEven возвращает true, если число четное, но разработчик забыл вернуть значение в ветке else. Добавьте return false; для нечетных чисел.',
              theorySnippet: `// Каждый путь исполнения не-void метода обязан возвращать значение:
bool Check(int x)
{
    if (x > 0) return true;
    return false; // обязательный return
}`,
              initialCode: `using System;

class Program
{
    static bool IsEven(int n)
    {
        if (n % 2 == 0)
        {
            return true;
        }
        return false;
    }

    static void Main()
    {
        Console.WriteLine(IsEven(4));
        Console.WriteLine(IsEven(7));
    }
}`,
              solutionCode: `using System;

class Program
{
    static bool IsEven(int n)
    {
        if (n % 2 == 0)
        {
            return true;
        }
        return false;
    }

    static void Main()
    {
        Console.WriteLine(IsEven(4));
        Console.WriteLine(IsEven(7));
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит True затем False',
                  expectedOutput: 'True\nFalse'
                }
              ],
              hints: ['Добавьте return false; в конце метода']
            }
          ]
        },
        {
          id: 'les-4-2',
          moduleId: 'mod-4',
          title: '4.2 Модификаторы out, ref и стрелочные функции (=>)',
          slug: 'methods-advanced',
          orderIndex: 2,
          description: 'Безопасный парсинг с int.TryParse, модификаторы параметров и лаконичный синтаксис.',
          estimatedMinutes: 20,
          tasks: [
            {
              id: 'task-4-2-1',
              lessonId: 'les-4-2',
              title: 'Безопасный парсинг через int.TryParse и out',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 45,
              instructions: 'Дана строка string raw = "99". Используйте int.TryParse(raw, out int value). Если парсинг успешен, выведите $"Успех: {value}". Иначе выведите "Ошибка ввода".',
              theorySnippet: `// Метод TryParse возвращает bool и отдает результат через out:
if (int.TryParse("123", out int num))
{
    Console.WriteLine($"Число: {num}");
}`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        string raw = "99";
        // Напишите проверку через int.TryParse:
        
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        string raw = "99";
        if (int.TryParse(raw, out int value))
        {
            Console.WriteLine($"Успех: {value}");
        }
        else
        {
            Console.WriteLine("Ошибка ввода");
        }
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Успех: 99"',
                  expectedOutput: 'Успех: 99'
                }
              ],
              hints: [
                'if (int.TryParse(raw, out int value))',
                'Console.WriteLine($"Успех: {value}");'
              ]
            },
            {
              id: 'task-4-2-2',
              lessonId: 'les-4-2',
              title: 'Стрелочный метод Expression-Bodied Members',
              type: 'code_challenge',
              difficulty: 'easy',
              xp: 35,
              instructions: 'Объявите статический стрелочный метод Square: static int Square(int x) => x * x;. Вызовите его для числа 9 и выведите результат.',
              theorySnippet: `// Компактная форма однострочных методов в C#:
static int DoubleValue(int x) => x * 2;`,
              initialCode: `using System;

class Program
{
    // Объявите static int Square(int x) => ...
    
    static void Main()
    {
        Console.WriteLine(Square(9));
    }
}`,
              solutionCode: `using System;

class Program
{
    static int Square(int x) => x * x;

    static void Main()
    {
        Console.WriteLine(Square(9));
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит 81 для квадрата 9',
                  expectedOutput: '81'
                }
              ],
              hints: [
                'static int Square(int x) => x * x;'
              ]
            },
            {
              id: 'task-4-2-3',
              lessonId: 'les-4-2',
              title: 'Квиз: Отличие модификатора out от ref',
              type: 'quiz',
              difficulty: 'medium',
              xp: 25,
              instructions: 'Какое обязательное требование компилятор предъявляет к параметру с модификатором out?',
              quizOptions: [
                {
                  id: 'q1',
                  text: 'Метод обязан присвоить значение out-параметру до своего завершения',
                  isCorrect: true,
                  explanation: 'Верно! out-параметр рассматривается как неинициализированный на входе, и метод гарантирует его инициализацию до return.'
                },
                {
                  id: 'q2',
                  text: 'Переменная для out-параметра обязана быть инициализирована до вызова метода',
                  isCorrect: false,
                  explanation: 'Это требование для ref, а не для out.'
                },
                {
                  id: 'q3',
                  text: 'out можно использовать только с целочисленными типами данных',
                  isCorrect: false,
                  explanation: 'out поддерживается для любых типов, включая ссылочные и структуры.'
                }
              ],
              hints: ['Подумайте о гарантиях внутри тела вызываемого метода']
            }
          ]
        }
      ]
    },

    // ==========================================
    // МОДУЛЬ 5: МАССИВЫ И СТРОКИ
    // ==========================================
    {
      id: 'mod-5',
      courseId: 'csharp-foundations',
      title: 'Модуль 5: Массивы и работа со строками',
      orderIndex: 5,
      description: 'Одномерные массивы, цикл foreach, современные индексы ^1 и срезы .., методы строк и класс StringBuilder.',
      iconName: 'Layers',
      lessons: [
        {
          id: 'les-5-1',
          moduleId: 'mod-5',
          title: '5.1 Одномерные массивы и цикл foreach',
          slug: 'arrays-basics',
          orderIndex: 1,
          description: 'Фиксированные массивы, обход элементов и поиск экстремумов.',
          estimatedMinutes: 20,
          tasks: [
            {
              id: 'task-5-1-1',
              lessonId: 'les-5-1',
              title: 'Поиск максимального числа в массиве',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 45,
              instructions: 'Дан массив чисел int[] numbers = { 14, 88, 3, 92, 45, 60 };. С помощью цикла foreach найдите максимальный элемент и выведите его в консоль.',
              theorySnippet: `int max = numbers[0];
foreach (int item in numbers)
{
    if (item > max) max = item;
}`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        int[] numbers = { 14, 88, 3, 92, 45, 60 };
        int max = numbers[0];
        
        // Найдите максимум в цикле foreach:
        
        Console.WriteLine(max);
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        int[] numbers = { 14, 88, 3, 92, 45, 60 };
        int max = numbers[0];
        foreach (int item in numbers)
        {
            if (item > max)
            {
                max = item;
            }
        }
        Console.WriteLine(max);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит 92 как максимум',
                  expectedOutput: '92'
                }
              ],
              hints: [
                'foreach (int item in numbers) { if (item > max) max = item; }'
              ]
            },
            {
              id: 'task-5-1-2',
              lessonId: 'les-5-1',
              title: 'Индексация с конца (^1) в современном C#',
              type: 'code_challenge',
              difficulty: 'easy',
              xp: 35,
              instructions: 'Дан массив строк string[] fruits = { "Яблоко", "Банан", "Апельсин", "Манго" };. Используя современный оператор индекса с конца ^1, получите последний элемент и выведите его.',
              theorySnippet: `// Оператор ^ отсчитывает позицию с конца коллекции:
// ^1 — последний элемент, ^2 — предпоследний:
string last = array[^1];`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        string[] fruits = { "Яблоко", "Банан", "Апельсин", "Манго" };
        // Выведите последний элемент через ^1:
        
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        string[] fruits = { "Яблоко", "Банан", "Апельсин", "Манго" };
        Console.WriteLine(fruits[^1]);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Манго"',
                  expectedOutput: 'Манго'
                }
              ],
              hints: [
                'Console.WriteLine(fruits[^1]);'
              ]
            },
            {
              id: 'task-5-1-3',
              lessonId: 'les-5-1',
              title: 'Квиз: Массивы в управляемой памяти CLR',
              type: 'quiz',
              difficulty: 'easy',
              xp: 20,
              instructions: 'К какому типу данных (значимый или ссылочный) относится массив `int[]` в C#?',
              quizOptions: [
                {
                  id: 'q1',
                  text: 'Ссылочный тип (Reference Type), выделяется в управляемой куче (Managed Heap)',
                  isCorrect: true,
                  explanation: 'Именно так! Даже массив примитивов int[] является ссылочным типом (наследником System.Array) и размещается в куче.'
                },
                {
                  id: 'q2',
                  text: 'Значимый тип (Value Type), размещается исключительно на стеке потока',
                  isCorrect: false,
                  explanation: 'Массивы в .NET всегда размещаются в куче (за исключением stackalloc).'
                },
                {
                  id: 'q3',
                  text: 'Динамический неуправляемый указатель',
                  isCorrect: false,
                  explanation: 'Массивы — безопасные управляемые объекты CLR.'
                }
              ],
              hints: ['Все наследники System.Array в C# — ссылочные типы']
            }
          ]
        },
        {
          id: 'les-5-2',
          moduleId: 'mod-5',
          title: '5.2 Строки и класс StringBuilder',
          slug: 'strings-and-builder',
          orderIndex: 2,
          description: 'Методы Split, Trim, неизменяемость строк и конкатенация через StringBuilder.',
          estimatedMinutes: 20,
          tasks: [
            {
              id: 'task-5-2-1',
              lessonId: 'les-5-2',
              title: 'Разделение строки через string.Split()',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 40,
              instructions: 'Дана строка string csv = "C#,Java,Python,TypeScript";. Разбейте её на массив языков с помощью csv.Split(\',\') и выведите количество языков: $"Всего языков: {languages.Length}".',
              theorySnippet: `string raw = "один,два,три";
string[] parts = raw.Split(',');
Console.WriteLine(parts.Length);`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        string csv = "C#,Java,Python,TypeScript";
        // Разбейте строку и выведите длину:
        
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        string csv = "C#,Java,Python,TypeScript";
        string[] languages = csv.Split(',');
        Console.WriteLine($"Всего языков: {languages.Length}");
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Всего языков: 4"',
                  expectedOutput: 'Всего языков: 4'
                }
              ],
              hints: [
                'string[] languages = csv.Split(\',\');',
                'Console.WriteLine($"Всего языков: {languages.Length}");'
              ]
            },
            {
              id: 'task-5-2-2',
              lessonId: 'les-5-2',
              title: 'Проверка подстроки методом Contains',
              type: 'code_challenge',
              difficulty: 'easy',
              xp: 30,
              instructions: 'Дана строка string email = "student@university.edu". Проверьте, содержит ли она домен "university.edu" с помощью метода email.Contains(). Выведите "Доступ разрешен", если содержит, и "Доступ отклонен" в противном случае.',
              theorySnippet: `if (str.Contains("needle"))
{
    // найдено
}`,
              initialCode: `using System;

class Program
{
    static void Main()
    {
        string email = "student@university.edu";
        // Проверьте подстроку university.edu:
        
    }
}`,
              solutionCode: `using System;

class Program
{
    static void Main()
    {
        string email = "student@university.edu";
        if (email.Contains("university.edu"))
        {
            Console.WriteLine("Доступ разрешен");
        }
        else
        {
            Console.WriteLine("Доступ отклонен");
        }
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Доступ разрешен"',
                  expectedOutput: 'Доступ разрешен'
                }
              ],
              hints: [
                'if (email.Contains("university.edu")) Console.WriteLine("Доступ разрешен");'
              ]
            },
            {
              id: 'task-5-2-3',
              lessonId: 'les-5-2',
              title: 'Квиз: Неизменяемость (Immutability) строк',
              type: 'quiz',
              difficulty: 'medium',
              xp: 25,
              instructions: 'Почему в C# не рекомендуется выполнять многократное объединение строк (string += ...) в длинных циклах?',
              quizOptions: [
                {
                  id: 'q1',
                  text: 'Строки неизменяемы: каждая операция += выделяет новый строковый объект в куче и нагружает сборщик мусора (GC)',
                  isCorrect: true,
                  explanation: 'Совершенно верно! Для массовых манипуляций со строками следует использовать System.Text.StringBuilder.'
                },
                {
                  id: 'q2',
                  text: 'Компилятор C# запрещает оператор += для строк в циклах',
                  isCorrect: false,
                  explanation: 'Оператор разрешен, но приводит к квадратичной деградации производительности по памяти.'
                },
                {
                  id: 'q3',
                  text: 'При использовании += строки теряют кодировку UTF-16',
                  isCorrect: false,
                  explanation: 'Кодировка не меняется, страдает только выделение памяти.'
                }
              ],
              hints: ['Подумайте о том, что происходит с памятью при каждой модификации']
            }
          ]
        }
      ]
    },

    // ==========================================
    // МОДУЛЬ 6: КОЛЛЕКЦИИ LIST<T> И DICTIONARY
    // ==========================================
    {
      id: 'mod-6',
      courseId: 'csharp-foundations',
      title: 'Модуль 6: Динамические коллекции List<T> и Dictionary',
      orderIndex: 6,
      description: 'Обобщенные коллекции из System.Collections.Generic: динамические списки List<T>, словари Dictionary<TKey, TValue> и быстрый поиск по ключу.',
      iconName: 'Layers',
      lessons: [
        {
          id: 'les-6-1',
          moduleId: 'mod-6',
          title: '6.1 Динамический список List<T>',
          slug: 'generic-lists',
          orderIndex: 1,
          description: 'Коллекция List<T>, добавление, удаление и фильтрация элементов.',
          estimatedMinutes: 20,
          tasks: [
            {
              id: 'task-6-1-1',
              lessonId: 'les-6-1',
              title: 'Добавление и фильтрация элементов в List<int>',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 50,
              instructions: 'Создайте список List<int>, инициализированный числами 15, 4, 22, 8. Посчитайте количество элементов, которые больше 10, и выведите это число.',
              theorySnippet: `using System.Collections.Generic;

List<int> numbers = new List<int> { 1, 2, 3 };
numbers.Add(10);
Console.WriteLine(numbers.Count);`,
              initialCode: `using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        List<int> numbers = new List<int> { 15, 4, 22, 8 };
        int countGreaterThan10 = 0;
        
        // Переберите коллекцию с помощью foreach:
        
        Console.WriteLine(countGreaterThan10);
    }
}`,
              solutionCode: `using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        List<int> numbers = new List<int> { 15, 4, 22, 8 };
        int countGreaterThan10 = 0;
        
        foreach (int num in numbers)
        {
            if (num > 10)
            {
                countGreaterThan10++;
            }
        }
        
        Console.WriteLine(countGreaterThan10);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит 2 (числа 15 и 22)',
                  expectedOutput: '2'
                }
              ],
              hints: [
                'Используйте foreach (var num in numbers) { if (num > 10) countGreaterThan10++; }'
              ]
            },
            {
              id: 'task-6-1-2',
              lessonId: 'les-6-1',
              title: 'Удаление элементов из List<string>',
              type: 'code_challenge',
              difficulty: 'easy',
              xp: 35,
              instructions: 'Дан список студентов List<string> students = new() { "Анна", "Петр", "Олег" };. Удалите студента "Петр" с помощью метода Remove() и выведите оставшихся студентов через запятую (String.Join(", ", students)).',
              theorySnippet: `List<string> items = new List<string> { "A", "B" };
items.Remove("B");
Console.WriteLine(string.Join(", ", items));`,
              initialCode: `using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        List<string> students = new List<string> { "Анна", "Петр", "Олег" };
        // Удалите "Петр" и выведите список:
        
    }
}`,
              solutionCode: `using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        List<string> students = new List<string> { "Анна", "Петр", "Олег" };
        students.Remove("Петр");
        Console.WriteLine(string.Join(", ", students));
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Анна, Олег"',
                  expectedOutput: 'Анна, Олег'
                }
              ],
              hints: [
                'students.Remove("Петр");',
                'Console.WriteLine(string.Join(", ", students));'
              ]
            }
          ]
        },
        {
          id: 'les-6-2',
          moduleId: 'mod-6',
          title: '6.2 Ассоциативный словарь Dictionary<TKey, TValue>',
          slug: 'dictionaries',
          orderIndex: 2,
          description: 'Хэш-таблицы, быстрый поиск O(1) и безопасное извлечение с TryGetValue.',
          estimatedMinutes: 20,
          tasks: [
            {
              id: 'task-6-2-1',
              lessonId: 'les-6-2',
              title: 'Словарь успеваемости студентов',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 50,
              instructions: 'Создайте словарь Dictionary<string, int> grades для хранения оценок студентов: "Иван" => 90, "Мария" => 95, "Олег" => 78. Выведите оценку Марии по ключу.',
              theorySnippet: `var dict = new Dictionary<string, int>
{
    ["Alice"] = 100,
    ["Bob"] = 85
};
Console.WriteLine(dict["Alice"]);`,
              initialCode: `using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        // Создайте словарь grades и выведите оценку Марии:
        
    }
}`,
              solutionCode: `using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        Dictionary<string, int> grades = new Dictionary<string, int>
        {
            { "Иван", 90 },
            { "Мария", 95 },
            { "Олег", 78 }
        };
        Console.WriteLine(grades["Мария"]);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит 95',
                  expectedOutput: '95'
                }
              ],
              hints: [
                'grades["Мария"] вернет значение 95'
              ]
            },
            {
              id: 'task-6-2-2',
              lessonId: 'les-6-2',
              title: 'Безопасный поиск через TryGetValue',
              type: 'spot_bug',
              difficulty: 'medium',
              xp: 40,
              instructions: 'В коде ниже программист обращается к несуществующему ключу dict["Сергей"], что вызывает аварийное падение программы с KeyNotFoundException. Перепишите доступ через dict.TryGetValue("Сергей", out int grade). Если не найден, выведите "Студент не найден".',
              theorySnippet: `if (dict.TryGetValue(key, out int value))
{
    Console.WriteLine(value);
}
else
{
    Console.WriteLine("Не найден");
}`,
              initialCode: `using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        Dictionary<string, int> dict = new Dictionary<string, int> { { "Иван", 80 } };
        
        // Исправьте падение KeyNotFoundException с помощью TryGetValue:
        if (dict.TryGetValue("Сергей", out int grade))
        {
            Console.WriteLine(grade);
        }
        else
        {
            Console.WriteLine("Студент не найден");
        }
    }
}`,
              solutionCode: `using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        Dictionary<string, int> dict = new Dictionary<string, int> { { "Иван", 80 } };
        if (dict.TryGetValue("Сергей", out int grade))
        {
            Console.WriteLine(grade);
        }
        else
        {
            Console.WriteLine("Студент не найден");
        }
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Студент не найден"',
                  expectedOutput: 'Студент не найден'
                }
              ],
              hints: [
                'Используйте: if (dict.TryGetValue("Сергей", out int grade))'
              ]
            }
          ]
        }
      ]
    },

    // ==========================================
    // МОДУЛЬ 7: КЛАССЫ И ОСНОВЫ ООП
    // ==========================================
    {
      id: 'mod-7',
      courseId: 'csharp-foundations',
      title: 'Модуль 7: Классы, свойства и основы ООП',
      orderIndex: 7,
      description: 'Инкапсуляция, автоматические свойства { get; set; }, конструкторы, методы экземпляра и наследование.',
      iconName: 'Box',
      lessons: [
        {
          id: 'les-7-1',
          moduleId: 'mod-7',
          title: '7.1 Классы, конструкторы и автосвойства',
          slug: 'classes-and-properties',
          orderIndex: 1,
          description: 'Проектируем сущность студента с именем, группой и баллом.',
          estimatedMinutes: 25,
          tasks: [
            {
              id: 'task-7-1-1',
              lessonId: 'les-7-1',
              title: 'Класс Student и конструктор',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 60,
              instructions: 'Создайте экземпляр класса Student с именем "Дмитрий" и баллом 95. Вызовите метод student.PrintInfo(), чтобы вывести информацию в консоль.',
              theorySnippet: `public class Student
{
    public string Name { get; set; }
    public int Grade { get; set; }

    public Student(string name, int grade)
    {
        Name = name;
        Grade = grade;
    }

    public void PrintInfo() => Console.WriteLine($"Студент: {Name}, Балл: {Grade}");
}`,
              initialCode: `using System;

public class Student
{
    public string Name { get; set; }
    public int Grade { get; set; }

    public Student(string name, int grade)
    {
        Name = name;
        Grade = grade;
    }

    public void PrintInfo()
    {
        Console.WriteLine($"Студент: {Name}, Балл: {Grade}");
    }
}

class Program
{
    static void Main()
    {
        // Создайте объект Student с именем "Дмитрий" и баллом 95:
        // Вызовите метод PrintInfo()
        
    }
}`,
              solutionCode: `using System;

public class Student
{
    public string Name { get; set; }
    public int Grade { get; set; }

    public Student(string name, int grade)
    {
        Name = name;
        Grade = grade;
    }

    public void PrintInfo()
    {
        Console.WriteLine($"Студент: {Name}, Балл: {Grade}");
    }
}

class Program
{
    static void Main()
    {
        Student student = new Student("Дмитрий", 95);
        student.PrintInfo();
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Студент: Дмитрий, Балл: 95"',
                  expectedOutput: 'Студент: Дмитрий, Балл: 95'
                }
              ],
              hints: [
                'Создайте объект: var student = new Student("Дмитрий", 95);',
                'Вызовите: student.PrintInfo();'
              ]
            },
            {
              id: 'task-7-1-2',
              lessonId: 'les-7-1',
              title: 'Свойство с валидацией оценки (0..100)',
              type: 'code_challenge',
              difficulty: 'hard',
              xp: 65,
              instructions: 'В классе CourseGrade реализуйте свойство Score. В сеттере (set) добавьте проверку: если value < 0, сохранять 0, если value > 100, сохранять 100. Для значения 120 выведите Score.',
              theorySnippet: `private int _score;
public int Score
{
    get => _score;
    set => _score = value > 100 ? 100 : (value < 0 ? 0 : value);
}`,
              initialCode: `using System;

public class CourseGrade
{
    private int _score;
    public int Score
    {
        get { return _score; }
        set
        {
            // Добавьте валидацию:
            
        }
    }
}

class Program
{
    static void Main()
    {
        CourseGrade g = new CourseGrade();
        g.Score = 120;
        Console.WriteLine(g.Score);
    }
}`,
              solutionCode: `using System;

public class CourseGrade
{
    private int _score;
    public int Score
    {
        get { return _score; }
        set
        {
            if (value > 100) _score = 100;
            else if (value < 0) _score = 0;
            else _score = value;
        }
    }
}

class Program
{
    static void Main()
    {
        CourseGrade g = new CourseGrade();
        g.Score = 120;
        Console.WriteLine(g.Score);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит 100 (ограничено максимумом)',
                  expectedOutput: '100'
                }
              ],
              hints: [
                'if (value > 100) _score = 100; else _score = value;'
              ]
            },
            {
              id: 'task-7-1-3',
              lessonId: 'les-7-1',
              title: 'Квиз: Модификаторы доступа в C#',
              type: 'quiz',
              difficulty: 'easy',
              xp: 25,
              instructions: 'Какой модификатор доступа делает член класса доступным только внутри того же класса и его классов-наследников?',
              quizOptions: [
                {
                  id: 'q1',
                  text: 'protected',
                  isCorrect: true,
                  explanation: 'Верно! protected открывает доступ текущему классу и всем его производным классам.'
                },
                {
                  id: 'q2',
                  text: 'private',
                  isCorrect: false,
                  explanation: 'private закрывает доступ даже для классов-наследников.'
                },
                {
                  id: 'q3',
                  text: 'internal',
                  isCorrect: false,
                  explanation: 'internal открывает доступ любому коду в пределах той же сборки (assembly).'
                }
              ],
              hints: ['Подумайте о защите данных для наследования']
            }
          ]
        },
        {
          id: 'les-7-2',
          moduleId: 'mod-7',
          title: '7.2 Наследование и виртуальные методы',
          slug: 'inheritance-polymorphism',
          orderIndex: 2,
          description: 'Базовый класс, override, virtual и полиморфизм.',
          estimatedMinutes: 25,
          tasks: [
            {
              id: 'task-7-2-1',
              lessonId: 'les-7-2',
              title: 'Переопределение виртуального метода virtual / override',
              type: 'code_challenge',
              difficulty: 'hard',
              xp: 70,
              instructions: 'Дан базовый класс User с виртуальным методом virtual string GetRole() => "Пользователь";. Создайте класс-наследник Teacher : User и переопределите метод GetRole() с помощью ключевого слова override так, чтобы он возвращал "Преподаватель". В Main создайте User u = new Teacher(); и выведите u.GetRole().',
              theorySnippet: `public class BaseClass
{
    public virtual void SayHello() => Console.WriteLine("Base");
}

public class DerivedClass : BaseClass
{
    public override void SayHello() => Console.WriteLine("Derived");
}`,
              initialCode: `using System;

public class User
{
    public virtual string GetRole() => "Пользователь";
}

// Создайте класс Teacher : User и переопределите GetRole():


class Program
{
    static void Main()
    {
        User u = new Teacher();
        Console.WriteLine(u.GetRole());
    }
}`,
              solutionCode: `using System;

public class User
{
    public virtual string GetRole() => "Пользователь";
}

public class Teacher : User
{
    public override string GetRole() => "Преподаватель";
}

class Program
{
    static void Main()
    {
        User u = new Teacher();
        Console.WriteLine(u.GetRole());
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Преподаватель" через полиморфный вызов',
                  expectedOutput: 'Преподаватель'
                }
              ],
              hints: [
                'public class Teacher : User { public override string GetRole() => "Преподаватель"; }'
              ]
            }
          ]
        }
      ]
    },

    // ==========================================
    // МОДУЛЬ 8: LINQ (ЯЗЫК ИНТЕГРИРОВАННЫХ ЗАПРОСОВ)
    // ==========================================
    {
      id: 'mod-8',
      courseId: 'csharp-foundations',
      title: 'Модуль 8: LINQ (Language Integrated Query)',
      orderIndex: 8,
      description: 'Функциональный подход к коллекциям: Where, Select, OrderBy, Sum, Count и отложенное выполнение.',
      iconName: 'Cpu',
      lessons: [
        {
          id: 'les-8-1',
          moduleId: 'mod-8',
          title: '8.1 Фильтрация, сортировка и проекция с LINQ',
          slug: 'linq-basics',
          orderIndex: 1,
          description: 'Методы расширения из System.Linq для элегантной работы со списками.',
          estimatedMinutes: 25,
          tasks: [
            {
              id: 'task-8-1-1',
              lessonId: 'les-8-1',
              title: 'Фильтрация списка с помощью .Where() и .Sum()',
              type: 'code_challenge',
              difficulty: 'hard',
              xp: 75,
              instructions: 'Дан массив чисел int[] scores = { 45, 88, 92, 60, 100, 74 }. С помощью LINQ метода .Where() отфильтруйте оценки >= 80, посчитайте их сумму через .Sum() и выведите результат.',
              theorySnippet: `using System.Linq;

int[] numbers = { 1, 2, 3, 4, 5 };
int evenSum = numbers.Where(x => x % 2 == 0).Sum();`,
              initialCode: `using System;
using System.Linq;

class Program
{
    static void Main()
    {
        int[] scores = { 45, 88, 92, 60, 100, 74 };
        
        // Используйте scores.Where(x => ...).Sum():
        int total = 0; // замените на LINQ запрос
        
        Console.WriteLine(total);
    }
}`,
              solutionCode: `using System;
using System.Linq;

class Program
{
    static void Main()
    {
        int[] scores = { 45, 88, 92, 60, 100, 74 };
        int total = scores.Where(x => x >= 80).Sum();
        Console.WriteLine(total);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Сумма оценок >= 80 (88 + 92 + 100 = 280)',
                  expectedOutput: '280'
                }
              ],
              hints: [
                'Используйте лямбда-выражение: x => x >= 80',
                'Связка: scores.Where(x => x >= 80).Sum()'
              ]
            },
            {
              id: 'task-8-1-2',
              lessonId: 'les-8-1',
              title: 'Проекция Select и сортировка OrderByDescending',
              type: 'code_challenge',
              difficulty: 'hard',
              xp: 75,
              instructions: 'Дан массив слов string[] words = { "C#", "Web", "Enterprise", "SQL" };. Используя LINQ, отсортируйте слова по убыванию их длины через .OrderByDescending(w => w.Length), возьмите первое слово (.First()) и выведите его.',
              theorySnippet: `using System.Linq;

var longest = words.OrderByDescending(w => w.Length).First();`,
              initialCode: `using System;
using System.Linq;

class Program
{
    static void Main()
    {
        string[] words = { "C#", "Web", "Enterprise", "SQL" };
        // Найдите самое длинное слово через LINQ:
        
    }
}`,
              solutionCode: `using System;
using System.Linq;

class Program
{
    static void Main()
    {
        string[] words = { "C#", "Web", "Enterprise", "SQL" };
        string longest = words.OrderByDescending(w => w.Length).First();
        Console.WriteLine(longest);
    }
}`,
              tests: [
                {
                  id: 't1',
                  description: 'Выводит "Enterprise"',
                  expectedOutput: 'Enterprise'
                }
              ],
              hints: [
                'words.OrderByDescending(w => w.Length).First()'
              ]
            },
            {
              id: 'task-8-1-3',
              lessonId: 'les-8-1',
              title: 'Квиз: Отложенное выполнение (Deferred Execution) в LINQ',
              type: 'quiz',
              difficulty: 'medium',
              xp: 30,
              instructions: 'Когда физически выполняется запрос LINQ, содержащий методы `.Where(...)` и `.Select(...)`?',
              quizOptions: [
                {
                  id: 'q1',
                  text: 'Только в момент фактической итерации (foreach, ToList, ToArray, Count, First)',
                  isCorrect: true,
                  explanation: 'Совершенно верно! LINQ использует отложенное выполнение (Deferred Execution). Запрос — это лишь план, исполняемый при запросе данных.'
                },
                {
                  id: 'q2',
                  text: 'В момент объявления переменной запроса в строке кода',
                  isCorrect: false,
                  explanation: 'В момент объявления создается объект запроса IEnumerable, но элементы еще не обрабатываются.'
                },
                {
                  id: 'q3',
                  text: 'В фоновом потоке ThreadPool сразу после компиляции',
                  isCorrect: false,
                  explanation: 'LINQ выполняется синхронно в текущем потоке при итерации.'
                }
              ],
              hints: ['Подумайте о том, когда вызывается метод ToList() или оператор foreach']
            }
          ]
        }
      ]
    }
  ]
};

export const sampleStudents = [
  {
    id: 'stud-1',
    fullName: 'Алексей Смирнов',
    email: 'a.smirnov@university.edu',
    role: 'student' as const,
    groupName: 'ИТ-301',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    currentStreakDays: 5,
    totalXp: 340,
    isOnline: true,
    currentTaskId: 'task-2-1-2',
    currentTaskTitle: 'Современные Switch Expressions в C#',
    currentLessonTitle: '2.1 Ветвления if / else if / else',
    status: 'active' as const,
    attemptsOnCurrentTask: 2,
    timeOnCurrentTaskMinutes: 8,
    needsHelp: false,
    stuckMinutes: 8,
    lastActiveAt: '1 минуту назад',
    // Полная телеметрия и прокторинг
    tabSwitchCount: 1,
    totalAwaySeconds: 14,
    pasteCount: 0,
    pastedCharsTotal: 0,
    isCurrentlyAway: false,
    totalErrorsCount: 3,
    totalAttemptsCount: 9,
    completedTasksCount: 6,
    lastCodeSnippet: `string role = "teacher";\nstring title = role switch {\n    "admin" => "Администратор",\n    "teacher" => "Преподаватель",\n    _ => "Студент"\n};\nConsole.WriteLine(title);`,
    lastErrorMessage: undefined,
    eventsLog: [
      { id: 'ev-1-1', type: 'success' as const, timestamp: '10:24:10', details: 'Успешно решено задание 2.1.1', taskTitle: 'Проверка студенческой оценки' },
      { id: 'ev-1-2', type: 'tab_switch_away' as const, timestamp: '10:21:40', details: 'Свернул окно (переключился в браузер с документацией Microsoft Docs)' },
      { id: 'ev-1-3', type: 'tab_switch_back' as const, timestamp: '10:21:54', details: 'Возврат в окно задания', durationSeconds: 14 },
      { id: 'ev-1-4', type: 'error' as const, timestamp: '10:20:12', details: 'CS1002: ; expected на строке 7', taskTitle: 'Switch Expressions' }
    ]
  },
  {
    id: 'stud-2',
    fullName: 'Екатерина Васильева',
    email: 'e.vasilieva@university.edu',
    role: 'student' as const,
    groupName: 'ИТ-301',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    currentStreakDays: 12,
    totalXp: 620,
    isOnline: true,
    currentTaskId: 'task-3-1-1',
    currentTaskTitle: 'Сумма четных чисел от 1 до 10',
    currentLessonTitle: '3.1 Цикл for и счетчики',
    status: 'active' as const,
    attemptsOnCurrentTask: 1,
    timeOnCurrentTaskMinutes: 4,
    needsHelp: false,
    stuckMinutes: 0,
    lastActiveAt: 'В сети',
    // Полная телеметрия
    tabSwitchCount: 0,
    totalAwaySeconds: 0,
    pasteCount: 0,
    pastedCharsTotal: 0,
    isCurrentlyAway: false,
    totalErrorsCount: 1,
    totalAttemptsCount: 9,
    completedTasksCount: 8,
    lastCodeSnippet: `int sum = 0;\nfor (int i = 1; i <= 10; i++) {\n    if (i % 2 == 0) sum += i;\n}\nConsole.WriteLine(sum);`,
    eventsLog: [
      { id: 'ev-2-1', type: 'success' as const, timestamp: '10:25:00', details: 'Решено 8 заданий без единого переключения вкладок' }
    ]
  },
  {
    id: 'stud-3',
    fullName: 'Михаил Ковалев',
    email: 'm.kovalev@university.edu',
    role: 'student' as const,
    groupName: 'ИТ-301',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    currentStreakDays: 2,
    totalXp: 180,
    isOnline: true,
    currentTaskId: 'task-1-2-2',
    currentTaskTitle: 'Поиск ошибки: Целочисленное деление',
    currentLessonTitle: '1.2 Типы данных и преобразования',
    status: 'stuck' as const,
    attemptsOnCurrentTask: 4,
    timeOnCurrentTaskMinutes: 14,
    needsHelp: true,
    helpMessage: 'Не понимаю, почему 7 / 2 дает 3, если переменная объявлена как double result',
    stuckMinutes: 14,
    lastActiveAt: 'Застрял (3 ошибки компиляции)',
    // Полная телеметрия
    tabSwitchCount: 5,
    totalAwaySeconds: 220,
    pasteCount: 2,
    pastedCharsTotal: 90,
    isCurrentlyAway: false,
    totalErrorsCount: 6,
    totalAttemptsCount: 10,
    completedTasksCount: 2,
    lastCodeSnippet: `int a = 7;\nint b = 2;\ndouble result = a / b; // Ошибка: деление int на int\nConsole.WriteLine(result);`,
    lastErrorMessage: 'Тест не пройден: Ожидался вывод 3.5, получено 3. Проверьте явное приведение (double)a / b',
    eventsLog: [
      { id: 'ev-3-1', type: 'error' as const, timestamp: '10:23:45', details: 'Тест не пройден: деление int / int вернуло 3' },
      { id: 'ev-3-2', type: 'tab_switch_away' as const, timestamp: '10:21:10', details: 'Переключение в браузер (поиск решения)' },
      { id: 'ev-3-3', type: 'tab_switch_back' as const, timestamp: '10:22:40', details: 'Возврат на вкладку', durationSeconds: 90 },
      { id: 'ev-3-4', type: 'code_paste' as const, timestamp: '10:22:50', details: 'Вставка фрагмента кода из буфера обмена (45 символов)', charsPasted: 45 }
    ]
  },
  {
    id: 'stud-4',
    fullName: 'София Морозова',
    email: 's.morozova@university.edu',
    role: 'student' as const,
    groupName: 'ИТ-301',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    currentStreakDays: 7,
    totalXp: 490,
    isOnline: true,
    currentTaskId: 'task-2-2-1',
    currentTaskTitle: 'Определение дня недели по номеру',
    currentLessonTitle: '2.2 Pattern Matching и сопоставление с шаблоном',
    status: 'completed_step' as const,
    attemptsOnCurrentTask: 1,
    timeOnCurrentTaskMinutes: 5,
    needsHelp: false,
    stuckMinutes: 2,
    lastActiveAt: 'В сети',
    // Полная телеметрия
    tabSwitchCount: 2,
    totalAwaySeconds: 28,
    pasteCount: 0,
    pastedCharsTotal: 0,
    isCurrentlyAway: false,
    totalErrorsCount: 2,
    totalAttemptsCount: 9,
    completedTasksCount: 7,
    lastCodeSnippet: `int day = 3;\nstring dayName = day switch {\n    1 => "Понедельник",\n    2 => "Вторник",\n    3 => "Среда",\n    6 or 7 => "Выходной",\n    _ => "Некорректный день"\n};\nConsole.WriteLine(dayName);`,
    eventsLog: [
      { id: 'ev-4-1', type: 'success' as const, timestamp: '10:24:50', details: 'Сдана задача 2.2.1 с первой попытки' },
      { id: 'ev-4-2', type: 'tab_switch_away' as const, timestamp: '10:19:10', details: 'Свернула окно' },
      { id: 'ev-4-3', type: 'tab_switch_back' as const, timestamp: '10:19:38', details: 'Возврат в окно задания', durationSeconds: 28 }
    ]
  },
  {
    id: 'stud-5',
    fullName: 'Даниил Орлов',
    email: 'd.orlov@university.edu',
    role: 'student' as const,
    groupName: 'ИТ-301',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    currentStreakDays: 0,
    totalXp: 95,
    isOnline: false,
    currentTaskId: 'task-1-1-2',
    currentTaskTitle: 'Интерполяция строк ($)',
    currentLessonTitle: '1.1 Первая программа и вывод в консоль',
    status: 'idle' as const,
    attemptsOnCurrentTask: 3,
    timeOnCurrentTaskMinutes: 25,
    needsHelp: false,
    stuckMinutes: 0,
    lastActiveAt: 'Был 25 минут назад',
    // Полная телеметрия (Подозрительная активность / Античит флаг)
    tabSwitchCount: 9,
    totalAwaySeconds: 380,
    pasteCount: 4,
    pastedCharsTotal: 260,
    isCurrentlyAway: true,
    totalErrorsCount: 5,
    totalAttemptsCount: 6,
    completedTasksCount: 1,
    lastCodeSnippet: `string language = "C#";\nConsole.WriteLine($"Я изучаю {language} в аудитории!");`,
    lastErrorMessage: 'CS1002: ; expected на строке 4',
    eventsLog: [
      { id: 'ev-5-1', type: 'code_paste' as const, timestamp: '10:05:12', details: '⚠️ Массовая вставка кода из буфера обмена (140 символов целиком)', charsPasted: 140 },
      { id: 'ev-5-2', type: 'tab_switch_away' as const, timestamp: '10:04:10', details: '⚠️ Длительный уход с вкладки (отсутствовал 3 мин 20 сек)' },
      { id: 'ev-5-3', type: 'tab_switch_back' as const, timestamp: '10:07:30', details: 'Возврат во вкладку', durationSeconds: 200 }
    ]
  },
  {
    id: 'stud-6',
    fullName: 'Анна Павлова',
    email: 'a.pavlova@university.edu',
    role: 'student' as const,
    groupName: 'ИТ-301',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    currentStreakDays: 9,
    totalXp: 780,
    isOnline: true,
    currentTaskId: 'task-4-1-1',
    currentTaskTitle: 'Статический метод расчета налога CalculateTax',
    currentLessonTitle: '4.1 Объявление методов и возврат значений',
    status: 'active' as const,
    attemptsOnCurrentTask: 1,
    timeOnCurrentTaskMinutes: 3,
    needsHelp: false,
    stuckMinutes: 0,
    lastActiveAt: 'В сети',
    // Полная телеметрия
    tabSwitchCount: 1,
    totalAwaySeconds: 12,
    pasteCount: 0,
    pastedCharsTotal: 0,
    isCurrentlyAway: false,
    totalErrorsCount: 2,
    totalAttemptsCount: 13,
    completedTasksCount: 11,
    lastCodeSnippet: `public static double CalculateTax(double income) => income * 0.13;\nstatic void Main() {\n    double tax = CalculateTax(100000);\n    Console.WriteLine(tax);\n}`,
    eventsLog: [
      { id: 'ev-6-1', type: 'success' as const, timestamp: '10:24:00', details: 'Успешно решено 11 заданий (лидер группы)' }
    ]
  }
];

export const teacherProfile = {
  id: 'teacher-1',
  fullName: 'Проф. Виктор Сергеевич Волков',
  email: 'v.volkov@university.edu',
  role: 'teacher' as const,
  groupName: 'Кафедра ПМИ',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  currentStreakDays: 45,
  totalXp: 12500
};
