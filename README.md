# DuckLab

DuckLab is an in-browser data analytics toolkit. It features a modern notebook-style query interface, local and remote file imports, and file conversion capabilities, all powered by [DuckDB WASM](https://github.com/duckdb/duckdb-wasm) under the hood.

Future work:

- Excel file import/export support
- Demo datasets
- Data visualization (Vega?)
- Optional cloud save/share functionality?

## Getting started

### Prerequisites

Install [Bun](https://bun.sh) and (optionally) Node.js. For Nix users, there is a development flake provided.

### Installation

1. Clone the repository

2. Install dependencies:

```bash
bun install
```

3. Start the development server:

```bash
bun dev
```

## Inspiration

Shout out to [DataKit](https://datakit.page) for inspiring this project, and [MotherDuck](https://motherduck.com) for inspiring the notebook interface style.
