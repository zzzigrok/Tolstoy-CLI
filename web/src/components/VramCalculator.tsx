import { useState, useMemo } from "react";

export type GpuCategory = "all" | "geforce" | "enthusiast" | "apple" | "amd" | "server";

export interface GpuPreset {
  name: string;
  vram: number;
  category: GpuCategory;
  tag?: string;
  arch?: string;
}

export const GPU_PRESETS: GpuPreset[] = [
  // 1. Популярные домашние NVIDIA GeForce RTX
  { name: "GTX 1660 Super", vram: 6, category: "geforce", tag: "Бюджетная", arch: "Turing" },
  { name: "RTX 2060 (6GB)", vram: 6, category: "geforce", tag: "Бюджетная", arch: "Turing" },
  { name: "RTX 3050 (8GB)", vram: 8, category: "geforce", tag: "Начальная", arch: "Ampere" },
  { name: "RTX 4060 (8GB)", vram: 8, category: "geforce", tag: "Популярная", arch: "Ada Lovelace" },
  { name: "RTX 3060 (12GB)", vram: 12, category: "geforce", tag: "🔥 Народный топ для AI", arch: "Ampere" },
  { name: "RTX 4060 Ti (16GB)", vram: 16, category: "geforce", tag: "⭐ Лучшая цена/16GB", arch: "Ada Lovelace" },
  { name: "RTX 3070 / 3070 Ti (8GB)", vram: 8, category: "geforce", tag: "Игровая", arch: "Ampere" },
  { name: "RTX 3080 (10GB)", vram: 10, category: "geforce", tag: "Быстрая память", arch: "Ampere" },
  { name: "RTX 4070 / 4070 Super (12GB)", vram: 12, category: "geforce", tag: "Сбалансированная", arch: "Ada Lovelace" },
  { name: "RTX 4070 Ti Super (16GB)", vram: 16, category: "geforce", tag: "16GB VRAM", arch: "Ada Lovelace" },
  { name: "RTX 4080 / 4080 Super (16GB)", vram: 16, category: "geforce", tag: "Высокая скорость", arch: "Ada Lovelace" },

  // 2. Флагманы и Энтузиасты (24GB+)
  { name: "RTX 3090 (24GB)", vram: 24, category: "enthusiast", tag: "🔥 Идеал для 1B-3B", arch: "Ampere 24GB" },
  { name: "RTX 4090 (24GB)", vram: 24, category: "enthusiast", tag: "👑 SOTA Флагман", arch: "Ada Lovelace 24GB" },
  { name: "2x RTX 3090 (48GB Dual)", vram: 48, category: "enthusiast", tag: "Dual GPU Setup", arch: "Ampere NVLink" },
  { name: "2x RTX 4090 (48GB Dual)", vram: 48, category: "enthusiast", tag: "Extreme Dual", arch: "Ada Lovelace Dual" },

  // 3. Apple Silicon (Unified Memory)
  { name: "Apple M1 / M2 / M3 (16GB)", vram: 16, category: "apple", tag: "Unified RAM", arch: "Apple Silicon" },
  { name: "Apple M2 / M3 Pro (18GB)", vram: 18, category: "apple", tag: "Unified RAM", arch: "Apple Silicon" },
  { name: "Apple M3 / M4 Pro (24GB)", vram: 24, category: "apple", tag: "Unified RAM", arch: "Apple Silicon" },
  { name: "Apple M5 (24GB)", vram: 24, category: "apple", tag: "⚡ Next-Gen M5", arch: "Apple M5" },
  { name: "Apple M3 / M4 Max (36GB)", vram: 36, category: "apple", tag: "Mac Studio / Pro", arch: "Apple Silicon" },
  { name: "Apple M5 Max (48GB)", vram: 48, category: "apple", tag: "⚡ Next-Gen M5 Max", arch: "Apple M5" },
  { name: "Apple M3 / M4 Max (64GB)", vram: 64, category: "apple", tag: "Огромная память", arch: "Apple Silicon" },
  { name: "Apple M2 Ultra (128GB)", vram: 128, category: "apple", tag: "Extreme Unified", arch: "Apple Silicon" },
  { name: "Apple M2 Ultra (192GB)", vram: 192, category: "apple", tag: "Максимум RAM", arch: "Apple Silicon" },
  { name: "Apple M5 Ultra (192GB)", vram: 192, category: "apple", tag: "⚡ Next-Gen Ultra", arch: "Apple M5" },

  // 4. AMD Radeon & Instinct (ROCm / DirectML)
  { name: "Radeon RX 580 (8GB)", vram: 8, category: "amd", tag: "Бюджетная классика", arch: "Polaris" },
  { name: "Radeon RX 5700 XT (8GB)", vram: 8, category: "amd", tag: "RDNA 1", arch: "RDNA 1" },
  { name: "Radeon RX 6600 / 6600 XT (8GB)", vram: 8, category: "amd", tag: "Доступная", arch: "RDNA 2" },
  { name: "Radeon RX 6700 XT / 6750 XT (12GB)", vram: 12, category: "amd", tag: "ROCm 12GB", arch: "RDNA 2" },
  { name: "Radeon RX 6800 / 6800 XT (16GB)", vram: 16, category: "amd", tag: "🔥 Хит цена/16GB", arch: "RDNA 2" },
  { name: "Radeon RX 6900 XT / 6950 XT (16GB)", vram: 16, category: "amd", tag: "Флагман RDNA 2", arch: "RDNA 2" },
  { name: "Radeon RX 7600 XT (16GB)", vram: 16, category: "amd", tag: "⭐ Бюджетные 16GB", arch: "RDNA 3" },
  { name: "Radeon RX 7700 XT (12GB)", vram: 12, category: "amd", tag: "12GB VRAM", arch: "RDNA 3" },
  { name: "Radeon RX 7800 XT (16GB)", vram: 16, category: "amd", tag: "Хит RDNA 3", arch: "RDNA 3" },
  { name: "Radeon RX 7900 GRE (16GB)", vram: 16, category: "amd", tag: "16GB VRAM", arch: "RDNA 3" },
  { name: "Radeon RX 7900 XT (20GB)", vram: 20, category: "amd", tag: "20GB VRAM", arch: "RDNA 3" },
  { name: "Radeon RX 7900 XTX (24GB)", vram: 24, category: "amd", tag: "👑 Топ RDNA 3 (24GB)", arch: "RDNA 3" },
  { name: "Radeon PRO W6800 (32GB)", vram: 32, category: "amd", tag: "Workstation 32GB", arch: "RDNA 2 Pro" },
  { name: "Radeon PRO W7800 (32GB)", vram: 32, category: "amd", tag: "Workstation 32GB", arch: "RDNA 3 Pro" },
  { name: "Radeon PRO W7900 (48GB)", vram: 48, category: "amd", tag: "Workstation 48GB", arch: "RDNA 3 Pro" },
  { name: "AMD Instinct MI50 (32GB)", vram: 32, category: "amd", tag: "HBM2 32GB", arch: "CDNA / Vega 20" },
  { name: "AMD Instinct MI100 (32GB)", vram: 32, category: "amd", tag: "CDNA 1 Enterprise", arch: "CDNA 1" },
  { name: "AMD Instinct MI210 (64GB)", vram: 64, category: "amd", tag: "HBM2e 64GB", arch: "CDNA 2" },
  { name: "AMD Instinct MI250X (128GB)", vram: 128, category: "amd", tag: "Dual-Die 128GB", arch: "CDNA 2" },
  { name: "AMD Instinct MI300X (192GB)", vram: 192, category: "amd", tag: "🚀 SOTA 192GB HBM3", arch: "CDNA 3" },

  // 5. Cloud & Серверные ускорители
  { name: "NVIDIA Tesla P40 (24GB)", vram: 24, category: "server", tag: "🔥 Народный 24GB Homelab", arch: "Pascal 24GB" },
  { name: "NVIDIA Tesla P100 (16GB)", vram: 16, category: "server", tag: "Colab HBM2", arch: "Pascal HBM2" },
  { name: "NVIDIA Tesla V100 (16GB)", vram: 16, category: "server", tag: "Volta Tensor Cores", arch: "Volta HBM2" },
  { name: "NVIDIA Tesla V100 (32GB)", vram: 32, category: "server", tag: "32GB High-VRAM", arch: "Volta HBM2" },
  { name: "NVIDIA Tesla T4 (16GB)", vram: 16, category: "server", tag: "Google Colab Free", arch: "Turing Server" },
  { name: "NVIDIA L4 (24GB)", vram: 24, category: "server", tag: "Cloud Lovelace", arch: "Ada Server" },
  { name: "NVIDIA A10G (24GB)", vram: 24, category: "server", tag: "AWS EC2 G5", arch: "Ampere Server" },
  { name: "RTX A6000 (48GB)", vram: 48, category: "server", tag: "Workstation SOTA", arch: "Ampere Workstation" },
  { name: "NVIDIA A100 (40GB)", vram: 40, category: "server", tag: "Cloud HBM2", arch: "Ampere Datacenter" },
  { name: "NVIDIA A100 (80GB)", vram: 80, category: "server", tag: "Отраслевой стандарт", arch: "Ampere HBM2e" },
  { name: "NVIDIA H100 (80GB)", vram: 80, category: "server", tag: "Hopper Ultra", arch: "Hopper HBM3" }
];

const CATEGORIES: { id: GpuCategory; label: string }[] = [
  { id: "all", label: "Все видеокарты" },
  { id: "geforce", label: "GeForce RTX" },
  { id: "enthusiast", label: "24GB+ / Dual GPU" },
  { id: "apple", label: "Apple Silicon" },
  { id: "amd", label: "AMD Radeon & Instinct" },
  { id: "server", label: "Cloud & Серверы" }
];

const MODEL_PRESETS = [
  { id: "nano", name: "Nano", paramsM: 5, label: "5M параметров", layers: 6 },
  { id: "mini", name: "Mini", paramsM: 25, label: "25M параметров", layers: 8 },
  { id: "small", name: "Small", paramsM: 80, label: "80M параметров", layers: 12 },
  { id: "medium", name: "Medium", paramsM: 350, label: "350M параметров", layers: 24 },
  { id: "large", name: "Large", paramsM: 1000, label: "1.0B параметров", layers: 32 },
  { id: "xlarge", name: "XLarge", paramsM: 3200, label: "3.2B параметров", layers: 40 }
];

export function VramCalculator() {
  const [activeCategory, setActiveCategory] = useState<GpuCategory>("all");
  const [selectedGpu, setSelectedGpu] = useState<string>("RTX 3060 (12GB)");
  const [availableVram, setAvailableVram] = useState<number>(12);
  const [modelPreset, setModelPreset] = useState<string>("small");
  const [contextLen, setContextLen] = useState<number>(2048);
  const [batchSize, setBatchSize] = useState<number>(4);
  const [useGaLore, setUseGaLore] = useState<boolean>(true);
  const [useMuon, setUseMuon] = useState<boolean>(true);
  const [useXQuant, setUseXQuant] = useState<boolean>(true);
  const [weightPrecision, setWeightPrecision] = useState<"fp16" | "int8">("fp16");

  const currentModel = MODEL_PRESETS.find((m) => m.id === modelPreset) || MODEL_PRESETS[2];

  // Filtered GPUs based on category
  const filteredGpus = useMemo(() => {
    if (activeCategory === "all") return GPU_PRESETS;
    return GPU_PRESETS.filter((g) => g.category === activeCategory);
  }, [activeCategory]);

  const activeGpuObj = useMemo(() => {
    return GPU_PRESETS.find((g) => g.name === selectedGpu);
  }, [selectedGpu]);

  // Mathematical VRAM calculation model
  const calc = useMemo(() => {
    const P = currentModel.paramsM * 1e6; // Parameters count

    // 1. Model weights (FP16 = 2 bytes/param, INT8 = 1 byte/param)
    const bytesPerWeight = weightPrecision === "int8" ? 1.0 : 2.0;
    const weightsGb = (P * bytesPerWeight) / (1024 ** 3);

    // 2. Gradients (BF16/FP16 = 2 bytes/param)
    const gradientsGb = (P * 2.0) / (1024 ** 3);

    // 3. Optimizer States:
    // Standard AdamW: 8 bytes (m and v states in FP32) + 4 bytes master copy = 12-16 bytes/param
    // GaLore (rank=64): reduces optimizer memory by ~80% (low-rank projection)
    let optimizerBytes = 12.0;
    if (useGaLore) {
      optimizerBytes = 2.4; // 80% reduction
    }
    if (useMuon) {
      optimizerBytes *= 0.85; // Extra orthogonal stabilization savings
    }
    const optimizerGb = (P * optimizerBytes) / (1024 ** 3);

    // 4. Activations & KV-Cache:
    const baseActivations = (batchSize * contextLen * currentModel.layers * 4096) / (1024 ** 3);
    const kvMultiplier = useXQuant ? 0.5 : 1.0; // INT8 KV-cache halves memory
    const activationsGb = Math.max(0.4, baseActivations * kvMultiplier);

    // 5. CUDA Kernel Overhead / PyTorch workspace
    const cudaOverheadGb = 0.6;

    const totalNeeded = weightsGb + optimizerGb + gradientsGb + activationsGb + cudaOverheadGb;
    const diff = availableVram - totalNeeded;
    const isFit = diff >= 0;

    return {
      weightsGb,
      optimizerGb,
      gradientsGb,
      activationsGb,
      cudaOverheadGb,
      totalNeeded,
      diff,
      isFit
    };
  }, [currentModel, weightPrecision, useGaLore, useMuon, useXQuant, contextLen, batchSize, availableVram]);

  const handleSelectGpu = (gpu: GpuPreset) => {
    setSelectedGpu(gpu.name);
    setAvailableVram(gpu.vram);
  };

  const handleDropdownChange = (name: string) => {
    const found = GPU_PRESETS.find((g) => g.name === name);
    if (found) {
      setSelectedGpu(found.name);
      setAvailableVram(found.vram);
    }
  };

  // Percentages for stacked progress bar
  const weightsPct = Math.min(100, (calc.weightsGb / calc.totalNeeded) * 100);
  const optPct = Math.min(100, (calc.optimizerGb / calc.totalNeeded) * 100);
  const gradPct = Math.min(100, (calc.gradientsGb / calc.totalNeeded) * 100);
  const actPct = Math.min(100, (calc.activationsGb / calc.totalNeeded) * 100);

  return (
    <div className="vram-calc-wrapper">
      {/* Category filter tabs & Quick Dropdown */}
      <div className="vram-selector-header">
        <div className="vram-category-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`vram-cat-btn ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
              {cat.id === "all" && <span className="cat-count">({GPU_PRESETS.length})</span>}
            </button>
          ))}
        </div>

        {/* Dropdown for quick search/direct pick */}
        <div className="vram-dropdown-wrapper">
          <select
            className="vram-gpu-dropdown"
            value={selectedGpu}
            onChange={(e) => handleDropdownChange(e.target.value)}
          >
            <optgroup label="🔥 Популярные GeForce RTX">
              {GPU_PRESETS.filter((g) => g.category === "geforce").map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name} — {g.vram} GB
                </option>
              ))}
            </optgroup>
            <optgroup label="👑 Флагманы и Dual GPU (24GB+)">
              {GPU_PRESETS.filter((g) => g.category === "enthusiast").map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name} — {g.vram} GB
                </option>
              ))}
            </optgroup>
            <optgroup label="🍏 Apple Silicon (Unified Memory)">
              {GPU_PRESETS.filter((g) => g.category === "apple").map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name} — {g.vram} GB
                </option>
              ))}
            </optgroup>
            <optgroup label="🔴 AMD Radeon (ROCm)">
              {GPU_PRESETS.filter((g) => g.category === "amd").map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name} — {g.vram} GB
                </option>
              ))}
            </optgroup>
            <optgroup label="⚡ Cloud & Серверные">
              {GPU_PRESETS.filter((g) => g.category === "server").map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name} — {g.vram} GB
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* GPU Chips Grid */}
      <div className="vram-gpu-chips-container">
        <div className="vram-gpu-chips">
          {filteredGpus.map((gpu) => (
            <button
              key={gpu.name}
              className={`vram-gpu-chip ${selectedGpu === gpu.name ? "active" : ""}`}
              onClick={() => handleSelectGpu(gpu)}
            >
              <div className="chip-content">
                <span className="gpu-name">{gpu.name}</span>
                {gpu.tag && <span className="gpu-tag-mini">{gpu.tag}</span>}
              </div>
              <span className="gpu-vram">{gpu.vram} GB</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected GPU Active Card */}
      <div className="vram-active-gpu-banner">
        <div className="active-gpu-left">
          <span className="active-dot">●</span>
          <span className="active-label">Активное железо:</span>
          <strong className="text-cyan-glow">{selectedGpu}</strong>
          {activeGpuObj?.arch && <span className="active-arch">[{activeGpuObj.arch}]</span>}
        </div>
        <div className="active-gpu-right">
          <span className="active-vram-badge">{availableVram} GB VRAM</span>
        </div>
      </div>

      <div className="vram-main-grid">
        {/* Left Column: Sliders & Toggles */}
        <div className="vram-settings-col">
          {/* Preset Picker */}
          <div className="vram-control-box">
            <label className="vram-control-title">
              Размер модели (Пресет):{" "}
              <span className="text-cyan-glow font-bold">
                {currentModel.name} ({currentModel.label})
              </span>
            </label>
            <div className="vram-presets-row">
              {MODEL_PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={`vram-preset-btn ${modelPreset === p.id ? "active" : ""}`}
                  onClick={() => setModelPreset(p.id)}
                >
                  <span className="p-name">{p.name}</span>
                  <span className="p-sub">{p.paramsM}M</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="vram-sliders-grid">
            <div className="vram-slider-item">
              <div className="slider-header">
                <span>Память GPU (VRAM):</span>
                <span className="text-purple-glow font-bold">{availableVram} GB</span>
              </div>
              <input
                type="range"
                min="4"
                max="192"
                step="2"
                value={availableVram}
                onChange={(e) => {
                  setAvailableVram(Number(e.target.value));
                  setSelectedGpu(`Кастомная (${e.target.value} GB)`);
                }}
                className="vram-range"
              />
              <div className="range-ticks">
                <span>4G</span>
                <span>8G</span>
                <span>12G</span>
                <span>16G</span>
                <span>24G</span>
                <span>48G</span>
                <span>80G</span>
                <span>128G</span>
                <span>192G</span>
              </div>
            </div>

            <div className="vram-slider-item">
              <div className="slider-header">
                <span>Длина контекста (Context Length):</span>
                <span className="text-cyan-glow font-bold">{contextLen} токенов</span>
              </div>
              <input
                type="range"
                min="512"
                max="8192"
                step="512"
                value={contextLen}
                onChange={(e) => setContextLen(Number(e.target.value))}
                className="vram-range"
              />
            </div>

            <div className="vram-slider-item">
              <div className="slider-header">
                <span>Размер батча (Batch Size):</span>
                <span className="text-emerald-400 font-bold">{batchSize}</span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                step="1"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="vram-range"
              />
            </div>
          </div>

          {/* SOTA Optimizations Toggles */}
          <div className="vram-toggles-box">
            <div className="vram-control-title">Ключевые оптимизации v7 Pro:</div>
            <div className="vram-toggles-grid">
              <label className="vram-toggle-item">
                <input
                  type="checkbox"
                  checked={useGaLore}
                  onChange={(e) => setUseGaLore(e.target.checked)}
                />
                <div className="toggle-text">
                  <div className="toggle-label text-cyan-glow">GaLore (Low-Rank AdamW)</div>
                  <div className="toggle-desc">-80% VRAM оптимизатора</div>
                </div>
              </label>

              <label className="vram-toggle-item">
                <input
                  type="checkbox"
                  checked={useMuon}
                  onChange={(e) => setUseMuon(e.target.checked)}
                />
                <div className="toggle-text">
                  <div className="toggle-label text-purple-glow">Muon Optimizer</div>
                  <div className="toggle-desc">Ортогонализация Ньютона-Шульца</div>
                </div>
              </label>

              <label className="vram-toggle-item">
                <input
                  type="checkbox"
                  checked={useXQuant}
                  onChange={(e) => setUseXQuant(e.target.checked)}
                />
                <div className="toggle-text">
                  <div className="toggle-label text-emerald-400">XQuant-CL (INT8 KV)</div>
                  <div className="toggle-desc">-50% памяти длинного контекста</div>
                </div>
              </label>

              <label className="vram-toggle-item">
                <input
                  type="checkbox"
                  checked={weightPrecision === "int8"}
                  onChange={(e) => setWeightPrecision(e.target.checked ? "int8" : "fp16")}
                />
                <div className="toggle-text">
                  <div className="toggle-label text-pink-glow">INT8 Веса</div>
                  <div className="toggle-desc">Квантование базовой модели</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Breakdown & Verdict */}
        <div className="vram-visual-col">
          {/* Verdict Banner */}
          <div className={`vram-verdict-card ${calc.isFit ? "fit" : "oom"}`}>
            <div className="verdict-icon">{calc.isFit ? "✅" : "⚠️"}</div>
            <div className="verdict-content">
              <div className="verdict-title">
                {calc.isFit
                  ? `Поместится в память! (Запас: ${calc.diff.toFixed(2)} GB)`
                  : `Out of Memory! (Превышение: ${Math.abs(calc.diff).toFixed(2)} GB)`}
              </div>
              <div className="verdict-sub">
                {calc.isFit
                  ? `Требуется: ${calc.totalNeeded.toFixed(2)} GB из доступных ${availableVram} GB VRAM.`
                  : `Для запуска включите GaLore или уменьшите пресет/батч.`}
              </div>
            </div>
          </div>

          {/* Stacked Memory Breakdown Bar */}
          <div className="vram-bar-container">
            <div className="vram-bar-title">
              <span>
                Распределение VRAM: <strong>{calc.totalNeeded.toFixed(2)} GB</strong>
              </span>
              <span className="vram-bar-cap">Лимит: {availableVram} GB</span>
            </div>
            <div className="vram-segmented-bar">
              <div
                className="segment weights"
                style={{ width: `${weightsPct}%` }}
                title={`Веса модели: ${calc.weightsGb.toFixed(2)} GB`}
              />
              <div
                className="segment optimizer"
                style={{ width: `${optPct}%` }}
                title={`Оптимизатор: ${calc.optimizerGb.toFixed(2)} GB`}
              />
              <div
                className="segment gradients"
                style={{ width: `${gradPct}%` }}
                title={`Градиенты: ${calc.gradientsGb.toFixed(2)} GB`}
              />
              <div
                className="segment activations"
                style={{ width: `${actPct}%` }}
                title={`Активации и KV-кэш: ${calc.activationsGb.toFixed(2)} GB`}
              />
            </div>
          </div>

          {/* Breakdown Legend Cards */}
          <div className="vram-breakdown-grid">
            <div className="breakdown-card">
              <div className="dot-label">
                <span className="legend-dot cyan" />
                <span>Веса модели:</span>
              </div>
              <span className="breakdown-val font-mono text-cyan-glow">
                {calc.weightsGb.toFixed(2)} GB
              </span>
            </div>

            <div className="breakdown-card">
              <div className="dot-label">
                <span className="legend-dot purple" />
                <span>Оптимизатор ({useGaLore ? "GaLore" : "AdamW"}):</span>
              </div>
              <span className="breakdown-val font-mono text-purple-glow">
                {calc.optimizerGb.toFixed(2)} GB
              </span>
            </div>

            <div className="breakdown-card">
              <div className="dot-label">
                <span className="legend-dot pink" />
                <span>Градиенты (FP16):</span>
              </div>
              <span className="breakdown-val font-mono text-pink-glow">
                {calc.gradientsGb.toFixed(2)} GB
              </span>
            </div>

            <div className="breakdown-card">
              <div className="dot-label">
                <span className="legend-dot yellow" />
                <span>Контекст & KV-кэш:</span>
              </div>
              <span className="breakdown-val font-mono text-yellow-400">
                {calc.activationsGb.toFixed(2)} GB
              </span>
            </div>
          </div>

          {/* Command Generator */}
          <div className="vram-command-box">
            <div className="cmd-box-title">Готовая команда запуска CLI:</div>
            <div className="cmd-box-code font-mono">
              python tolstoy_cli.py --preset {modelPreset} --batch {batchSize}{" "}
              {useGaLore ? "--galore " : ""}
              {useMuon ? "--muon " : ""}
              {useXQuant ? "--xquant" : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
