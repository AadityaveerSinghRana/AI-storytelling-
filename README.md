# Fableframe

Fableframe turns an open-ended story request into three premise choices, a structured story bible and five cinematic checkpoints, then writes pages against the bible and evolving character state.

## Run with Anthropic

Requires Node.js 18 or newer. Copy `.env.example` to `.env`, replace the placeholder with your Anthropic API key, then run:

```sh
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY to your own key.
npm start
```

Open [http://localhost:4173](http://localhost:4173). The key stays in the server process and is never sent to browser code. If it is missing, the app clearly reports that generation is unavailable rather than silently pretending to use AI. `ANTHROPIC_MODEL` can be set to another Messages API model available to your account.

## Explicit template-only demo

To try the interface without an API key, explicitly select the non-AI template provider:

```sh
STORY_PROVIDER=demo npm start
```

The interface labels this as **Demo mode · template output**. Its examples are templates, not AI-generated stories.

## Tests

```sh
npm test
```

The tests use a mocked Anthropic HTTP response; they do not call Anthropic or require credentials.
