export const jsonParse = <T>(value: string): T | null => {
  try {
    return value ? JSON.parse(value) : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error('Ошибка парсинга content:', message);

    return null;
  }
};
