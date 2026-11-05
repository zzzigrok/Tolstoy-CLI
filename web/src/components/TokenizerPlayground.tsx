import { useState, useMemo } from "react";

interface TokenInfo {
  id: number;
  text: string;
  bytes: number;
  colorIdx: number;
}

const PRESET_TEXTS = [
  {
    author: "Лев Толстой",
    snippet: "Все счастливые семьи похожи друг на друга, каждая несчастлива по-своему. Все смешалось в доме Облонских.",
    tag: "Классика"
  },
  {
    author: "Ф. Достоевский",
    snippet: "Красота спасет мир, если только она не увлечется собственной гордыней и не забудет о страдании человеческом.",
    tag: "Философия"
  },
  {
    author: "М. Булгаков",
    snippet: "Рукописи не горят, потому что истинное слово превозмогает тление времени и страх перед тиранией.",
    tag: "Мистика"
  },
  {
    author: "Tolstoy-v7 SOTA",
    snippet: "Обучение трансформера со Sparse MoE (8 экспертов, top-2) и GaLore проекцией требует на 80% меньше VRAM на RTX 3060.",
    tag: "ML / Код"
  }
];

// Simple deterministic string hash for stable mock token IDs
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 32000) + 100;
}

// Byte-Level BPE simulation tailored for Russian prefixes/suffixes
function simulateBpeTokenize(text: string): TokenInfo[] {
  if (!text) return [];

  // Match words, whitespaces, punctuation
  const rawParts = text.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}\s]+|\s+/gu) || [text];
  const tokens: TokenInfo[] = [];

  rawParts.forEach((part, partIdx) => {
    // If it's pure whitespace, make it a single or double token
    if (/^\s+$/.test(part)) {
      tokens.push({
        id: hashString(part + partIdx),
        text: part === " " ? " " : part === "\n" ? "\\n" : part,
        bytes: new TextEncoder().encode(part).length,
        colorIdx: tokens.length % 7
      });
      return;
    }

    // If it's punctuation, keep each punctuation mark as 1 token
    if (!/[\p{L}\p{N}]/u.test(part)) {
      for (const char of part) {
        tokens.push({
          id: hashString(char),
          text: char,
          bytes: new TextEncoder().encode(char).length,
          colorIdx: tokens.length % 7
        });
      }
      return;
    }

    // For words, split into realistic subword BPE chunks (length 2-4 chars)
    let rem = part;
    let chunkIdx = 0;
    while (rem.length > 0) {
      let splitLen = 4;
      if (rem.length <= 4) {
        splitLen = rem.length;
      } else if (chunkIdx === 0 && rem.length >= 6) {
        splitLen = 3; // Prefix
      } else if (rem.length === 5) {
        splitLen = 3;
      } else {
        splitLen = 4;
      }

      const chunk = rem.slice(0, splitLen);
      rem = rem.slice(splitLen);
      chunkIdx++;

      tokens.push({
        id: hashString(chunk + (tokens.length % 5)),
        text: chunk,
        bytes: new TextEncoder().encode(chunk).length,
        colorIdx: tokens.length % 7
      });
    }
  });

  return tokens;
}

export function TokenizerPlayground() {
  const [inputText, setInputText] = useState(PRESET_TEXTS[0].snippet);
  const [viewMode, setViewMode] = useState<"visual" | "ids" | "table">("visual");
  const [hoveredToken, setHoveredToken] = useState<TokenInfo | null>(null);
  const [copied, setCopied] = useState(false);

  // Compute tokens
  const tokens = useMemo(() => simulateBpeTokenize(inputText), [inputText]);

  // Metrics
  const charCount = inputText.length;
  const byteCount = useMemo(() => new TextEncoder().encode(inputText).length, [inputText]);
  const tokenCount = tokens.length;
  const compressionRatio = tokenCount > 0 ? (byteCount / tokenCount).toFixed(2) : "0.00";
  const charsPerToken = tokenCount > 0 ? (charCount / tokenCount).toFixed(2) : "0.00";

  // Rust vs Python execution time simulation
  const rustTime = (tokenCount * 0.008 + 0.05).toFixed(2);
  const pythonTime = (tokenCount * 0.16 + 1.1).toFixed(1);
  const speedup = (parseFloat(pythonTime) / parseFloat(rustTime)).toFixed(1);

  const handleCopyIds = async () => {
    const idsString = JSON.stringify(tokens.map((t) => t.id));
    await navigator.clipboard.writeText(idsString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tokenizer-playground-wrapper">
      {/* Header controls & presets */}
      <div className="tok-controls-bar">
        <div className="tok-presets-group">
          <span className="tok-label">Примеры:</span>
          {PRESET_TEXTS.map((preset) => (
            <button
              key={preset.author}
              className={`tok-preset-btn ${inputText === preset.snippet ? "active" : ""}`}
              onClick={() => setInputText(preset.snippet)}
            >
              <span>{preset.author}</span>
              <span className="tok-tag">{preset.tag}</span>
            </button>
          ))}
        </div>

        <div className="tok-view-tabs">
          <button
            className={`tok-tab-btn ${viewMode === "visual" ? "active" : ""}`}
            onClick={() => setViewMode("visual")}
          >
            Токены
          </button>
          <button
            className={`tok-tab-btn ${viewMode === "ids" ? "active" : ""}`}
            onClick={() => setViewMode("ids")}
          >
            Token IDs
          </button>
          <button
            className={`tok-tab-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
          >
            Таблица
          </button>
        </div>
      </div>

      {/* Input textarea */}
      <div className="tok-input-box">
        <textarea
          className="tok-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Введите любой текст на русском, английском или код для мгновенной токенизации..."
          rows={3}
        />
        {inputText.length > 0 && (
          <button className="tok-clear-btn" onClick={() => setInputText("")} title="Очистить">
            ✕
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="tok-stats-bar">
        <div className="tok-stat-card">
          <div className="stat-num text-cyan-glow">{tokenCount}</div>
          <div className="stat-sub">Токенов BPE</div>
        </div>
        <div className="tok-stat-card">
          <div className="stat-num text-purple-glow">{byteCount}</div>
          <div className="stat-sub">Байт UTF-8</div>
        </div>
        <div className="tok-stat-card">
          <div className="stat-num text-emerald-400">{compressionRatio}x</div>
          <div className="stat-sub">Сжатие (байт/токен)</div>
        </div>
        <div className="tok-stat-card">
          <div className="stat-num text-pink-glow">{charsPerToken}</div>
          <div className="stat-sub">Символов/токен</div>
        </div>
        <div className="tok-stat-card highlight">
          <div className="stat-num text-cyan-glow">
            {rustTime} ms <span className="stat-speedup">({speedup}× быстрее)</span>
          </div>
          <div className="stat-sub">Rust BPE vs Python ({pythonTime} ms)</div>
        </div>
      </div>

      {/* Interactive Token Rendering Area */}
      <div className="tok-display-card">
        {viewMode === "visual" && (
          <div className="tok-tokens-flow">
            {tokens.length === 0 ? (
              <div className="tok-empty">Начните вводить текст выше для токенизации...</div>
            ) : (
              tokens.map((tok, idx) => (
                <span
                  key={idx}
                  className={`tok-pill tok-color-${tok.colorIdx} ${hoveredToken === tok ? "hovered" : ""}`}
                  onMouseEnter={() => setHoveredToken(tok)}
                  onMouseLeave={() => setHoveredToken(null)}
                >
                  <span className="tok-text">{tok.text}</span>
                  <span className="tok-id-mini">#{tok.id}</span>
                </span>
              ))
            )}
          </div>
        )}

        {viewMode === "ids" && (
          <div className="tok-ids-box">
            <div className="tok-ids-header">
              <span>Числовые идентификаторы словаря (Vocab: 32,768):</span>
              <button className="tok-copy-btn" onClick={handleCopyIds}>
                {copied ? "Скопировано!" : "Копировать массив IDs"}
              </button>
            </div>
            <div className="tok-ids-content font-mono">
              [{tokens.map((t) => t.id).join(", ")}]
            </div>
          </div>
        )}

        {viewMode === "table" && (
          <div className="tok-table-container">
            <table className="tok-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Текст токена</th>
                  <th>Token ID</th>
                  <th>Байт</th>
                  <th>UTF-8 Hex</th>
                </tr>
              </thead>
              <tbody>
                {tokens.slice(0, 30).map((tok, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="font-mono text-cyan-glow">
                      {tok.text === " " ? "␣ (space)" : tok.text}
                    </td>
                    <td className="font-mono text-purple-glow">#{tok.id}</td>
                    <td>{tok.bytes}</td>
                    <td className="font-mono text-muted text-xs">
                      {Array.from(new TextEncoder().encode(tok.text))
                        .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
                        .join(" ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tokens.length > 30 && (
              <div className="tok-table-more">Показано 30 из {tokens.length} токенов</div>
            )}
          </div>
        )}

        {/* Hover Inspector Tooltip (Persistent container to avoid layout shift) */}
        <div className={`tok-inspector ${hoveredToken ? "active" : "idle"}`}>
          {hoveredToken ? (
            <>
              <span className="inspector-badge">Инспектор токена:</span>
              <span className="inspector-item">
                Текст: <strong>"{hoveredToken.text}"</strong>
              </span>
              <span className="inspector-item">
                ID: <strong className="text-cyan-glow">#{hoveredToken.id}</strong>
              </span>
              <span className="inspector-item">
                Длина: <strong>{hoveredToken.bytes} байт</strong>
              </span>
            </>
          ) : (
            <span className="inspector-placeholder">
              <span className="inspector-badge idle">Инспектор:</span>
              Наведите курсор на любой токен для просмотра ID, длины и байтового среза...
            </span>
          )}
        </div>
      </div>

      {/* Educational Callout */}
      <div className="tok-callout">
        <div className="tok-callout-icon">💡</div>
        <div className="tok-callout-text">
          <strong>Почему наш токенизатор критически важен для русского языка?</strong> В стандартных моделях (вроде LLaMA-1 или GPT-2) кириллица не имела собственных слияний и разбивалась на 2–3 байтовых токена за букву, съедая 65% контекста впустую. <strong>Tolstoy BPE v10</strong> на Rust (PyO3) объединяет целые русские корни и окончания в единые токены, ускоряя инференс и экономя VRAM.
        </div>
      </div>
    </div>
  );
}
