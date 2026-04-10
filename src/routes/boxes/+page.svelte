<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
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

<header class="mb-4 flex items-center justify-between">
  <div>
    <h1 class="text-2xl font-bold">📦 Boxes</h1>
    <p class="text-sm text-slate-500">Physical boxes for things</p>
  </div>
  <button class="btn-primary" on:click={() => (showAdd = !showAdd)}>{showAdd ? 'Cancel' : '+ New'}</button>
</header>

{#if showAdd}
  <div class="card mb-4 space-y-3">
    <input class="input" placeholder="Label (e.g. A3 or Garage Top)" bind:value={label} />
    <input class="input" placeholder="Notes (optional)" bind:value={notes} />
    {#if err}<p class="text-sm text-red-600">{err}</p>{/if}
    <button class="btn-primary w-full" on:click={create} disabled={!label.trim()}>Create Box</button>
  </div>
{/if}

{#if loading}
  <p class="text-slate-500">Loading…</p>
{:else if containers.length === 0}
  <div class="card text-center text-slate-500">No boxes yet. Tap "+ New" to add one.</div>
{:else}
  <ul class="space-y-2">
    {#each containers as c}
      <li>
        <a href={`/boxes/${c.id}`} class="card flex items-center gap-3 active:scale-[0.99]">
          <span class="text-2xl">📦</span>
          <div class="flex-1 overflow-hidden">
            <div class="truncate font-semibold">Box {c.label}</div>
            {#if c.notes}<div class="truncate text-sm text-slate-500">{c.notes}</div>{/if}
          </div>
          <span class="chip">{c.item_count} items</span>
        </a>
      </li>
    {/each}
  </ul>
{/if}
