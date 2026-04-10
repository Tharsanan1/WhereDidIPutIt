<script>
  import { api } from '$lib/api.js';
  let q = '';
  let results = [];
  let loading = false;
  let timer;
  let searched = false;

  function onInput() {
    clearTimeout(timer);
    if (!q.trim()) { results = []; searched = false; return; }
    timer = setTimeout(async () => {
      loading = true;
      searched = true;
      try { results = await api.search(q); }
      catch (e) { console.error(e); }
      finally { loading = false; }
    }, 150);
  }
</script>

<header class="mb-6 text-center">
  <div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/30">
    <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3" stroke-linecap="round"/></svg>
  </div>
  <h1 class="page-header text-3xl">Where did I put it?</h1>
  <p class="page-subtitle">Search across all your files & boxes</p>
</header>

<div class="sticky top-0 z-10 -mx-4 mb-5 px-4 py-2">
  <div class="relative">
    <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3" stroke-linecap="round"/></svg>
    <input
      bind:value={q}
      on:input={onInput}
      type="search"
      placeholder="Search for anything..."
      class="input pl-12 text-lg !rounded-2xl !py-4 !shadow-md !border-slate-200/80"
      autocomplete="off"
    />
    {#if loading}
      <span class="absolute right-4 top-1/2 -translate-y-1/2 spinner"></span>
    {/if}
  </div>
</div>

{#if !searched && !q}
  <div class="fade-in mt-4 text-center">
    <div class="card !border-dashed !border-slate-300 py-8">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <svg class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <p class="text-slate-500 font-medium">Type to search</p>
      <p class="text-sm text-slate-400 mt-1">Spelling mistakes? No problem.</p>
    </div>
  </div>
{:else if loading}
  <div class="space-y-3 fade-in">
    {#each [1,2,3] as _}
      <div class="skeleton h-20"></div>
    {/each}
  </div>
{:else if searched && results.length === 0}
  <div class="fade-in text-center mt-4">
    <div class="card py-8">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
        <svg class="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <p class="text-slate-500 font-medium">No matches found</p>
      <p class="text-sm text-slate-400 mt-1">Try fewer letters or different words</p>
    </div>
  </div>
{:else}
  <ul class="space-y-2.5 fade-in">
    {#each results as r}
      <li>
        <a href={`/${r.kind === 'file' ? 'files' : 'boxes'}/${r.container_id}`} class="card flex items-center gap-3.5 active:scale-[0.99]">
          <div class="icon-box {r.kind === 'file' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}">
            {#if r.kind === 'file'}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {:else}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-4-9 4m18 0v8l-9 4m9-12l-9 4m0 0l-9-4m9 4v8m-9-12v8l9 4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {/if}
          </div>
          <div class="flex-1 overflow-hidden">
            <div class="truncate font-semibold text-slate-900 dark:text-white">{r.name}</div>
            <div class="truncate text-sm text-slate-500">
              {r.kind === 'file' ? 'File' : 'Box'} {r.container_label}
              {#if r.tags}<span class="ml-1 text-slate-400">· {r.tags}</span>{/if}
            </div>
          </div>
          <svg class="w-5 h-5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </li>
    {/each}
  </ul>
{/if}
