# My Project

## Overview
This project is a TypeScript application that serves as an entry point for building scalable and maintainable software. It includes type definitions for improved type safety and follows best practices in application structure.

## Structure
- **src/app.ts**: The main entry point of the application, responsible for initializing the application logic, middleware, and routing.
- **src/types/index.ts**: Contains interfaces and types used throughout the application.
- **tsconfig.json**: TypeScript configuration file that specifies compiler options and files to include in the compilation.
- **package.json**: Configuration file for npm, listing dependencies and scripts for the project.

## Getting Started
To get started with this project, clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd my-project
npm install
```

## Running the Application
To run the application, use the following command:

```bash
npm start
```

## Contributing
Please read `AGENTS.md` for the repository guidelines (structure, scripts, lint/test rules).

Engineering principles:
- Follow SOLID principles and prefer clear design patterns when appropriate.
- All new code must include unit tests and keep coverage high for changed areas.

### Issue Templates
- Supertest (HTTP tests): `.github/ISSUE_TEMPLATE/millora-supertest.md`
- Husky + lint-staged: `.github/ISSUE_TEMPLATE/millora-husky-lint-staged.md`

Create a new issue on GitHub and select the relevant template. Link issues in PRs using `Closes #<num>`.

## License
This project is licensed under the MIT License.
