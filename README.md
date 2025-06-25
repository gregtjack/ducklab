# DuckPad

DuckPad is an in-browser data analytics toolkit built on top of DuckDB and WebAssembly. It features a modern notebook-style query interface, local and URL file imports, and file conversion capabilities.

Future work:

- Excel file import/export support
- Data visualization (Vega?)
- Some kind of optional cloud save functionality?

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

## Acknowledgments

I want to give shout-outs to [DataKit](https://datakit.page), [TabLab](https://tablab.com), and [MotherDuck](https://motherduck.com) for inspiring this project.
