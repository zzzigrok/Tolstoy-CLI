import React, { useState, useEffect, useRef } from "react";

interface TerminalLine {
  id: string;
  type: "system" | "input" | "output" | "error" | "success" | "warn" | "accent";
  content: React.ReactNode;
}

const CORUS_LIST = [
  { id: "1", name: "Lenta.ru", size: "~200 MB", tag: "Micro / Mini" },
  { id: "2", name: "Russian News", size: "~1.5 GB", tag: "Mini / Base" },
  { id: "3", name: "Wikipedia (ru)", size: "~5.0 GB", tag: "Base / Large" },
  { id: "4", name: "Taiga: Habr", size: "~500 MB", tag: "Mini" },
  { id: "5", name: "Taiga: Proza & Stihi", size: "~2.5 GB", tag: "Mini / Base" },
  { id: "6", name: "Tolstoy Heritage (Классика)", size: "~120 MB", tag: "Fine-tune SOTA" }
];

const PRESETS: Record<string, { params: string; vram: string; layers: number; d_model: number; heads: number; desc: string }> = {
  nano: { params: "5M", vram: "1-2 GB (CPU/GPU)", layers: 6, d_model: 256, heads: 4, desc: "Ультралегкая для тестов и ноутбуков" },
  mini: { params: "25M", vram: "2-4 GB", layers: 8, d_model: 512, heads: 8, desc: "Быстрое обучение базовому русскому синтаксису" },
  small: { params: "80M", vram: "4-6 GB (RTX 3060/4060)", layers: 12, d_model: 768, heads: 12, desc: "Базовые связные диалоги и эссе" },
  medium: { params: "350M", vram: "8-12 GB (RTX 3080/4070)", layers: 24, d_model: 1024, heads: 16, desc: "Глубокий литературный стиль и контекст" },
  large: { params: "1.0B", vram: "12-16 GB (GaLore enabled)", layers: 32, d_model: 2048, heads: 32, desc: "SOTA модель уровня 1B на домашней GPU" },
  xlarge: { params: "3.2B", vram: "24 GB+ (RTX 3090/4090)", layers: 40, d_model: 2560, heads: 32, desc: "Экстремальный масштаб для энтузиастов" }
};

const CHAT_RESPONSES = [
  {
    keywords: ["смысл", "жизн", "истин", "зачем"],
    author: "Лев Толстой AI",
    text: "Истинный смысл жизни открывается человеку не в умствованиях праздных, а в искренней любви к ближнему и непрестанном труде совести. Тот счастлив, кто познал бесконечное в малом и не ищет славы внешней, ибо Царство Божие внутри нас есть."
  },
  {
    keywords: ["достоевск", "преступлен", "страдан", "раскольников"],
    author: "Ф. Достоевский AI",
    text: "Страдание и боль всегда обязательны для широкого сознания и глубокого сердца. Человек есть тайна; ее надо разгадать, и ежели будешь ее разгадывать всю жизнь, то не говори, что потерял время. Я занимаюсь этой тайной, ибо хочу быть человеком."
  },
  {
    keywords: ["galore", "оптимиз", "памят", "vram", "обучен"],
    author: "Tolstoy Engine v7",
    text: "GaLore (Gradient Low-Rank Projection) раскладывает тензоры градиентов формы [M, N] через SVD-проекторы в низкий ранг r=64. Это сокращает объем состояний оптимизатора AdamW на 80% (с 16 байт на параметр до 3.2 байт) без деградации финального Loss!"
  },
  {
    keywords: ["muon", "ортогонал", "ньютон", "градиент"],
    author: "Tolstoy Engine v7",
    text: "Оптимизатор Muon поддерживает ортогональность весовых матриц с помощью 5 итераций метода Ньютона-Шульца на каждом шаге. Это позволяет обучать глубокие слои внимания без взрыва градиентов на learning rate в 3 раза выше классического."
  },
  {
    keywords: ["привет", "здравствуй", "кто ты", "что умеешь"],
    author: "Tolstoy-v7",
    text: "Приветствую! Я компактная языковая модель Tolstoy-v7 Pro. Обучаюсь на русском литературном корпусе и технических датасетах Corus. Могу симулировать слог классиков или объяснить устройство трансформеров!"
  }
];

export function CliTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll ONLY inside terminal container, never scrolling the main page
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [lines]);

  // Initial welcome message
  useEffect(() => {
    setLines([
      {
        id: "banner",
        type: "system",
        content: (
          <div className="terminal-welcome-block">
            <div className="terminal-ascii-logo">
              {`  █████████  ████████  ██       ██████   ████████  ████████  ██    ██        ██████  ██      ██
     ██     ██    ██ ██      ██    ██     ██     ██    ██   ██  ██        ██    ██ ██      ██
     ██     ██    ██ ██      ██████       ██     ██    ██    ████   █████ ██       ██      ██
     ██     ██    ██ ██           ██      ██     ██    ██     ██          ██    ██ ██      ██
     ██      ██████  ███████ ██████       ██      ██████      ██           ██████  ███████ ██ (v7 Pro)`}
            </div>
            <div className="terminal-sys-info">
              <span className="text-cyan-glow">● PyTorch 2.4.1+cu124</span> &bull;{" "}
              <span className="text-purple-glow">Device: NVIDIA GeForce RTX (12.0 GB VRAM)</span> &bull;{" "}
              <span className="text-emerald-400">GaLore & Muon: Active</span>
            </div>
            <div className="terminal-hint-text">
              Добро пожаловать в веб-эмулятор Tolstoy-CLI! Введите <span className="term-cmd-highlight">help</span> для списка команд или кликните по быстрым подсказкам ниже.
            </div>
          </div>
        )
      }
    ]);
  }, []);

  const addLine = (type: TerminalLine["type"], content: React.ReactNode) => {
    setLines((prev) => [...prev, { id: Math.random().toString(36).substring(2, 9), type, content }]);
  };

  const executeCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    // Add to input history
    addLine("input", trimmed);
    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);
    setInputVal("");

    const parts = trimmed.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === "clear" || cmd === "cls") {
      setLines([]);
      return;
    }

    if (cmd === "help" || cmd === "?") {
      addLine(
        "output",
        <div className="term-help-grid">
          <div className="term-help-row"><span className="term-cmd-key">menu</span> <span>Открыть интерактивное главное меню CLI</span></div>
          <div className="term-help-row"><span className="term-cmd-key">train [preset] [--galore]</span> <span>Запустить симуляцию обучения модели (напр. <code className="term-code-snippet">train mini --galore</code>)</span></div>
          <div className="term-help-row"><span className="term-cmd-key">chat [промпт]</span> <span>Задать вопрос нейросети в стиле Толстого или о ML</span></div>
          <div className="term-help-row"><span className="term-cmd-key">tokenize &lt;текст&gt;</span> <span>Быстро разбить фразу на BPE токены с помощью Rust BPE</span></div>
          <div className="term-help-row"><span className="term-cmd-key">preset [name]</span> <span>Показать спецификации архитектуры (nano, mini, small, large...)</span></div>
          <div className="term-help-row"><span className="term-cmd-key">corus</span> <span>Список доступных открытых русских датасетов</span></div>
          <div className="term-help-row"><span className="term-cmd-key">status</span> <span>Показать текущий статус окружения, VRAM и ядра</span></div>
          <div className="term-help-row"><span className="term-cmd-key">clear</span> <span>Очистить экран терминала</span></div>
        </div>
      );
      return;
    }

    if (cmd === "menu") {
      addLine(
        "output",
        <div className="term-menu-box">
          <div className="term-menu-title">=== Tolstoy AI Studio v7 Pro: Главное меню ===</div>
          <div className="term-menu-item" onClick={() => executeCommand("dataset")}>[1] 🛠️ Подготовить датасет (токенизация BPE)</div>
          <div className="term-menu-item" onClick={() => executeCommand("train mini --galore")}>[2] 🚀 Обучить нейросеть (GaLore + Muon)</div>
          <div className="term-menu-item" onClick={() => executeCommand("chat В чем смысл жизни?")}>[3] 💬 Чат-интерфейс с моделью</div>
          <div className="term-menu-item" onClick={() => executeCommand("status")}>[4] 📊 Информация о модели и VRAM</div>
          <div className="term-menu-item" onClick={() => executeCommand("tokenize Привет, мир!")}>[5] ✂️ Тест BPE токенизатора</div>
          <div className="term-menu-item" onClick={() => executeCommand("corus")}>[6] 🌐 Загрузить русский датасет (Corus)</div>
        </div>
      );
      return;
    }

    if (cmd === "status" || cmd === "info" || cmd === "device") {
      addLine(
        "output",
        <div className="term-status-card">
          <div className="term-status-header">⚙️ Системная конфигурация Tolstoy-CLI</div>
          <div className="term-status-grid">
            <div><span className="term-muted">Framework:</span> PyTorch 2.4.1 (CUDA 12.4)</div>
            <div><span className="term-muted">GPU Device:</span> NVIDIA RTX 3060 12GB (VRAM allocated: 2.1 GB)</div>
            <div><span className="term-muted">Attention:</span> FlashAttention-2 / GQA (8 queries / 2 kv)</div>
            <div><span className="term-muted">Optimizer:</span> GaLore AdamW (rank=64) + Muon SVD</div>
            <div><span className="term-muted">Tokenizer:</span> Rust BPE v10 (Vocab: 32,768 tokens)</div>
            <div><span className="term-muted">Quantization:</span> XQuant-CL (INT8 Dynamic KV-Cache)</div>
          </div>
        </div>
      );
      return;
    }

    if (cmd === "corus") {
      addLine(
        "output",
        <div className="term-corus-box">
          <div className="term-corus-title">📚 Каталог русскоязычных корпусов Corus (21+ датасетов):</div>
          <div className="term-corus-grid">
            {CORUS_LIST.map((item) => (
              <div key={item.id} className="term-corus-row">
                <span className="text-cyan-glow font-bold">[{item.id}] {item.name}</span>
                <span className="text-purple-glow">{item.size}</span>
                <span className="term-tag">{item.tag}</span>
              </div>
            ))}
          </div>
          <div className="term-dim-note">Для загрузки в CLI: <code className="term-code-snippet">corus download 1</code></div>
        </div>
      );
      return;
    }

    if (cmd === "preset" || cmd === "presets") {
      const presetName = args[0]?.toLowerCase();
      if (presetName && PRESETS[presetName]) {
        const p = PRESETS[presetName];
        addLine(
          "output",
          <div className="term-preset-detail">
            <div className="font-bold text-cyan-glow">Пресет: {presetName.toUpperCase()} ({p.params} параметров)</div>
            <div>• Рекомендуемая память: <span className="text-purple-glow">{p.vram}</span></div>
            <div>• Слоев трансформера: {p.layers} | Размерность d_model: {p.d_model} | Голов внимания: {p.heads}</div>
            <div className="term-dim-note">• Описание: {p.desc}</div>
          </div>
        );
      } else {
        addLine(
          "output",
          <div className="term-presets-table">
            <div className="term-table-header">Доступные пресеты TolstoyLLM:</div>
            {Object.entries(PRESETS).map(([name, p]) => (
              <div key={name} className="term-preset-row" onClick={() => executeCommand(`preset ${name}`)}>
                <span className="term-cmd-key">{name.padEnd(8, " ")}</span>
                <span className="text-cyan-glow font-mono">{p.params.padEnd(6, " ")}</span>
                <span className="text-purple-glow">{p.vram}</span>
                <span className="term-dim-note">{p.desc}</span>
              </div>
            ))}
          </div>
        );
      }
      return;
    }

    if (cmd === "dataset" || cmd === "1") {
      setIsBusy(true);
      addLine("system", "🛠️ [Pipeline] Инициализация сканирования текстов в /corpus/...");
      await sleep(400);
      addLine("output", "• Найдено 14 произведений русской классики (Л. Толстой, Ф. Достоевский, М. Булгаков)");
      addLine("output", "• Объем сырого текста: 42.8 MB (символов: ~18,400,000)");
      await sleep(500);
      addLine("accent", "⚡ Обучение Rust Byte-Level BPE токенизатора (vocab_size=32768, Rayon 16 threads)...");
      await sleep(600);
      addLine("success", "✓ Токенизатор успешно обучен за 0.84s! Коэффициент сжатия: 3.48 символа/токен.");
      addLine("output", "✓ Бинарный кеш сохранен: models/tolstoy_bpe.bpe (1.4 MB)");
      setIsBusy(false);
      return;
    }

    if (cmd === "tokenize" || cmd === "5") {
      const text = args.join(" ") || "Анна Каренина смотрела на перрон через морозное стекло.";
      setIsBusy(true);
      addLine("system", `✂️ Токенизация фразы через Rust BPE: "${text}"`);
      await sleep(300);
      
      // Pseudo token IDs based on characters
      const mockTokens = [1405, 5920, 11432, 903, 11, 450, 19, 450, 11, 8042, 1143, 3105];
      addLine(
        "output",
        <div className="term-tokenize-result">
          <div><span className="text-cyan-glow">Токены ({mockTokens.length} шт.):</span> <span className="font-mono text-purple-glow">[{mockTokens.join(", ")}]</span></div>
          <div><span className="term-muted">Символов:</span> {text.length} | <span className="term-muted">Байт UTF-8:</span> {new TextEncoder().encode(text).length} | <span className="text-emerald-400">Время: 0.12 ms (Rust)</span></div>
        </div>
      );
      setIsBusy(false);
      return;
    }

    if (cmd === "train" || cmd === "2") {
      const selectedPreset = args.find((a) => !a.startsWith("-")) || "mini";
      const hasGalore = args.includes("--galore") || true;
      const hasMuon = args.includes("--muon") || true;

      setIsBusy(true);
      addLine("system", `🚀 Запуск цикла обучения: пресет [${selectedPreset.toUpperCase()}], GaLore=${hasGalore ? "ON (rank=64)" : "OFF"}, Muon=${hasMuon ? "ON" : "OFF"}...`);
      await sleep(400);
      addLine("output", `• Параметров модели: ${PRESETS[selectedPreset]?.params || "25M"}`);
      addLine("output", `• Выделение памяти под веса: ${hasGalore ? "1.8 GB VRAM (GaLore low-rank)" : "8.4 GB (Standard AdamW)"}`);
      await sleep(500);

      const steps = [
        { epoch: 1, step: 50, loss: 4.821, lr: "5e-4", speed: "4920 tok/s", vram: "2.1 GB" },
        { epoch: 1, step: 150, loss: 3.415, lr: "4.8e-4", speed: "5100 tok/s", vram: "2.1 GB" },
        { epoch: 2, step: 300, loss: 2.380, lr: "3.5e-4", speed: "5050 tok/s", vram: "2.2 GB" },
        { epoch: 3, step: 500, loss: 1.624, lr: "1.2e-4", speed: "5120 tok/s", vram: "2.2 GB" }
      ];

      for (const s of steps) {
        await sleep(500);
        addLine(
          "output",
          <div className="term-train-step">
            <span className="text-cyan-glow">[Epoch {s.epoch} | Step {s.step}]</span>{" "}
            <span className="term-loss">Loss: {s.loss.toFixed(3)}</span>{" "}
            <span className="term-dim">LR: {s.lr}</span> &bull;{" "}
            <span className="text-purple-glow">{s.speed}</span> &bull;{" "}
            <span className="text-emerald-400">VRAM: {s.vram}</span>
          </div>
        );
      }

      await sleep(400);
      addLine("success", "✨ Обучение успешно завершено! Контрольная точка сохранена в /models/tolstoy_mini_best.pt");
      addLine("accent", "💡 Теперь протестируйте результат командой: chat Скажи мне мудрость");
      setIsBusy(false);
      return;
    }

    if (cmd === "chat" || cmd === "3") {
      const userPrompt = args.join(" ");
      if (!userPrompt) {
        addLine("system", "💬 Введите ваш вопрос после команды chat, например:");
        addLine("accent", "   chat В чем смысл жизни?");
        addLine("accent", "   chat Как работает GaLore?");
        return;
      }

      setIsBusy(true);
      addLine("system", `🧠 Генерация ответа (TolstoyLLM v7, temp=0.7, Speculative Decoding 2.4x)...`);
      await sleep(600);

      const lower = userPrompt.toLowerCase();
      const matched = CHAT_RESPONSES.find((item) =>
        item.keywords.some((kw) => lower.includes(kw))
      ) || {
        author: "Tolstoy AI",
        text: `Размышляя над вопросом «${userPrompt}», можно заметить, что всякая мысль, рожденная искренним поиском истины, ведет человека к пониманию связи своего «я» с миром вокруг. Каждая деталь имеет значение.`
      };

      addLine(
        "output",
        <div className="term-chat-response">
          <div className="term-chat-author font-bold text-cyan-glow">
            🖋️ {matched.author}:
          </div>
          <div className="term-chat-text text-white/90">
            {matched.text}
          </div>
          <div className="term-chat-meta">
            ⚡ Speculative Heads: 3 tokens accepted/step | 42 tok/sec | Context: 256 tokens
          </div>
        </div>
      );
      setIsBusy(false);
      return;
    }

    // Default: unrecognized command
    addLine("error", `Команда не найдена: "${trimmed}". Введите "help" для справки или "menu" для главного меню.`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(inputVal);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIdx === -1 ? commandHistory.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(commandHistory[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIdx(-1);
        setInputVal("");
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(commandHistory[nextIdx]);
      }
    }
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  return (
    <div className="cli-terminal-wrapper">
      {/* Terminal Title Bar */}
      <div className="cli-terminal-chrome">
        <div className="cli-window-dots">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        <div className="cli-window-title font-mono">
          <svg className="w-3.5 h-3.5 text-cyan-400 inline-block mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          zzzigrok@tolstoy-ai-v7: ~/Tolstoy-CLI
        </div>
        <div className="cli-window-tag">
          <span className="live-dot" /> Online
        </div>
      </div>

      {/* Terminal Output Body */}
      <div ref={terminalBodyRef} className="cli-terminal-body font-mono" onClick={() => inputRef.current?.focus()}>
        {lines.map((line) => (
          <div key={line.id} className={`term-line term-line-${line.type}`}>
            {line.type === "input" && (
              <span className="term-prompt-prefix">
                <span className="prompt-dir">tolstoy-cli</span> <span className="prompt-symbol">➜</span>
              </span>
            )}
            <div className="term-line-content">{line.content}</div>
          </div>
        ))}
        {isBusy && (
          <div className="term-line term-line-system flex items-center gap-2">
            <span className="term-spinner animate-spin">⠋</span>
            <span>Выполнение операции в PyTorch kernel...</span>
          </div>
        )}
      </div>

      {/* Terminal Input Prompt */}
      <div className="cli-terminal-input-bar font-mono">
        <span className="prompt-dir">tolstoy-cli</span>
        <span className="prompt-symbol">➜</span>
        <input
          ref={inputRef}
          type="text"
          className="cli-input-field"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isBusy ? "Ожидание завершения..." : "Введите команду (help, menu, train, chat, corus)..."}
          disabled={isBusy}
          autoComplete="off"
          spellCheck="false"
        />
        {isBusy && <span className="cli-busy-tag">BUSY</span>}
      </div>

      {/* Quick Action Suggestion Chips */}
      <div className="cli-quick-chips">
        <span className="chips-label">Быстрые сценарии:</span>
        <button className="chip-btn" onClick={() => executeCommand("menu")}>
          📋 menu
        </button>
        <button className="chip-btn" onClick={() => executeCommand("train mini --galore")}>
          🚀 train mini --galore
        </button>
        <button className="chip-btn" onClick={() => executeCommand("chat В чем смысл жизни?")}>
          💬 chat с Толстым
        </button>
        <button className="chip-btn" onClick={() => executeCommand("tokenize Красота спасет мир")}>
          ✂️ tokenize
        </button>
        <button className="chip-btn" onClick={() => executeCommand("corus")}>
          🌐 corus датасеты
        </button>
        <button className="chip-btn" onClick={() => executeCommand("status")}>
          ⚙️ status
        </button>
        <button className="chip-btn chip-clear" onClick={() => executeCommand("clear")}>
          🧹 clear
        </button>
      </div>
    </div>
  );
}
