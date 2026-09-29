import type { Course } from '../types';


export const initialCsharpCourse: Course = {
  id: 'csharp-foundations',
  title: 'C# Pro: От Базового Синтаксиса до ООП и LINQ',
  language: 'C#',
  description: 'Академический интерактивный курс для аудиторных занятий. Никакой воды — реальный код, компиляторные проверки и строгая практика.',
  version: '12.0 (.NET 8)',
  modules: [
    {
      id: 'mod-1',
      courseId: 'csharp-foundations',
      title: 'Модуль 1: Базовый синтаксис, переменные и типы данных',
      orderIndex: 1,
      description: 'Точка входа в программу, строгая типизация, консольный ввод/вывод и интерполяция строк.',
      iconName: 'Terminal',
      lessons: [
        {
          id: 'les-1-1',
          moduleId: 'mod-1',
          title: '1.1 Первая программа и вывод в консоль',
          slug: 'first-program',
          orderIndex: 1,
          description: 'Изучаем структуру программы, Console.WriteLine и интерполяцию строк ($"...").',
          estimatedMinutes: 10,
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
            }
          ]
        },
        {
          id: 'les-1-2',
          moduleId: 'mod-1',
          title: '1.2 Типы данных и преобразования',
          slug: 'data-types-conversions',
          orderIndex: 2,
          description: 'Целочисленные, вещественные типы, строки, bool, приведение типов и безопасный парсинг.',
          estimatedMinutes: 15,
          tasks: [
            {
              id: 'task-1-2-1',
              lessonId: 'les-1-2',
              title: 'Парсинг строки в целое число',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 35,
              instructions: 'Дана строковая переменная input = "42". Преобразуйте её в целочисленную переменную score с помощью int.Parse() и прибавьте к ней 8. Выведите результат.',
              theorySnippet: `// Для преобразования строки в целое число используется int.Parse() или int.TryParse():
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
            }
          ]
        }
      ]
    },
    {
      id: 'mod-2',
      courseId: 'csharp-foundations',
      title: 'Модуль 2: Управляющие конструкции и циклы',
      orderIndex: 2,
      description: 'Условия if-else, switch выражения в C# 9+, циклы for, while и break/continue.',
      iconName: 'GitBranch',
      lessons: [
        {
          id: 'les-2-1',
          moduleId: 'mod-2',
          title: '2.1 Ветвления if / else if / else',
          slug: 'conditionals',
          orderIndex: 1,
          description: 'Принятие решений в коде на основе булевых выражений.',
          estimatedMinutes: 15,
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
            }
          ]
        },
        {
          id: 'les-2-2',
          moduleId: 'mod-2',
          title: '2.2 Циклы for и while',
          slug: 'loops',
          orderIndex: 2,
          description: 'Многократное повторение операций, счетчики, суммирование.',
          estimatedMinutes: 15,
          tasks: [
            {
              id: 'task-2-2-1',
              lessonId: 'les-2-2',
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
            }
          ]
        }
      ]
    },
    {
      id: 'mod-3',
      courseId: 'csharp-foundations',
      title: 'Модуль 3: Массивы и обобщенные коллекции List<T>',
      orderIndex: 3,
      description: 'Хранение наборов данных, перебор через foreach, работа с динамическими списками.',
      iconName: 'Layers',
      lessons: [
        {
          id: 'les-3-1',
          moduleId: 'mod-3',
          title: '3.1 Динамический список List<T>',
          slug: 'generic-lists',
          orderIndex: 1,
          description: 'Коллекция List<T> из пространства имен System.Collections.Generic.',
          estimatedMinutes: 20,
          tasks: [
            {
              id: 'task-3-1-1',
              lessonId: 'les-3-1',
              title: 'Добавление и фильтрация элементов в List<int>',
              type: 'code_challenge',
              difficulty: 'medium',
              xp: 50,
              instructions: 'Создайте список List<int>, добавьте числа 15, 4, 22, 8. Посчитайте количество элементов, которые больше 10, и выведите это число.',
              theorySnippet: `using System.Collections.Generic;

List<int> numbers = new List<int>();
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
            }
          ]
        }
      ]
    },
    {
      id: 'mod-4',
      courseId: 'csharp-foundations',
      title: 'Модуль 4: Классы, свойства и основы ООП',
      orderIndex: 4,
      description: 'Инкапсуляция, автоматические свойства { get; set; }, конструкторы и создание экземпляров.',
      iconName: 'Box',
      lessons: [
        {
          id: 'les-4-1',
          moduleId: 'mod-4',
          title: '4.1 Создание класса Student и свойства',
          slug: 'classes-and-properties',
          orderIndex: 1,
          description: 'Проектируем сущность студента с именем, группой и баллом.',
          estimatedMinutes: 25,
          tasks: [
            {
              id: 'task-4-1-1',
              lessonId: 'les-4-1',
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
            }
          ]
        }
      ]
    },
    {
      id: 'mod-5',
      courseId: 'csharp-foundations',
      title: 'Модуль 5: LINQ (Language Integrated Query)',
      orderIndex: 5,
      description: 'Функциональный подход к коллекциям: Where, Select, OrderBy, Sum и Count.',
      iconName: 'Cpu',
      lessons: [
        {
          id: 'les-5-1',
          moduleId: 'mod-5',
          title: '5.1 Фильтрация и проекция с LINQ',
          slug: 'linq-basics',
          orderIndex: 1,
          description: 'Методы расширения из System.Linq для элегантной работы со списками.',
          estimatedMinutes: 20,
          tasks: [
            {
              id: 'task-5-1-1',
              lessonId: 'les-5-1',
              title: 'Фильтрация списка с помощью .Where()',
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
    stuckMinutes: 8,
    lastActiveAt: '1 минуту назад'
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
    stuckMinutes: 0,
    lastActiveAt: 'В сети'
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
    stuckMinutes: 14, // Teacher will see: student is stuck!
    lastActiveAt: 'Застрял (3 ошибки компиляции)'
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
    stuckMinutes: 2,
    lastActiveAt: 'В сети'
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
    stuckMinutes: 0,
    lastActiveAt: 'Был 25 минут назад'
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
    stuckMinutes: 0,
    lastActiveAt: 'В сети'
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
