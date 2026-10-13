# Next Template

## Быстрый старт

```sh
npm i
npm run dev
```

---

## Структура проекта

```text
src/
├── api/                  # HTTP-слой
│   ├── hey-api.ts        # конфиг сгенерированного клиента (baseUrl, таймаут, ретраи)
│   └── generated/        # автогенерированный SDK (не редактировать вручную)
├── app/             # App Router (страницы, layout, роутинг)
├── components/      # React-компоненты
│   ├── ui/          # Базовые UI-компоненты (кнопки, инпуты и т.д.)
│   ├── layouts/     # Лайауты
│   ├── providers/   # Провайдеры для обертки
│   └── [page]/      # Компоненты под конкретные страницы (landing, dashboard и др.)
├── configs/         # Конфигурации, пути и константы
│   ├── paths/       # Пути страниц, ссылки, пути к изображениям
│   ├── consts/      # Константы (API URL и др.)
│   └── types/       # Общие типы конфигураций
├── hooks/           # Кастомные React-хуки
└── lib/             # Вспомогательные утилиты (cn, форматтеры и т.д.)
```

### Описание основных директорий

- **`src/configs`** — выносятся ссылки, роуты, статические пути и константы. Нужно для быстрого изменения в одном месте, масштабирования и чтобы не хардкодить/дублировать строки по всему проекту.
- **`src/components`** — под каждую страницу создаётся своя папка с её компонентами (например, `landing/`, `dashboard/`), а переиспользуемые атомарные элементы хранятся в `ui/`.
- **`src/api`** — слой работы с сетевыми запросами.
- **`src/hooks`** — переиспользуемые кастомные React-хуки.
- **`src/lib`** — утилиты общего назначения (хелперы, `utils.ts` с `cn` и т.д.).

---

## Работа с API (автогенерированный SDK)

SDK генерируется из OpenAPI-спеки бэкенда через [Hey API](https://heyapi.dev/) на клиенте [`ky`](https://github.com/sindresorhus/ky). Пакет `@hey-api/client-ky` встроен в `@hey-api/openapi-ts`.

### Генерация

```sh
npm run openapi
```

Спека берётся из `${NEXT_PUBLIC_API_URL}/openapi.json` (переменная `NEXT_PUBLIC_API_URL` из `.env`). Сгенерированный код лежит в `src/api/generated/` и коммитится в репозиторий. **Не редактируйте его вручную** — изменения будут перезаписаны.

Конфиг генератора — `openapi-ts.config.ts`. Настройки клиента (baseUrl, таймаут, ретраи) — в `src/api/hey-api.ts`, они берутся из `src/configs/consts/api.const.ts`.

### Использование в компонентах

```ts
import { getUsers, createUser } from "@/api/generated";
import type { User } from "@/api/generated";

// GET
const { data } = await getUsers({ query: { page: 1 } });

// POST
const { data: created } = await createUser({ body: { name: "John" } });
```

Параметры группируются по типу (`path`, `query`, `body`, `header`). Типы описываются автоматически. Для интерактивных запросов удобно оборачивать функции в TanStack Query или вызывать из Server Actions / RSC.

---

## Тестирование (Vitest)

Тесты на [Vitest](https://vitest.dev/) с окружением `jsdom`. Все тесты — в `src/tests/`, структура повторяет `src/`.

```sh
npm test          # однократный прогон
npm run test:watch # режим наблюдения
```

Пример: `src/tests/lib/utils.test.ts`. Конфиг — `vitest.config.ts`.

---

## Полезные утилиты

- **Knip** — находит мёртвый код: неиспользуемые файлы, экспорты и лишние зависимости в `package.json`.
  ```sh
  npm run knip
  ```

- **Repomix** — упаковывает кодовую базу репозитория в единый файл для удобной передачи контекста в AI/LLM.
  ```sh
  npm run repomix
  ```