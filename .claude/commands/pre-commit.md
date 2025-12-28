Review staged changes before commit. Run `git diff --cached`.

Check against CLAUDE.md patterns:
- No API keys or secrets in code
- Shell scripts use environment variables for configuration
- Worker code follows existing patterns in `worker/src/`
- Prompt templates include both positive and negative prompts
- R2 paths follow pattern: `recipes/{recipeId}/hero.{format}`

For worker changes, also verify:
- TypeScript compiles: `cd worker && npm run type-check`
- Tests pass: `cd worker && npm test`
- Lint passes: `cd worker && npm run lint`

Be concise. Only flag actual problems, not style preferences.

Output: Ready to commit OR Issues to address (with specifics)
