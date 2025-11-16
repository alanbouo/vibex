# Contributing to X Enhancer

Thank you for your interest in contributing to X Enhancer! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/x-enhancer.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit: `git commit -m "Add feature: description"`
7. Push: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup instructions.

## Code Style

### JavaScript/React
- Use ES6+ syntax
- Follow Airbnb style guide
- Use meaningful variable names
- Add comments for complex logic
- Use async/await over promises

### File Naming
- Components: PascalCase (e.g., `Button.jsx`)
- Utilities: camelCase (e.g., `formatDate.js`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_URL`)

### Git Commit Messages
```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

Example:
```
feat(ai-writer): add tone selection

- Added dropdown for tone selection
- Updated AI service to use tone parameter
- Added tests for tone variations

Closes #123
```

## Pull Request Process

1. Update README.md with details of changes if needed
2. Update documentation
3. Ensure all tests pass
4. Request review from maintainers
5. Address review comments
6. Squash commits if requested

## Bug Reports

Use GitHub Issues with the bug report template:

**Title**: Clear, descriptive title

**Description**:
- What happened
- What you expected
- Steps to reproduce
- Environment (OS, Node version, etc.)
- Screenshots if applicable

## Feature Requests

Use GitHub Issues with the feature request template:

**Title**: Clear feature name

**Description**:
- Problem it solves
- Proposed solution
- Alternative solutions considered
- Additional context

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Run all tests
npm test --workspaces
```

## Code Review Guidelines

Reviewers should check:
- Code follows style guidelines
- Tests are included
- Documentation is updated
- No breaking changes (or properly documented)
- Security considerations addressed
- Performance implications considered

## Community

- Be respectful and constructive
- Follow code of conduct
- Help others learn
- Give credit where due

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
