"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { createServer, createStoryProvider, loadLocalEnvFile } = require("./server");

const request = {
  prompt: "A young botanist discovers flowers growing under a frozen lake.",
  reader: "General audience",
  purpose: "Entertainment",
};

const premise = {
  title: "The garden below",
  pitch: "A botanist follows a strange bloom beneath a frozen lake.",
  shape: "Braided mystery",
  twist: "The flowers are growing around a forgotten research station.",
  genre: "Mystery",
};

function fakeAnthropicFetch(result, onCall = () => {}) {
  return async (url, options) => {
    onCall(url, options);
    return {
      ok: true,
      status: 200,
      async json() {
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      },
    };
  };
}

test("Anthropic is the default and missing credentials fail clearly without a network call", async () => {
  let calls = 0;
  const provider = createStoryProvider({ env: {}, fetchImpl: async () => { calls += 1; } });
  assert.deepEqual(provider.status(), {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    configured: false,
  });
  await assert.rejects(provider.propose(request), {
    status: 503,
    message: /Set ANTHROPIC_API_KEY.*STORY_PROVIDER=demo/,
  });
  assert.equal(calls, 0);
});

test("local env loading supports explicit demo config without overriding process values", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "fableframe-env-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, ".env");
  fs.writeFileSync(file, "STORY_PROVIDER=demo\nANTHROPIC_API_KEY='example-only'\nPORT=9999\n");
  const env = { PORT: "4173" };
  loadLocalEnvFile(file, env);
  assert.equal(env.STORY_PROVIDER, "demo");
  assert.equal(env.ANTHROPIC_API_KEY, "example-only");
  assert.equal(env.PORT, "4173");
});

test("explicit demo mode adapts premises and produces a five-checkpoint story", async () => {
  const provider = createStoryProvider({ env: { STORY_PROVIDER: "demo" }, fetchImpl: async () => assert.fail("Demo mode must not call Anthropic") });
  const { premises } = await provider.propose(request);
  assert.equal(premises.length, 3);
  assert.notEqual(premises[0].shape, premises[1].shape);
  assert.ok(premises.some((option) => option.pitch.includes("botanist")));

  const { bible, outline } = await provider.blueprint({ ...request, premise: premises[1] });
  assert.equal(outline.length, 5);
  assert.equal(bible.characters.length, 2);
  assert.equal(outline[0].timing, "After");

  const page = await provider.page({ ...request, premise: premises[1], bible, outline, index: 0 });
  assert.equal(page.characterUpdates.length, bible.characters.length);
  assert.ok(page.content.join(" ").includes("botanist"));
  assert.deepEqual(page.consistencyNotes, []);
});

test("Anthropic calls stay server-side and enforce structured premise count", async () => {
  let seen;
  const provider = createStoryProvider({
    env: { ANTHROPIC_API_KEY: "test-secret", ANTHROPIC_MODEL: "test-model" },
    fetchImpl: fakeAnthropicFetch({ premises: [premise, { ...premise, title: "A second path" }, { ...premise, title: "A third path" }] }, (url, options) => {
      seen = { url, options };
    }),
  });
  const result = await provider.propose(request);
  assert.equal(result.premises.length, 3);
  assert.equal(seen.url, "https://api.anthropic.com/v1/messages");
  assert.equal(seen.options.headers["x-api-key"], "test-secret");
  assert.equal(JSON.parse(seen.options.body).model, "test-model");
  assert.equal(provider.status().configured, true);
});

test("page rewrites receive the story bible and both neighboring pages", async () => {
  const demo = createStoryProvider({ env: { STORY_PROVIDER: "demo" } });
  const { premises } = await demo.propose(request);
  const { bible, outline } = await demo.blueprint({ ...request, premise: premises[0] });
  const previousPage = { content: ["The earlier cut held the first clue."] };
  const nextPage = { content: ["The next cut reveals the consequence."] };
  let userPayload;
  const provider = createStoryProvider({
    env: { ANTHROPIC_API_KEY: "test-secret" },
    fetchImpl: fakeAnthropicFetch({ content: ["A revised page.", "The clue still matters."], consistencyNotes: [] }, (_url, options) => {
      userPayload = JSON.parse(JSON.parse(options.body).messages[0].content);
    }),
  });
  const result = await provider.page({
    ...request, premise: premises[0], bible, outline, index: 1,
    previousPage, nextPage, existingPage: { content: ["Old version."] }, rewrite: true,
  });
  assert.equal(result.content.length, 2);
  assert.equal(userPayload.bible.facts[0], bible.facts[0]);
  assert.deepEqual(userPayload.previousPage, previousPage);
  assert.deepEqual(userPayload.nextPage, nextPage);
});

test("invalid generated structure returns a retryable provider error", async () => {
  const provider = createStoryProvider({
    env: { ANTHROPIC_API_KEY: "test-secret" },
    fetchImpl: fakeAnthropicFetch({ premises: [premise] }),
  });
  await assert.rejects(provider.propose(request), {
    status: 502,
    message: /did not match the required story structure/,
  });
});

test("HTTP server exposes explicit mode, prompt-specific generation, and static assets", async (t) => {
  const server = createServer({ provider: createStoryProvider({ env: { STORY_PROVIDER: "demo" } }) });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const status = await fetch(`${base}/api/status`).then((response) => response.json());
  assert.deepEqual(status, { provider: "demo", model: null, configured: true });

  const premisesResponse = await fetch(`${base}/api/premises`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
  assert.equal(premisesResponse.status, 200);
  const { premises } = await premisesResponse.json();
  assert.equal(premises.length, 3);

  const blueprintResponse = await fetch(`${base}/api/blueprint`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...request, premise: premises[0] }),
  });
  assert.equal(blueprintResponse.status, 200);
  const { bible, outline } = await blueprintResponse.json();
  assert.equal(outline.length, 5);
  const pages = [];
  for (let index = 0; index < outline.length; index += 1) {
    const pageResponse = await fetch(`${base}/api/page`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...request, premise: premises[0], bible, outline, index, previousPage: pages[index - 1] || null }),
    });
    assert.equal(pageResponse.status, 200);
    const page = await pageResponse.json();
    assert.equal(page.characterUpdates.length, bible.characters.length);
    page.characterUpdates.forEach((update, characterIndex) => Object.assign(bible.characters[characterIndex], update));
    pages.push({ content: page.content });
  }
  assert.equal(pages.length, 5);

  const steeringResponse = await fetch(`${base}/api/steer`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...request, bible, checkpoint: outline[2], steering: "Let the companion share a secret." }),
  });
  assert.equal(steeringResponse.status, 200);
  assert.equal((await steeringResponse.json()).characterUpdates.length, bible.characters.length);

  const rewriteResponse = await fetch(`${base}/api/page`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...request, premise: premises[0], bible, outline, index: 2, rewrite: true,
      existingPage: pages[2], previousPage: pages[1], nextPage: pages[3],
    }),
  });
  assert.equal(rewriteResponse.status, 200);
  assert.equal((await rewriteResponse.json()).content.length, 2);

  const html = await fetch(base).then((response) => response.text());
  assert.match(html, /Fableframe/);
  const script = await fetch(`${base}/app.js`).then((response) => response.text());
  assert.doesNotMatch(script, /test-secret|ANTHROPIC_API_KEY\s*=/);
});
