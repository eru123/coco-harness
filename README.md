# Coco Harness

Coco Harness (`cch`) is an open-source agent harness, initially created by [DeepSeek AI](https://deepseek.com) under the name **DeepSeek Harness** (`dsh`). It is now developed and maintained in this repository as Coco Harness.

It uses an architecture where **everything is a plugin**, and is powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://github.com/cordiverse/paper).

> Nothing is baked in. That's the point.

## Run

### Run from `npm`

Install `Node.js`, then run:

```sh
npx @coco-harness/cch web
```

The command starts the Web UI, served at `http://127.0.0.1:3080` by default. See [Web UI guide](docs/user/guide/index.md).

### Run from source

To run from a repository checkout:

```sh
git clone https://github.com/eru123/coco-harness.git
cd coco-harness
pnpm install
pnpm run build
pnpm cch web
```

## Community and support

- Feel free to submit feedback or bug reports through [GitHub Discussions](https://github.com/eru123/coco-harness/discussions).
- Add the [`cch-plugin`](https://github.com/topics/cch-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/Ycq5dCaS4">Coco Harness Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

For agents, follow [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
