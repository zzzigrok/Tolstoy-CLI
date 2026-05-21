export const navItems = [
  { href: "#about", label: "О проекте" },
  { href: "#developer", label: "Разработчик" },
  { href: "#philosophy", label: "Философия" },
  { href: "#architecture", label: "Архитектура" },
  { href: "#corpus", label: "Корпус" }
];

export const architectureCards = [
  {
    title: "GQA + RoPE",
    text: "Grouped Query Attention и позиционное кодирование для длинного контекста без лишней нагрузки на память.",
    metric: "attention core"
  },
  {
    title: "Sparse MoE",
    text: "Эксперты активируются выборочно, поэтому модель масштабирует знания без пропорционального роста вычислений.",
    metric: "8 experts / top-2"
  },
  {
    title: "GaLore и Muon",
    text: "Оптимизаторы снижают стоимость обучения и стабилизируют большие матрицы на потребительских GPU.",
    metric: "до 80% VRAM"
  },
  {
    title: "XQuant KV-cache",
    text: "INT8-кэш ключей и значений помогает удерживать длинный контекст при ограниченной видеопамяти.",
    metric: "4x context"
  },
  {
    title: "BPE tokenizer",
    text: "Токенизатор адаптирован под кириллицу и художественный русский текст, а не под случайный интернет-шум.",
    metric: "Trie + arrays"
  }
];

export const corpusAuthors = [
  {
    name: "Лев Толстой",
    works: "Война и мир, Анна Каренина, Воскресение",
    tokens: "~18M tokens",
    progress: 100,
    tone: "cyan"
  },
  {
    name: "Ф. Достоевский",
    works: "Преступление и наказание, Идиот, Бесы",
    tokens: "~15M tokens",
    progress: 85,
    tone: "violet"
  },
  {
    name: "М. Булгаков",
    works: "Мастер и Маргарита, Белая гвардия",
    tokens: "~8M tokens",
    progress: 50,
    tone: "rose"
  },
  {
    name: "В. Набоков",
    works: "Дар, Лолита, Защита Лужина",
    tokens: "~6M tokens",
    progress: 40,
    tone: "blue"
  }
];

export const philosophyPoints = [
  {
    title: "Понимать, а не только запускать",
    text: "Проект показывает внутреннюю механику LLM: токены, attention, оптимизаторы, кэш и обучение."
  },
  {
    title: "Русский язык как полноценная среда",
    text: "Корпус и инструменты собраны вокруг кириллицы, классической прозы и практики локального обучения."
  },
  {
    title: "Исследовательская честность",
    text: "Лендинг не обещает магию. Он приглашает разобрать модель на понятные инженерные слои."
  }
];
