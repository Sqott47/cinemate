# Cinemate

This project requires a Telegram bot token to run the backend. The backend reads the token from the `TELEGRAM_BOT_TOKEN` environment variable.

## Configuration

1. Obtain a token for your Telegram bot.
2. Provide the token to the application by setting the `TELEGRAM_BOT_TOKEN` environment variable.
   - For example, in a shell:
     ```bash
     export TELEGRAM_BOT_TOKEN="<your token here>"
     ```
   - Or create a `.env` file and run the application with tools that load it (e.g. Docker Compose):
     ```env
     TELEGRAM_BOT_TOKEN=<your token here>
     ```
3. When using Docker Compose, ensure the environment variable is available. Docker Compose automatically reads variables from a `.env` file located next to `docker-compose.yml`.

## Development

To run backend tests:

```bash
pytest
```

The frontend does not define a test script yet, so `npm test` will fail with `Missing script "test"`.
