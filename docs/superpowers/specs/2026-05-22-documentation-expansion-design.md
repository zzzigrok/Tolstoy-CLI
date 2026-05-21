# Design Doc: Documentation Expansion for Tolstoy-CLI Landing Page

**Date:** 2026-05-22
**Topic:** Expanding documentation with high-fidelity React components using local markdown sources.

## 1. Overview
The goal is to expand the documentation section of the landing page to include more technical depth and tutorials, transforming the local `.md` files into rich, interactive React components that match the existing visual style.

## 2. Structural Changes
The sidebar in `DocsView.tsx` will be reorganized into three categories:

### A. ОСНОВНОЕ (Core Concepts)
*   **Architecture:** High-level overview (Existing)
*   **CLI Guide:** Basic usage (Existing)
*   **Training:** Core training concepts (Existing)
*   **Tokenizer:** BPE internals (Existing)

### B. ТЕХНИЧЕСКИЕ РАЗБОРЫ (Deep Dives)
*   **RoPE & YaRN:** Detailed rotary embedding math and YaRN scaling. (Source: `docs/subdocs/rope.md`)
*   **Sparse MoE:** Expert routing, load balancing, and SwiGLU. (Source: `docs/subdocs/moe.md` & `swiglu.md`)
*   **Speculative Decoding:** Multi-token prediction and validation logic. (Source: `docs/subdocs/speculative.md`)

### C. ОБУЧАЮЩИЕ РЕЦЕПТЫ (Tutorials)
*   **Dataset Creation:** Preparing the corpus for training. (Source: `docs/tutorials/1_dataset_creation.md`)
*   **Training Guide:** Detailed manual for successful training runs. (Source: `docs/tutorials/2_training_guide.md`)

## 3. Implementation Details

### UI Components
*   Update `DocsView.tsx` to include category headers in the sidebar.
*   Implement new functional components: `RoPEDoc`, `MoEDoc`, `SpeculativeDoc`, `DatasetTutorialDoc`, `TrainingTutorialDoc`.
*   Maintain usage of `Math`, `CodeBlock`, and `AlertBox` for consistent rendering.

### Diagrams
*   Add custom CSS/HTML diagrams for MoE routing and Speculative Decoding flow.
*   Ensure all diagrams are responsive and themed.

### Navigation
*   Update `docsMenu` array to support categorization.
*   Ensure state management (`activeDoc`) correctly handles the expanded list.

## 4. Success Criteria
*   Sidebar is clearly categorized and scrollable.
*   Content is accurate and derived from local `.md` sources.
*   Visual fidelity matches the original landing page design.
*   Project builds successfully and passes linting.

## 5. Verification Plan
*   Manual verification of all new doc pages in the browser.
*   Check responsiveness of new diagrams.
*   Verify navigation between all 9 sections.
*   Run `npm run build` to ensure no build regressions.
