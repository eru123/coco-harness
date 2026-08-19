# Use the Web UI

Start the Web UI through the [root README](../../../README.md#run); the command prints its URL. This guide begins after that server is running. The `cch` process uses its invoking directory as the default filesystem location, but a fresh Web UI has no selected workspace until you add one.

## Configure a model

No provider is configured by default. Open **Settings → Models**, add a provider (for example the official DeepSeek route or any OpenAI-compatible endpoint), enter its API key, and save it. The model route becomes usable immediately without restarting the server.

The [model configuration guide](./providers.md) covers other providers and custom OpenAI-compatible endpoints.

## Choose a workspace

Click **Choose workspace**, add the project directory where you started `cch`, and select it. A workspace session's composer stays unavailable until a workspace is selected; a workspace-less task needs none (see below).

## Run a task

Start a session and send:

> Summarize this repository and identify its main packages.

The agent can read and edit workspace files, run commands, delegate work, and maintain a plan. The Web UI asks before operations that require approval under the active permission policy.

## Run a task without a workspace

Click **New task** in the hero to start a buddy session: a workspace-less conversation for tasks that do not belong to a project directory. The agent works from your home directory, so file-sorting, system, and application-management tasks run over everything you can access. Buddy sessions appear in the sidebar's **Tasks** bucket, ahead of the workspaces. Picking a workspace from the hero later starts a new workspace session; the task session itself never attaches to a directory.

## Continue

- [Configure models](./providers.md)
- [Use the Python SDK](./python-sdk.md)
- [Use other CLI modes](../../../apps/cli/README.md)
- [Develop a plugin](../develop/basic/)
