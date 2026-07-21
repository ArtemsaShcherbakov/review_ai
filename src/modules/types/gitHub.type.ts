export interface IPullRequest {
  /** Уникальный SHA-хеш последнего коммита в изменённом файле (полезно для кэширования) */
  sha: string;

  /** Имя файла (с путём относительно корня репозитория) */
  filename: string;

  /** Статус изменения: "added", "modified", "removed", "renamed", "copied", "changed" */
  status: string;

  /** Количество добавленных строк (в diff) */
  additions: number;

  /** Количество удалённых строк (в diff) */
  deletions: number;

  /** Общее количество изменённых строк (additions + deletions) */
  changes: number;

  /** Ссылка на файл на GitHub (в интерфейсе, для человека) */
  blob_url: string;

  /** Прямая ссылка на «сырое» содержимое файла *после* изменений (используйте, если нужен полный контекст) */
  raw_url: string;

  /** API-ссылка для получения содержимого файла (альтернатива raw_url, но требует авторизации) */
  contents_url: string;

  /** Unified diff в формате патча – самое главное поле для ревью */
  patch: string;
}

export type PullRequestListType = IPullRequest[];
