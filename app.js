(() => {
  "use strict";

  const STORAGE_KEY = "fableframe-stories-v1";
  const app = document.querySelector("#app");
  const state = {
    view: "home",
    stories: loadStories(),
    draft: null,
    selectedPremise: 0,
    activeStoryId: null,
    pageIndex: 0,
    steerOpen: false,
    busy: false,
    returnView: "home",
    pageStartedAt: Date.now(),
    signals: { skips: 0, rereads: 0, favorites: 0 },
  };

  function loadStories() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.warn("Could not read the local story library.", error);
      return [];
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stories));
    } catch (error) {
      toast("Your browser could not save this story. Check available storage.");
      console.error("Could not save the story library.", error);
    }
  }

  const provider = {
    name: "Demo Story Engine",
    propose(input) {
      const seed = input.seed.trim();
      const subject = seed || "a forgotten signal";
      const genre = input.genre;
      const options = [
        {
          title: `The last ${genre === "Mystery" ? "witness" : "transmission"} from Bellweather`,
          pitch: `A quiet archivist discovers that ${subject} has been arriving from a town erased from every map. The voice on the recording knows what happens next.`,
          shape: "Reverse mystery",
          twist: "The message is a memory sent backward, not a warning from the future.",
        },
        {
          title: "A map made of almosts",
          pitch: `When a midnight train stops between stations, a reluctant cartographer follows ${subject} through three passengers' sharply different versions of the same night.`,
          shape: "Braided timelines",
          twist: "The three strangers are remembering one choice from three possible lives.",
        },
        {
          title: "Where the blue hour ends",
          pitch: `A repairer of obsolete machines and a runaway weather-maker hunt ${subject} across a city that loses one hour every evening.`,
          shape: "Two-hander road story",
          twist: "The missing hour is where the city's residents have hidden their shared grief.",
        },
      ];
      return options.map((option, index) => ({ ...option, genre, index }));
    },
    createBible(input, premise) {
      const sequel = input.sequelFrom;
      const characters = sequel ? sequel.bible.characters.map((character) => ({
        ...character,
        memory: `${character.memory} They remember the first story and its promises.`,
        stateHistory: [],
      })) : [
        {
          name: "Mara Venn",
          role: "Sound archivist",
          traits: ["observant", "guarded", "dry humor"],
          goal: "Find the source of a voice that knows her childhood",
          voice: "Precise, quietly wry; notices sounds before faces",
          relationships: "Distrusts official records; trusts what people accidentally reveal",
          memory: "Keeps a brass tuning fork from her father's radio shop",
          change: "Deflects with analysis when grief gets close",
        },
        {
          name: "Ivo Saye",
          role: "Night-shift signal keeper",
          traits: ["patient", "superstitious", "generous"],
          goal: "Keep the last lighthouse signal burning",
          voice: "Plain-spoken, warm, and full of small weather metaphors",
          relationships: "Knows everyone on the night route, but lets few know him",
          memory: "Once switched off the signal to save a ship; someone never came home",
          change: "Offers help before he admits he is afraid",
        },
      ];
      return {
        characters,
        setting: "Bellweather, a coastal town where the old observatory and the harbor share one unreliable clock.",
        facts: [
          "The observatory clock loses eleven minutes whenever the blue signal appears.",
          "Mara carries her father's brass tuning fork; it rings near the hidden transmission.",
          "The lighthouse lamp is still lit, though the keeper's log ended years ago.",
        ],
        voice: `${input.genre} with tactile, intimate details; wonder without easy answers; suitable for ${input.reader.toLowerCase()}.`,
        constraints: [
          "No violence shown in graphic detail.",
          "A surprising reveal must feel earned by an earlier clue.",
          "Let the characters make imperfect choices and own the consequences.",
        ],
        arc: premise.shape,
        twist: premise.twist,
      };
    },
    createOutline(premise) {
      return [
        { label: "The signal before the storm", timing: "After", beat: "Mara hears her own voice on a recording dated tomorrow.", branch: "A clue arrives out of sequence", section: "I" },
        { label: "Eleven minutes missing", timing: "Before", beat: "Ivo admits the lighthouse clock has been wrong for years.", branch: "Trust becomes the first choice", section: "II" },
        { label: "The room behind the hour", timing: "Now", beat: "Together they find a room that exists only while the signal sounds.", branch: "A hidden memory opens", section: "III" },
        { label: "A voice to keep", timing: "After", beat: "Mara must decide whether to answer the message or let it end.", branch: "The story's emotional hinge", section: "IV" },
        { label: "When the clock holds", timing: "Later", beat: "The signal resolves into a truth neither character could have reached alone.", branch: "A changed future, not a tidy one", section: "V" },
      ].map((checkpoint, index) => ({
        id: `checkpoint-${index + 1}`,
        checkpoint: index + 1,
        ...checkpoint,
      }));
    },
    renderPage(bible, checkpoint, premise, index, previousPage) {
      const paragraphs = [
        [
          `The recording began with rain, though the sky above Bellweather was clear. Mara Venn turned the brass tuning fork in her palm and listened past the static. Then her own voice said, “Don't let the blue hour end.” The date stamped on the spool was tomorrow.`,
          `She had catalogued thousands of voices. None had ever sounded so much like a door left open. Across the harbor, the lighthouse lamp blinked once, then held its breath.`,
        ],
        [
          `Ivo Saye was waiting beside the keeper's log, a thermos between his hands. Eleven minutes had vanished from every clock in the harbor. “It happens when the signal comes,” he said. “I've been writing down what the town forgets.”`,
          `Mara wanted a measurement, a clean cause. Instead she asked why he had stayed. Ivo glanced toward the dark water. “Because someone has to notice when a light goes out.”`,
        ],
        [
          `They followed the tone below the observatory, past a staircase neither blueprint remembered. The tuning fork rang before Mara struck it. In the small room at the bottom, a reel-to-reel machine turned without a plug.`,
          `Ivo found his own handwriting on the label. The date was years old. His face changed when he read it, but he did not look away this time. “I thought the signal was asking me to forget,” he said. “Maybe it was asking me to keep listening.”`,
        ],
        [
          `The voice on the tape was younger than Mara remembered being. It spoke of her father's last night in the radio shop—not as a warning, but as a question he had never managed to ask her.`,
          `Mara could answer the signal and let the room close, or leave the tape turning until every lost minute returned. Ivo did not choose for her. He set the thermos down, and waited.`,
        ],
        [
          `“I heard you,” Mara said into the quiet. The blue lamp steadied. The clock kept its eleven minutes, and for the first time the harbor sounded like a place people lived rather than a recording of one.`,
          `Ivo opened the log to a blank page. Mara added the date, then his name, then her father's. Outside, the tide kept time without asking anyone to forgive it.`,
        ],
      ];
      const previousText = previousPage?.content.join(" ") || "";
      const continuityLine = index > 0 && previousText.includes("Ivo") ? " His words stayed with her as the next part came into focus." : "";
      return {
        id: `page-${index + 1}`,
        checkpointId: checkpoint.id,
        title: checkpoint.label,
        content: paragraphs[index].map((text, paragraphIndex) => `${text.replace("Bellweather", bible.setting.startsWith("Bellweather") ? "Bellweather" : "the town")}${premise.index === 1 && index === 2 ? " Somewhere above them, the night train passed without stopping." : ""}${paragraphIndex === 1 ? continuityLine : ""}`),
        status: "ready",
        consistency: [],
        favorite: false,
      };
    },
    evolve(story, checkpointIndex) {
      const progress = [
        [
          {
            goal: "Find the person behind the voice, not just the source of the signal",
            change: "Stops treating the recording as an abstract puzzle",
            memory: "Heard her own voice arrive from tomorrow; the mystery has become personal",
            relationships: "Begins to trust Ivo enough to ask why he stayed",
          },
          {
            goal: "Keep the signal burning and learn who else can hear it",
            change: "Offers quiet help, then waits to see what Mara chooses",
            memory: "Mara heard the signal too; he is no longer the only witness",
            relationships: "Lets Mara see his worry without turning it into a joke",
          },
        ],
        [
          {
            goal: "Find out why the signal is tied to Ivo's old log",
            change: "Asks a human question before reaching for an instrument",
            memory: "Chose to ask Ivo why he stayed instead of demanding proof",
            relationships: "Trust grows through an answer neither planned to give",
          },
          {
            goal: "Tell Mara why he stayed at the lighthouse",
            change: "Names the fear underneath his duty",
            memory: "The keeper's log is not only a record of what went wrong",
            relationships: "Trusts Mara with the story he has kept out of the log",
          },
        ],
        [
          {
            goal: "Discover who the voice was trying to reach, not only where it came from",
            change: "Lets the memory be evidence without reducing it to evidence",
            memory: "The room behind the hour holds Ivo's handwriting and a voice from home",
            relationships: "Recognizes that Ivo's silence has been its own kind of listening",
          },
          {
            goal: "Stay beside Mara while the old message plays",
            change: "Admits uncertainty instead of hiding behind the keeper's log",
            memory: "A room can keep what a person is not ready to say aloud",
            relationships: "Offers presence without deciding what Mara should do",
          },
        ],
        [
          {
            goal: "Answer her father honestly, even if the room closes",
            change: "Names grief without hiding inside analysis",
            memory: "Her father's last message was a question, not a warning",
            relationships: "Allows Ivo to witness a choice she once thought was private",
          },
          {
            goal: "Give Mara room to choose, then help keep the harbor's story",
            change: "Learns that staying is not the same as carrying everything alone",
            memory: "Mara does not need his permission to answer the voice",
            relationships: "Their shared silence becomes a form of trust",
          },
        ],
        [
          {
            goal: "Keep the harbor's story alive without pretending time can be recovered",
            change: "Lets a memory be imperfect and shared",
            memory: "She answered the voice; the clock kept its missing minutes",
            relationships: "Chooses to preserve the truth with Ivo, not solve it alone",
          },
          {
            goal: "Keep the signal lit with someone else beside him",
            change: "Accepts that remembering is a shared practice",
            memory: "The harbor sounded lived-in again after Mara answered",
            relationships: "Writes Mara into the log as a keeper of the story",
          },
        ],
      ];
      const checkpoint = story.outline[checkpointIndex];
      story.bible.characters.forEach((character, characterIndex) => {
        const nextState = progress[checkpointIndex][characterIndex] || progress[checkpointIndex][0];
        character.goal = nextState.goal;
        character.change = nextState.change;
        character.memory = nextState.memory;
        character.relationships = nextState.relationships;
        character.stateHistory ||= [];
        character.stateHistory.push({ checkpointId: checkpoint.id, ...nextState });
      });
    },
    regeneratePage(pageIndex, story, previousPage, nextPage) {
      const characterNames = story.bible.characters.map((character) => character.name).join(" and ");
      const context = [previousPage?.content.join(" "), nextPage?.content.join(" ")].filter(Boolean).join(" ");
      const neighboringClue = context.includes("tuning fork") ? " The brass tuning fork answered with one clear note." : "";
      return [
        `${characterNames} found another way through the same turning point. ${story.pages[pageIndex].content[0].split(".")[0]}.${neighboringClue}`,
        `The choice still belonged to them; the details around it had shifted. ${story.pages[pageIndex].content[1]}`,
      ];
    },
    steer(story, prompt) {
      const target = story.bible.characters[0];
      target.memory += ` The reader steered: “${prompt}.”`;
      target.change = `Responds to the reader's direction while keeping their guarded instincts`;
      target.goal = `${target.goal}; now considers the reader's note`;
      target.stateHistory?.forEach((history) => {
        history.memory += ` The reader steered: “${prompt}.”`;
        history.change = target.change;
        history.goal = target.goal;
      });
      return target.name;
    },
    createSequel(source) {
      const input = {
        reader: source.reader,
        purpose: source.purpose,
        genre: source.genre,
        seed: "a promise hidden in the lighthouse log",
        sequelFrom: source,
      };
      const premise = {
        title: "The logbook after midnight",
        pitch: `${source.bible.characters.map((character) => character.name).join(" and ")} return to Bellweather when a blank page in the keeper's log begins recording a ship that has not yet arrived.`,
        shape: "Returning character mystery",
        twist: "The missing page is written by a future version of the town, not a person.",
        genre: source.genre,
        index: 0,
      };
      return { input, premise };
    },
  };

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[char]));
  }

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function activeStory() {
    return state.stories.find((story) => story.id === state.activeStoryId);
  }

  function toast(message) {
    let node = document.querySelector(".toast");
    if (!node) {
      node = document.createElement("div");
      node.className = "toast";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      document.body.append(node);
    }
    node.textContent = message;
    node.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => node.classList.remove("show"), 2400);
  }

  function navButton(view, icon, label) {
    return `<button class="nav-button ${state.view === view ? "active" : ""}" data-view="${view}" ${state.busy ? "disabled" : ""}>
      <span class="nav-icon" aria-hidden="true">${icon}</span><span class="nav-text">${label}</span>
    </button>`;
  }

  function layout(content, crumb = "Your studio") {
    app.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar" aria-label="Main navigation">
          <div class="brand"><span class="brand-mark" aria-hidden="true">✦</span><span class="brand-name">fableframe</span></div>
          <p class="nav-label">Workspace</p>
          <nav class="nav">
            ${navButton("home", "⌂", "Home")}
            ${navButton("create", "＋", "New story")}
            ${navButton("library", "▤", `Story library${state.stories.length ? ` · ${state.stories.length}` : ""}`)}
          </nav>
          <div class="sidebar-bottom"><div class="sidebar-note"><strong>Every story has a cut.</strong><p>Follow the film checkpoints to see how each moment changes the story — and the people inside it.</p></div></div>
        </aside>
        <main class="main-area">
          <header class="topbar"><div class="crumb">${escapeHTML(crumb)}</div><div class="top-actions"><span class="demo-pill"><span class="demo-dot"></span>Provider-ready demo</span><span class="avatar" aria-label="Writer profile">W</span></div></header>
          <div class="content">${content}</div>
        </main>
      </div>
      <div class="toast" role="status" aria-live="polite"></div>`;
  }

  function renderHome() {
    state.view = "home";
    const stories = state.stories.slice(0, 3);
    layout(`
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow">A co-authoring studio</div>
          <h1>Stories that know <span class="gradient-text">where they're going.</span></h1>
          <p>Find your next story in a few small choices. Then watch it unfold through cinematic checkpoints, with characters who remember what they've lived.</p>
          <button class="button button-primary" data-action="start">✦ &nbsp;Begin a new story <span aria-hidden="true">→</span></button>
        </div>
        <div class="hero-visual" aria-hidden="true"><div class="film-line"></div><span class="film-node"></span><span class="film-node"></span><span class="film-node"></span><span class="film-frame"></span><span class="film-frame"></span><span class="film-frame"></span></div>
      </section>
      <div class="stats-row" aria-label="Your storytelling activity">
        <div class="stat-card"><span class="stat-icon">◈</span><div><div class="stat-value">${state.stories.length}</div><div class="stat-label">Stories in your library</div></div></div>
        <div class="stat-card"><span class="stat-icon">⌁</span><div><div class="stat-value">${state.stories.reduce((count, story) => count + (story.bible?.characters?.length || 0), 0)}</div><div class="stat-label">Characters with a past</div></div></div>
        <div class="stat-card"><span class="stat-icon">▣</span><div><div class="stat-value">${state.stories.reduce((count, story) => count + (story.outline?.length || 0), 0)}</div><div class="stat-label">Film checkpoints rendered</div></div></div>
      </div>
      <div class="section-heading"><div><h2>Your story shelf</h2><p>Stories, characters, and the worlds you've made together.</p></div><button class="button button-secondary button-small" data-view="library">Open library →</button></div>
      ${stories.length ? `<div class="story-grid">${stories.map(storyCard).join("")}</div>` : `<div class="empty-state">Your shelf is waiting for its first story.<br><br><button class="button button-secondary button-small" data-action="start">Make something unexpected</button></div>`}
    `);
  }

  function storyCard(story) {
    return `<article class="story-card"><div class="story-art" aria-hidden="true"></div><div class="story-card-title">${escapeHTML(story.title)}</div><div class="story-card-meta">${escapeHTML(story.genre)} · ${story.pages.length} pages · ${story.outline.length} checkpoints</div><button class="open-story" data-open-story="${escapeHTML(story.id)}" aria-label="Open ${escapeHTML(story.title)}">↗</button></article>`;
  }

  function renderIntake() {
    state.view = "create";
    layout(`
      <div class="eyebrow">A little direction goes a long way</div><h1>What kind of story <span class="gradient-text">are we making?</span></h1>
      <p class="subhead">Three small inputs are all you need. We'll bring back three genuinely different story paths for you to choose from.</p>
      <div class="form-layout" style="margin-top:27px">
        <form class="panel" id="intake-form">
          <div class="form-field"><label for="reader">Who is this story for?</label><select id="reader" name="reader"><option>General audience</option><option>Young reader (ages 8–12)</option><option>Teen reader</option><option>Myself</option><option>A friend or loved one</option></select><div class="field-hint">We'll tune voice and intensity for the reader.</div></div>
          <div class="form-field"><label for="purpose">What should it do?</label><select id="purpose" name="purpose"><option>Entertainment</option><option>Bedtime wind-down</option><option>Explore a feeling</option><option>Classroom discussion</option><option>A thoughtful gift</option></select></div>
          <div class="form-field"><label for="genre">What story flavor sounds good?</label><select id="genre" name="genre"><option>Literary mystery</option><option>Magical realism</option><option>Science fiction</option><option>Adventure</option><option>Quiet fantasy</option></select></div>
          <button class="button button-primary" type="submit">Find my three story paths <span aria-hidden="true">→</span></button>
        </form>
        <aside class="panel idea-panel"><div class="idea-mark">✧</div><h3>Not a blank page.</h3><p>We'll shape a premise, an outline, and a story bible before writing any prose. You choose the direction; the characters do the living.</p><div class="notice" style="margin-top:18px">Every story is arranged into film-like checkpoints—even when the timeline loops, braids, or jumps ahead.</div></aside>
      </div>`, "New story · Story seed");
  }

  function renderPremises() {
    state.view = "premises";
    const input = state.draft.input;
    const premises = state.draft.premises;
    layout(`
      <div class="eyebrow">Three distinct paths</div><h1>Which story would you <span class="gradient-text">follow?</span></h1>
      <p class="subhead">Each premise takes the same seed in a different structural direction. Pick one to shape its characters and outline.</p>
      <div class="premise-grid">${premises.map((premise, index) => `<button class="premise-card ${state.selectedPremise === index ? "selected" : ""}" data-premise="${index}" aria-pressed="${state.selectedPremise === index}"><span class="premise-number">PATH 0${index + 1} · ${escapeHTML(premise.shape)}</span><h3>${escapeHTML(premise.title)}</h3><p>${escapeHTML(premise.pitch)}</p><span class="premise-tag">${escapeHTML(input.genre)}</span></button>`).join("")}</div>
      <div class="bottom-actions"><button class="button button-secondary" data-action="back-intake">← Edit my choices</button><button class="button button-primary" data-action="choose-premise">Build the story bible →</button></div>`, "New story · Choose a premise");
  }

  function renderBlueprint() {
    state.view = "blueprint";
    const story = state.draft.story;
    const premise = state.draft.premise;
    layout(`
      <div class="eyebrow">Before the first page</div><h1>A story has a <span class="gradient-text">memory.</span></h1>
      <p class="subhead">This living story bible is the source of truth for every page, checkpoint, and character choice.</p>
      <div class="section-heading"><div><h2>${escapeHTML(premise.title)}</h2><p>${escapeHTML(premise.shape)} · ${escapeHTML(story.purpose)}</p></div><div class="status-chip">Structured story bible ready</div></div>
      <div class="form-layout">
        <section class="panel"><div class="eyebrow">Character agents</div><h3 style="margin-top:10px">People who can change</h3><div class="character-row">${story.bible.characters.map(characterCard).join("")}</div></section>
        <section class="panel"><div class="eyebrow">Film outline · ${story.outline.length} checkpoints</div><h3 style="margin-top:10px">A deliberate cut through time</h3><div class="timeline">${story.outline.map(checkpointRow).join("")}</div></section>
      </div>
      <div class="bible-grid">
        <div class="bible-section"><h3>World &amp; rules</h3><p>${escapeHTML(story.bible.setting)}<br><br>${story.bible.facts.map(escapeHTML).join("<br>")}</p></div>
        <div class="bible-section"><h3>Voice &amp; guardrails</h3><p>${escapeHTML(story.bible.voice)}<br><br>${story.bible.constraints.map(escapeHTML).join("<br>")}</p></div>
        <div class="bible-section"><h3>Emotional arc</h3><p>${escapeHTML(story.bible.arc)}: ${escapeHTML(story.bible.twist)}</p></div>
        <div class="bible-section"><h3>Story shape</h3><p>${story.outline.map((item) => `${escapeHTML(item.section)} · ${escapeHTML(item.timing)} — ${escapeHTML(item.beat)}`).join("<br>")}</p></div>
      </div>
      <div class="bottom-actions"><button class="button button-secondary" data-action="back-premises">← Choose another path</button><button class="button button-primary" data-action="render-story">Render this story <span aria-hidden="true">✦</span></button></div>`, "Story bible · Outline");
  }

  function characterCard(character) {
    return `<div class="character-card"><div class="character-top"><span class="character-avatar">${escapeHTML(character.name.split(" ").map((part) => part[0]).join(""))}</span><div><div class="character-name">${escapeHTML(character.name)}</div><div class="character-role">${escapeHTML(character.role)}</div></div></div><div class="trait-row">${character.traits.map((trait) => `<span class="trait-chip">${escapeHTML(trait)}</span>`).join("")}</div><p class="state-line"><strong>Wants:</strong> ${escapeHTML(character.goal)}</p><p class="state-line"><strong>Voice:</strong> ${escapeHTML(character.voice)}</p><p class="state-line"><strong>Remembers:</strong> ${escapeHTML(character.memory)}</p></div>`;
  }

  function checkpointRow(checkpoint, index) {
    return `<div class="checkpoint-row"><span class="checkpoint-dot">${String(index + 1).padStart(2, "0")}</span><div><div class="checkpoint-title">${escapeHTML(checkpoint.label)} <span class="branch-mark">${escapeHTML(checkpoint.timing)}</span></div><div class="checkpoint-desc">${escapeHTML(checkpoint.beat)} · ${escapeHTML(checkpoint.branch)}</div></div><span class="checkpoint-time">CUT ${checkpoint.section}</span></div>`;
  }

  async function renderStory() {
    if (state.busy) return;
    state.busy = true;
    state.view = "rendering";
    const story = state.draft.story;
    state.stories.unshift(story);
    state.activeStoryId = story.id;
    state.returnView = "home";
    renderProgress(0);
    for (let index = 0; index < story.outline.length; index += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      provider.evolve(story, index);
      story.outline[index].status = "rendered";
      const previousPage = story.pages[index - 1] || null;
      story.pages[index] = provider.renderPage(story.bible, story.outline[index], state.draft.premise, index, previousPage);
      story.pages[index].consistency = runContinuityCheck(story, story.pages[index]);
      story.renderedCheckpoints = index + 1;
      persist();
      renderProgress(index + 1);
    }
    state.busy = false;
    state.pageIndex = 0;
    state.view = "reader";
    state.pageStartedAt = Date.now();
    persist();
    renderReader();
  }

  function renderProgress(done) {
    const story = activeStory() || state.draft.story;
    const total = story.outline.length;
    layout(`
      <div class="render-layout">
        <section class="panel render-stage" aria-live="polite">
          <div class="eyebrow">Story rendering · ${done} of ${total} film cuts</div><h1>Finding the <span class="gradient-text">right frame.</span></h1>
          <p class="subhead">Writing each page against the story bible and its neighbors. The story is building in sequence; the timeline itself doesn't have to be.</p>
          <div class="render-progress" role="progressbar" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${total}"><span style="width:${Math.round(done / total * 100)}%"></span></div>
          <div class="render-log">${story.outline.map((checkpoint, index) => `<div class="render-step ${index < done ? "complete" : index === done ? "active" : ""}"><span class="render-check">${index < done ? "✓" : index === done ? "◌" : "·"}</span><span>Cut ${checkpoint.section} · ${escapeHTML(checkpoint.label)}</span>${index === done ? `<span class="branch-mark">near ${escapeHTML(checkpoint.timing.toLowerCase())}</span>` : ""}</div>`).join("")}</div>
        </section>
        <aside class="panel"><div class="eyebrow">The story behind the story</div><h3 style="margin-top:12px">${escapeHTML(story.title)}</h3><p class="muted" style="font-size:11px;line-height:1.6">${escapeHTML(story.bible.twist)}</p><div class="character-row" style="margin-top:20px">${story.bible.characters.map((character) => `<div class="character-card"><div class="character-name">${escapeHTML(character.name)}</div><p class="state-line">${escapeHTML(character.goal)}</p></div>`).join("")}</div></aside>
      </div>`, "Story rendering · Film checkpoints");
  }

  function runContinuityCheck(story, page) {
    const copy = page.content.join(" ").toLowerCase();
    const issues = [];
    story.bible.facts.forEach((fact) => {
      const key = fact.split(" ").slice(0, 3).join(" ").toLowerCase();
      if (copy.includes(key) && /wrong|never|doesn't|does not/i.test(copy)) issues.push(`Check story-bible fact: ${fact}`);
    });
    story.bible.characters.forEach((character) => {
      if (!copy.includes(character.name.toLowerCase()) && page.checkpointId === "checkpoint-1" && !story.bible.characters.some((other) => copy.includes(other.name.toLowerCase()))) {
        issues.push("This page doesn't name a story-bible character; verify the scene still tracks.");
      }
    });
    return issues;
  }

  function renderReader() {
    const story = activeStory();
    if (!story) { renderHome(); return; }
    state.view = "reader";
    const page = story.pages[state.pageIndex];
    const checkpoint = story.outline.find((item) => item.id === page.checkpointId);
    const continuity = runContinuityCheck(story, page);
    const elapsed = Math.max(0, Math.round((Date.now() - state.pageStartedAt) / 1000));
    layout(`
      <div class="reader-header"><div><div class="eyebrow">${escapeHTML(story.genre)} · ${escapeHTML(story.reader)}</div><h2 style="margin:5px 0">${escapeHTML(story.title)}</h2><div class="reader-meta">${escapeHTML(story.purpose)} · ${story.outline.length} cinematic checkpoints</div></div><div class="reader-controls"><button class="button button-secondary button-small" data-action="read-aloud" aria-label="Read this page aloud">◖ Read aloud</button><button class="button button-secondary button-small" data-action="export">⇩ Export</button></div></div>
      <div class="progress-wrap" aria-label="Story checkpoints">${story.outline.map((item, index) => `<span class="progress-step ${index <= state.pageIndex ? "done" : ""}">CUT ${item.section} · ${escapeHTML(item.label)}</span>`).join("")}</div>
      <div class="story-content" style="margin-top:24px">
        <div class="film-checkpoint"><div class="checkpoint-label">▣ &nbsp; Film checkpoint ${checkpoint.checkpoint} of ${story.outline.length} <span class="branch-mark">· ${escapeHTML(checkpoint.timing)} in the timeline</span></div><div class="checkpoint-name">${escapeHTML(checkpoint.label)}</div><div class="checkpoint-note">${escapeHTML(checkpoint.branch)} · ${escapeHTML(checkpoint.beat)}</div></div>
        ${continuity.length ? `<div class="notice">Continuity note: ${continuity.map(escapeHTML).join(" ")}</div>` : ""}
        <article class="page-copy" aria-label="Story page ${state.pageIndex + 1}">${page.content.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("")}</article>
        <div class="page-footer"><span class="page-number">PAGE ${String(state.pageIndex + 1).padStart(2, "0")} / ${String(story.pages.length).padStart(2, "0")} · ${elapsed}s on this page</span><div class="page-arrows"><button class="button button-secondary button-small" data-action="regenerate">↻ Rewrite page</button><button class="button button-secondary button-small" data-action="favorite">${page.favorite ? "★ Saved" : "☆ Save page"}</button></div></div>
        ${state.steerOpen ? `<div class="steer-box"><label for="steer-input">A small note for the characters</label><textarea id="steer-input" maxlength="160" placeholder="What should they notice, risk, or remember next?"></textarea><div class="steer-actions"><button class="button button-primary button-small" data-action="steer">Apply at this checkpoint</button></div></div>` : ""}
        <div class="page-context"><strong>Optional steering:</strong> add a thought near a checkpoint to let it shape character memory and the next cut. You can also just keep reading.</div>
        <div class="page-footer"><div class="engagement"><span class="feedback-pulse"></span>Quietly tracking reading rhythm · ${state.signals.skips} skips · ${state.signals.rereads} rereads</div><div class="page-arrows"><button class="button button-quiet button-small" data-action="steer-toggle">${state.steerOpen ? "Close steering" : "Steer story"}</button><button class="button button-primary button-small" data-action="next-page" ${state.pageIndex === story.pages.length - 1 ? "disabled" : ""}>Next page →</button></div></div>
      </div>
      <aside class="reader-side" style="margin-top:24px">
        <div class="panel"><div class="eyebrow">The living story bible</div><h3 style="margin-top:9px">Character state</h3>${story.bible.characters.map((person) => { const agentState = person.stateHistory?.find((entry) => entry.checkpointId === checkpoint.id) || person; return `<section class="character-state"><div class="character-name">${escapeHTML(person.name)} <span class="status-chip">evolving</span></div><p class="state-line"><strong>Wants:</strong> ${escapeHTML(agentState.goal)}</p><p class="state-line"><strong>Shift:</strong> ${escapeHTML(agentState.change)}</p><p class="state-line"><strong>Voice:</strong> ${escapeHTML(person.voice)}</p><div class="memory-callout"><strong>Memory:</strong> ${escapeHTML(agentState.memory)}</div></section>`; }).join("")}</div>
        <div class="panel"><div class="eyebrow">Story facts</div><div class="character-state" style="margin-top:11px"><p class="state-line">${story.bible.facts.map((fact) => `· ${escapeHTML(fact)}`).join("<br><br>")}</p><p class="state-line"><strong>Consistency scan:</strong> ${continuity.length ? `${continuity.length} note(s) to review` : "No known contradictions"}</p><div class="story-detail-actions"><button class="button button-secondary button-small" data-action="view-bible">Open full bible</button><button class="button button-secondary button-small" data-action="sequel">Start a sequel</button></div></div></div>
      </aside>`, `${story.title} · Read`);
  }

  function renderLibrary() {
    state.view = "library";
    layout(`<div class="eyebrow">Stories that stay yours</div><h1>Your <span class="gradient-text">story library.</span></h1><p class="subhead">Saved locally on this device. Continue reading, revisit a favorite page, or bring familiar characters back for another story.</p>
      <div class="bottom-actions"><span class="muted" style="font-size:11px">${state.stories.length} ${state.stories.length === 1 ? "story" : "stories"} · ${state.stories.reduce((total, story) => total + story.storiesRead, 0)} pages read</span><button class="button button-primary" data-action="start">＋ Start a new story</button></div>
      ${state.stories.length ? `<div class="story-grid" style="margin-top:24px">${state.stories.map((story) => `${storyCard(story)}<div class="story-detail-actions"><button class="button button-secondary button-small" data-open-story="${escapeHTML(story.id)}">Continue story</button><button class="button button-secondary button-small" data-sequel="${escapeHTML(story.id)}">Make a sequel</button></div>`).join("")}</div>` : `<div class="empty-state" style="margin-top:22px">Nothing on the shelf yet. Your first story will be saved here automatically.</div>`}`, "Story library");
  }

  function show(view) {
    if (view === "home") renderHome();
    else if (view === "create") renderIntake();
    else if (view === "library") renderLibrary();
    else if (view === "premises") renderPremises();
    else if (view === "blueprint") renderBlueprint();
    else if (view === "reader") renderReader();
  }

  function startIntake() {
    state.draft = null;
    state.returnView = state.view;
    renderIntake();
  }

  function preparePremises(form) {
    const input = {
      reader: form.get("reader"),
      purpose: form.get("purpose"),
      seed: "a forgotten signal",
      genre: form.get("genre"),
    };
    state.draft = { input, premises: provider.propose(input) };
    state.selectedPremise = 0;
    renderPremises();
  }

  function selectPremise(index) {
    const premise = state.draft.premises[index];
    state.selectedPremise = index;
    const input = { ...state.draft.input };
    const bible = provider.createBible(input, premise);
    const outline = provider.createOutline(premise);
    const story = {
      id: uid(),
      title: premise.title,
      genre: input.genre,
      reader: input.reader,
      purpose: input.purpose,
      seed: input.seed,
      createdAt: new Date().toISOString(),
      sequelOf: input.sequelFrom?.id || null,
      bible,
      outline,
      pages: [],
      storiesRead: 0,
      metrics: { favorites: 0, rewrites: 0, skips: 0, rereads: 0 },
    };
    state.draft.story = story;
    state.draft.premise = premise;
    renderBlueprint();
  }

  function trackPageChange(nextIndex) {
    const story = activeStory();
    if (!story || nextIndex < 0 || nextIndex >= story.pages.length) return;
    const dwell = Math.max(0, (Date.now() - state.pageStartedAt) / 1000);
    if (nextIndex > state.pageIndex) {
      story.storiesRead += 1;
      if (dwell < 2) { state.signals.skips += 1; story.metrics.skips += 1; }
    } else {
      state.signals.rereads += 1;
      story.metrics.rereads += 1;
    }
    state.pageIndex = nextIndex;
    state.pageStartedAt = Date.now();
    persist();
    renderReader();
  }

  function readAloud() {
    const story = activeStory();
    if (!("speechSynthesis" in window)) { toast("Read-aloud isn't supported in this browser."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(story.pages[state.pageIndex].content.join(" "));
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  }

  function exportStory() {
    const story = activeStory();
    const previousTitle = document.title;
    document.title = story.title;
    window.print();
    window.setTimeout(() => { document.title = previousTitle; }, 250);
  }

  async function regeneratePage() {
    const story = activeStory();
    const previousPage = story.pages[state.pageIndex - 1] || null;
    const nextPage = story.pages[state.pageIndex + 1] || null;
    const button = document.querySelector('[data-action="regenerate"]');
    if (button) { button.disabled = true; button.textContent = "Rewriting…"; }
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    story.pages[state.pageIndex].content = provider.regeneratePage(state.pageIndex, story, previousPage, nextPage);
    story.pages[state.pageIndex].consistency = runContinuityCheck(story, story.pages[state.pageIndex]);
    story.metrics.rewrites += 1;
    persist();
    renderReader();
    toast("Rewritten with the story bible and neighboring pages in context.");
  }

  function startSequel(sourceStory) {
    const { input, premise } = provider.createSequel(sourceStory);
    const bible = provider.createBible(input, premise);
    const outline = provider.createOutline(premise);
    const story = {
      id: uid(),
      title: premise.title,
      genre: input.genre,
      reader: input.reader,
      purpose: input.purpose,
      seed: input.seed,
      createdAt: new Date().toISOString(),
      sequelOf: sourceStory.id,
      bible, outline, pages: [], storiesRead: 0,
      metrics: { favorites: 0, rewrites: 0, skips: 0, rereads: 0 },
    };
    state.draft = { input, premise, story };
    state.returnView = "library";
    renderBlueprint();
  }

  app.addEventListener("click", async (event) => {
    const target = event.target.closest("button");
    if (!target || target.disabled) return;
    if (target.dataset.view) { show(target.dataset.view); return; }
    if (target.dataset.action === "start") { startIntake(); return; }
    if (target.dataset.action === "back-intake") { renderIntake(); return; }
    if (target.dataset.action === "back-premises") { renderPremises(); return; }
    if (target.dataset.premise !== undefined) { selectPremise(Number(target.dataset.premise)); return; }
    if (target.dataset.action === "choose-premise") { selectPremise(state.selectedPremise); return; }
    if (target.dataset.action === "render-story") { await renderStory(); return; }
    if (target.dataset.openStory) {
      state.activeStoryId = target.dataset.openStory;
      state.pageIndex = 0;
      state.pageStartedAt = Date.now();
      show("reader");
      return;
    }
    if (target.dataset.action === "next-page") { trackPageChange(state.pageIndex + 1); return; }
    if (target.dataset.action === "read-aloud") { readAloud(); return; }
    if (target.dataset.action === "export") { exportStory(); return; }
    if (target.dataset.action === "regenerate") { await regeneratePage(); return; }
    if (target.dataset.action === "favorite") {
      const story = activeStory();
      const page = story.pages[state.pageIndex];
      page.favorite = !page.favorite;
      story.metrics.favorites += page.favorite ? 1 : -1;
      persist(); renderReader(); toast(page.favorite ? "Page saved to favorites." : "Page removed from favorites."); return;
    }
    if (target.dataset.action === "steer-toggle") { state.steerOpen = !state.steerOpen; renderReader(); return; }
    if (target.dataset.action === "steer") {
      const prompt = document.querySelector("#steer-input")?.value.trim();
      if (!prompt) { toast("Add a short note before steering."); return; }
      const story = activeStory();
      const name = provider.steer(story, prompt);
      const upcoming = story.pages[state.pageIndex + 1];
      if (upcoming) upcoming.content[0] = `${upcoming.content[0]} ${name} kept the reader's note in mind.`;
      state.steerOpen = false;
      persist(); renderReader(); toast(`${name}'s memory updated for the next checkpoint.`); return;
    }
    if (target.dataset.action === "view-bible") { state.view = "blueprint"; state.draft = { story: activeStory(), premise: { title: activeStory().title, shape: activeStory().bible.arc } }; renderBlueprint(); return; }
    if (target.dataset.action === "sequel") { startSequel(activeStory()); return; }
    if (target.dataset.sequel) {
      const story = state.stories.find((item) => item.id === target.dataset.sequel);
      if (story) startSequel(story);
      return;
    }
  });

  app.addEventListener("submit", (event) => {
    if (event.target.id !== "intake-form") return;
    event.preventDefault();
    preparePremises(new FormData(event.target));
  });

  window.addEventListener("beforeunload", () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  });

  renderHome();
})();
