<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import { LIMITS } from '$lib/limits.js';
  let containers = [];
  let loading = true;
  let showAdd = false;
  let label = '';
  let notes = '';
  let err = '';

  async function load() {
    loading = true;
    containers = await api.listContainers('box');
    loading = false;
  }

  async function create() {
    err = '';
    try {
      await api.createContainer({ kind: 'box', label: label.trim(), notes });
      label = ''; notes = ''; showAdd = false;
      await load();
    } catch (e) { err = e.message; }
  }

  onMount(load);
</script>

<header class="mb-5 flex items-center justify-between">
  <div class="flex items-center gap-3">
    <div class="icon-box bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-4-9 4m18 0v8l-9 4m9-12l-9 4m0 0l-9-4m9 4v8m-9-12v8l9 4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div>
      <h1 class="page-header">Boxes</h1>
      <p class="page-subtitle">Physical boxes for things</p>
    </div>
  </div>
  <button class="btn-primary" on:click={() => (showAdd = !showAdd)}>{showAdd ? 'Cancel' : '+ New'}</button>
</header>

{#if showAdd}
  <div class="card mb-5 space-y-3 fade-in">
    <input class="input" placeholder="Label (e.g. A3 or Garage Top)" bind:value={label} maxlength={LIMITS.LABEL_MAX} />
    <div class="counter">{label.length}/{LIMITS.LABEL_MAX}</div>
    <input class="input" placeholder="Notes (optional)" bind:value={notes} maxlength={LIMITS.NOTES_MAX} />
    {#if err}<p class="text-sm text-red-600">{err}</p>{/if}
    <button class="btn-primary w-full" on:click={create} disabled={!label.trim()}>Create Box</button>
  </div>
{/if}

{#if loading}
  <div class="space-y-3">
    {#each [1,2,3] as _}<div class="skeleton h-20"></div>{/each}
  </div>
{:else if containers.length === 0}
  <div class="fade-in text-center mt-8">
    <div class="card !border-dashed !border-slate-300 py-10">
      <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
        <svg class="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M21 8l-9-4-9 4m18 0v8l-9 4m9-12l-9 4m0 0l-9-4m9 4v8m-9-12v8l9 4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <p class="text-slate-500 font-medium">No boxes yet</p>
      <p class="text-sm text-slate-400 mt-1">Tap "+ New" to create your first box</p>
    </div>
  </div>
{:else}
  <ul class="space-y-2.5 fade-in">
    {#each containers as c}
      <li>
        <a href={`/boxes/${c.id}`} class="card flex items-center gap-3.5 active:scale-[0.99]">
          <div class="icon-box bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-4-9 4m18 0v8l-9 4m9-12l-9 4m0 0l-9-4m9 4v8m-9-12v8l9 4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="flex-1 overflow-hidden">
            <div class="truncate font-semibold text-slate-900 dark:text-white">Box {c.label}</div>
            {#if c.notes}<div class="truncate text-sm text-slate-500">{c.notes}</div>{/if}
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="chip">{c.item_count}</span>
            <svg class="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </a>
      </li>
    {/each}
  </ul>
{/if}
