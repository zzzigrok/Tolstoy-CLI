export const navItems = [
  { href: "#about", label: "О проекте" },
  { href: "#developer", label: "Разработчик" },
  { href: "#philosophy", label: "Философия" },
  { href: "#architecture", label: "Архитектура" },
  { href: "#corpus", label: "Корпус" },
  { href: "#docs", label: "Документация" }
];

export const architectureCards = [
  {
    title: "Mixture of Experts (MoE)",
    text: "Интеллектуальная маршрутизация токенов через специализированные экспертные слои. Позволяет радикально масштабировать количество параметров модели без линейного роста вычислительных затрат на инференс.",
    metric: "8 experts / top-2"
  },
  {
    title: "Grouped Query Attention",
    text: "Группировка запросов для использования общих ключей и значений. Снижает потребление VRAM.",
    metric: "attention core"
  },
  {
    title: "RoPE Embeddings",
    text: "Ротационное позиционное кодирование для безупречной экстраполяции длины контекста.",
    metric: "extrapolation"
  },
  {
    title: "Speculative Decoding",
    text: "Двухэтапная генерация: маленькая модель делает драфты, большая — параллельно их валидирует.",
    metric: "draft + validation"
  },
  {
    title: "Квантование (xQuant)",
    text: "Динамическое снижение разрядности весов до 8-bit/4-bit для запуска на обычных GPU.",
    metric: "8-bit / 4-bit weights"
  },
  {
    title: "RMSNorm & SwiGLU",
    text: "Связка Root Mean Square Normalization и функции активации Swish-Gated Linear Unit. Стандарт де-факто для современных архитектур уровня LLaMA, обеспечивающий стабильную и быструю сходимость градиентов.",
    metric: "stability core"
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
    tone: "purple"
  },
  {
    name: "М. Булгаков",
    works: "Мастер и Маргарита, Белая гвардия",
    tokens: "~8M tokens",
    progress: 50,
    tone: "pink"
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
    title: "Практическое познание",
    text: "Изучение сложных концепций, таких как векторные вложения и механизмы внимания, происходит наиболее эффективно, когда вы пишете код своими руками, а не просто используете API."
  },
  {
    title: "Культурный синтез",
    text: "Используя величайшие произведения русской литературы для обучения, мы соединяем гуманитарную глубину и смыслы с холодной математической элегантностью архитектуры трансформеров."
  }
];

export const statItems = [
  { value: "0%", label: "Скрытой магии" },
  { value: "100%", label: "Читаемый код" },
  { value: "PyTorch", label: "В основе" },
  { value: "CLI", label: "Удобный интерфейс" }
];
