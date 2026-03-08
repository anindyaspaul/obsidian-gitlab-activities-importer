# Obsidian GitLab Activities Importer

Import your GitLab activities into the active daily note using the GitLab REST API.

## Features

- Command: **Import GitLab activities into current daily note**
- Imports events for the note's day (local timezone day based on note filename)
- Supports GitLab.com and self-managed GitLab instances
- Replaces one dedicated section in the note each run (idempotent)
- Includes push metadata such as branch, commit count, and latest commit title when present

## Requirements

- Daily note file name must contain a date in either `YYYY-MM-DD` or `YYYYMMDD`
- A GitLab personal access token (minimum scope: `read_user`)

## Setup

1. Install dependencies:

     ```bash
     npm install
     ```

2. Build the plugin:

     ```bash
     npm run build
     ```

3. In Obsidian, open **Settings → Community plugins → Obsidian GitLab Activities Importer**.
4. Configure:
     - **GitLab base URL** (for example `https://gitlab.com`)
     - **Personal access token** with at `read_user` and `read_api` permissions.
     - Optional output heading and pagination limits

## Usage

1. Open a daily note for the date you want to import.
2. Run command palette action: **Import GitLab activities into current daily note**.
3. The plugin writes results under the configured heading (default: `## GitLab activities`).

## Development

- Watch mode:

    ```bash
    npm run dev
    ```

- Lint:

    ```bash
    npm run lint
    ```

## Notes

- The GitLab events API can omit or truncate push details for some events.
- This plugin only requests data from your configured GitLab host when the import command is run.
