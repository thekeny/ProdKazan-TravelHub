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
├── api/             # HTTP-клиент и запросы к бэкенду
│   └── client.ts    # Настроенный инстанс ky и типизированные методы
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

## Работа с API (`src/api/client.ts`)

Клиент построен поверх библиотеки [`ky`](https://github.com/sindresorhus/ky).

### Использование типизированных хелперов

```ts
import { get, post, put, patch, del } from "@/api/client";

// GET
const users = await get<User[]>("/users");

// POST
const newUser = await post<User, CreateUserDto>("/users", {
  name: "John",
});

// PUT / PATCH
const updated = await patch<User>("/users/1", { name: "Jane" });

// DELETE
await del("/users/1");
```

### Использование напрямую через инстанс `api`

```ts
import { api } from "@/api/client";

const data = await api.get("users").json<User[]>();
```

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