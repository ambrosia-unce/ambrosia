# @ambrosia/cli

CLI tool for scaffolding Ambrosia framework projects.

## Installation

```bash
bun add -g @ambrosia/cli
```

## Usage

```bash
# Create a new project
ambrosia new my-app
ambrosia new my-app --arch clean

# Generate a standalone pack
ambrosia generate pack auth
ambrosia g pack auth
```

## Commands

| Command | Description |
|---------|-------------|
| `ambrosia new <name>` | Create a new Ambrosia project |
| `ambrosia generate pack <name>` | Generate a standalone pack project |

## Options

| Flag | Description |
|------|-------------|
| `--arch <pattern>` | Architecture pattern: `modular`, `layered`, `clean`, `cqrs` |
| `--help, -h` | Show help message |
| `--version, -v` | Show version |

## License

MIT
