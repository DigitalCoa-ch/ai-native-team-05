# PROJECT INSTRUCTIONS: Team SPT

## Core Directives
1. **Do not rebuild the project from scratch** unless there is no existing structure.
2. **Preserve the current repository structure.**
3. **Keep the app compatible with our deployment setup (Vercel/Node.js).**
4. **Do not add a Node.js backend** unless absolutely necessary.
5. **Ensure the app runs and builds.**
6. **Commit all changes to main after every meaningful change.**
7. **Explain what you changed and how to test it.**

## Team Information
- **Team Name:** SPT
- **Project Name:** International Business Supplier Support
- **Industry:** International business / supplier risk management / small import businesses
- **GitHub:** https://github.com/DigitalCoa-ch/ai-native-team-05
- **Live URL:** https://team-05.apps.digitalcoa.ch/

## Day 1 Concept: Problem & Solution
Small import businesses face difficulty identifying whether international suppliers are credible. Bad decisions lead to financial loss or compliance issues. Our solution is an AI-supported supplier risk screening tool that checks inputs against checklists, mock country-risk data, and simulated reviews.

## Day 2 Workflow: Workflow & HITL
1. **Input:** User submits supplier name, country, category, documents, terms, and review notes.
2. **AI Action:** Extracts red flags, summarizes reviews, compares against mock geopolitical data, generates scores.
3. **Output:** Credibility score, completeness score, missing-document list, red-flag summary, recommended next steps.
4. **Human Review (HITL):** Human reviewer must make the final approval or rejection decision. AI does NOT automatically approve.

## Current Tasks
1. Improve the frontpage (landing section) and the interactive workflow prototype based on the visual requirements.
2. Ensure the "Workflow and Human-in-the-Loop Control" section clearly shows Input -> AI Processing -> Human Review -> Output.
3. Use mock data for the current prototype (e.g., NovaTextiles Ltd example).
