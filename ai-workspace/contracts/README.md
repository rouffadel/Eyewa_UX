# Contracts

API, event, and integration definitions shared across features.

## Layout

```
contracts/
├── openapi/       # REST OpenAPI specs
├── events/        # Event schemas (async, webhooks)
└── integrations/  # Third-party integration contracts
```

Add one file per bounded API or event stream. Reference from `specs/<feature>/plan.md`.
