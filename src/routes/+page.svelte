<script>
  import { api } from '$lib/api.js';
  let q = '';
  let results = [];
  let loading = false;
  let timer;

  function onInput() {
    clearTimeout(timer);
    if (!q.trim()) { results = []; return; }
    timer = setTimeout(async () => {
      loading = true;
      try { results = await api.search(q); }
      catch (e) { console.error(e); }
      finally { loading = false; }
    }, 150);
  }
</script>

<header class="mb-4">
  <h1 class="text-2xl font-bold">Where did I put it?</h1>
  <p class="text-sm text-slate-500">Search across all your files & boxes</p>
</header>

<div class="sticky top-0 z-10 -mx-4 mb-4 bg-slate-50/95 px-4 py-2 backdrop-blur dark:bg-slate-950/95">
  <input
    bind:value={q}
    on:input={onInput}
    type="search"
    placeholder="e.g. tax 2023, passport, drill bit…"
    class="input text-lg"
    autocomplete="off"
  />
</div>

{#if loading}
  <p class="text-sm text-slate-500">Searching…</p>
{:else if q && results.length === 0}
  <div class="card text-center text-slate-500">No matches. Try fewer letters or different words.</div>
{:else if !q}
  <div class="card text-center text-slate-500">
    Type to search. Spelling mistakes are OK.
  </div>
{:else}
  <ul class="space-y-2">
    {#each results as r}
      <li>
        <a href={`/${r.kind === 'file' ? 'files' : 'boxes'}/${r.container_id}`} class="card flex items-center gap-3 active:scale-[0.99]">
          <span class="text-2xl">{r.kind === 'file' ? '📁' : '📦'}</span>
          <div class="flex-1 overflow-hidden">
            <div class="truncate font-semibold">{r.name}</div>
            <div class="truncate text-sm text-slate-500">
              {r.kind === 'file' ? 'File' : 'Box'} {r.container_label}
              {#if r.tags}<span class="ml-2">· {r.tags}</span>{/if}
            </div>
          </div>
          <span class="text-slate-400">›</span>
        </a>
      </li>
    {/each}
  </ul>
{/if}
