import React, { useState } from "react";

// Generic Tab component used across all documentation articles
export function DocTabs({ tabs, accent = "cyan" }: { 
  tabs: { id: string; label: string; content: React.ReactNode }[],
  accent?: "cyan" | "purple" | "pink"
}) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className={`doc-tabs-container accent-${accent}`}>
      <div className="doc-tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`doc-tab-btn ${activeTab === tab.id ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="doc-tab-content">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}

// Re-export all 12 expanded modular documentation articles
export { ArchitectureDoc } from "./docs/ArchitectureDoc";
export { CliGuideDoc } from "./docs/CliGuideDoc";
export { TrainingDoc } from "./docs/TrainingDoc";
export { TokenizerDoc } from "./docs/TokenizerDoc";
export { RoPEYaRNDoc } from "./docs/RoPEYaRNDoc";
export { MoEDoc } from "./docs/MoEDoc";
export { OptimizersDoc } from "./docs/OptimizersDoc";
export { SpeculativeDoc } from "./docs/SpeculativeDoc";
export { DatasetTutorialDoc } from "./docs/DatasetTutorialDoc";
export { TokenizationTutorialDoc } from "./docs/TokenizationTutorialDoc";
export { TrainingTutorialDoc } from "./docs/TrainingTutorialDoc";
export { InteractionTutorialDoc } from "./docs/InteractionTutorialDoc";
