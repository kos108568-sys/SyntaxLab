export function normalizeOutput(value) {
  return value.replace(/\r\n/g, '\n').trimEnd();
}

export function gradeOutput(execution, tests) {
  if (!tests?.length || tests.some(test => typeof test.expectedOutput !== 'string')) {
    throw new Error('Для задания не настроены тесты. Обратитесь к преподавателю.');
  }
  const details = tests.map(test => ({
    testId: test.id,
    description: test.description,
    passed: execution.exitCode === 0 && normalizeOutput(execution.output) === normalizeOutput(test.expectedOutput),
  }));
  const success = details.every(test => test.passed);
  return {
    success, output: execution.output, details,
    testsPassed: details.filter(test => test.passed).length,
    totalTests: details.length,
    errorMessage: success ? undefined : execution.error || 'Вывод программы не совпадает с ожидаемым.',
  };
}
