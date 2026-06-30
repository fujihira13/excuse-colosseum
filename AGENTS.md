# Repository Guidelines

## Project Structure & Module Organization

This repository currently contains the product and architecture plan for `言い訳コロシアム` in `README.md`. Keep planning documents at the root until implementation directories exist. Agent configuration lives under `.claude/`, `.codex/`, and `.agents/`; do not edit generated skill files unless the task is about agent setup.

When application code is added, use a predictable layout:

- `src/` or `app/`: Next.js/React frontend and API route code.
- `infra/`: AWS CDK, SAM, Terraform, or Step Functions definitions.
- `tests/` or `__tests__/`: unit and integration tests.
- `assets/`: static images, audio, prompt examples, and demo media.

## Build, Test, and Development Commands

No package manifest is present yet. After adding one, document the exact scripts in `package.json` and keep these names stable:

- `npm install`: install dependencies.
- `npm run dev`: start the local development server.
- `npm run lint`: run formatting and static checks.
- `npm test`: run automated tests.
- `npm run build`: verify production build output.

For AWS infrastructure, add validation commands beside the chosen tool, such as `npm run cdk synth` or `sam validate`.

## Coding Style & Naming Conventions

Prefer TypeScript for application and infrastructure code. Use 2-space indentation, `camelCase` for variables/functions, `PascalCase` for React components and classes, and `kebab-case` for route or asset filenames. Keep prompt templates, game scenarios, and scoring rules in small named modules rather than embedding large strings directly in handlers.

## Testing Guidelines

Add tests with each feature. Use unit tests for scoring logic, prompt assembly, and validation; use integration tests for API handlers, DynamoDB access, and Step Functions workflow boundaries. Name tests after behavior, for example `scoreExcuse.test.ts` or `generateScenario.spec.ts`. Mock Bedrock and external AWS calls by default; reserve live AWS tests for explicitly named integration suites.

## Commit & Pull Request Guidelines

The current history is minimal (`first commit`, `追加`), so use concise imperative commit messages, such as `Add MVP scenario generator` or `Fix scoring validation`. Pull requests should include a summary, test results, linked issue if available, screenshots for UI changes, and notes about AWS resources, environment variables, or cost-impacting changes.

## Security & Configuration Tips

Never commit AWS credentials, Bedrock keys, `.env` files, or generated secrets. Keep local scratch work in ignored folders such as `temp/` or `plan/`. For AI features, document guardrails for unsafe prompts, token limits, retry behavior, and logging so generated user content is handled deliberately.
