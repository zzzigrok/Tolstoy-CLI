# Design Doc: Tabbed Documentation Expansion for Tolstoy-CLI

**Date:** 2026-05-22
**Topic:** Increasing documentation density using an interactive tabbed interface.

## 1. Overview
The goal is to provide deeper technical insights into the TolstoyLLM_v5 architecture and training processes. To manage the increased volume of text, code, and math, an interactive tabbed interface will be implemented for each major documentation section.

## 2. Structural Changes
A new `DocTabs` component will be created to manage internal section state. Each deep dive and tutorial will be split into four standard tabs:

### A. ОБЗОР (Overview)
*   **Analogy:** Simple explanation (e.g., the "Clinic" analogy for MoE).
*   **High-level flow:** What the component does in the model.
*   **Visual Diagram:** Basic overview diagram.

### B. КОД (Implementation)
*   **Code Snippets:** Detailed Python class/function implementation from `models/layers.py` or `trainer.py`.
*   **Logic Breakdown:** Step-by-step explanation of the code logic.
*   **Parameters:** Explanation of key hyperparameters.

### C. МАТЕМАТИКА (Math & Theory)
*   **Formulas:** Detailed KaTeX formulas for rotations, routing, and losses.
*   **Academic Context:** Brief mention of the papers/concepts (e.g., YaRN, NTK-Aware).
*   **Derivations:** Simplified logic of why the math works.

### D. FAQ & СОВЕТЫ (FAQ & Tips)
*   **Troubleshooting:** Common issues (e.g., NaN stability in RMSNorm).
*   **Pro-tips:** Hardware recommendations and tuning advice.

## 3. Implementation Plan

### UI Components
*   **`DocTabs`:** A generic tab switcher with neon styling.
*   **Expanded Content:** Populate all 5 new sections with detailed content extracted from `docs/**/*.md`.

### Styling
*   Tabs will feature hover glows and active states matching the site's accent colors (Cyan, Purple, Pink).
*   Ensure content transitions are smooth.

## 4. Success Criteria
*   Each of the 5 new sections has 3-4 tabs with unique content.
*   Documentation length is at least doubled in terms of raw information.
*   Navigation between tabs is intuitive and responsive.

## 5. Verification Plan
*   Manual check of all 20+ individual tab panels (5 sections * 4 tabs).
*   Verify KaTeX rendering across all tabs.
*   Ensure build stability with `npm run build`.
