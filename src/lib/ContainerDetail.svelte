<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api.js';

  export let id;
  export let kind; // 'file' | 'box'

  let container = null;
  let items = [];
  let loading = true;
  let err = '';

  // add item form
  let showAdd = false;
  let name = '', notes = '', tags = '';

  // edit container form
  let editing = false;
  let label = '', cnotes = '';

  async function load() {
    loading = true;
    try {
      const data = await api.getContainer(id);
      container = data.container;
      items = data.items;
      label = container.label;
      cnotes = container.notes ?? '';
    } catch (e) { err = e.message; }
    loading = false;
  }

  async function addItem() {
    err = '';
    try {
      await api.createItem({ container_id: Number(id), name: name.trim(), notes, tags });
      name = ''; notes = ''; tags = '';
      showAdd = false;
      await load();
    } catch (e) { err = e.message; }
  }

  async function delItem(itemId) {
    if (!confirm('Delete this item?')) return;
    await api.deleteItem(itemId);
    await load();
  }

  async function saveContainer() {
    err = '';
    try {
      await api.updateContainer(id, { label: label.trim(), notes: cnotes });
      editing = false;
      await load();
    } catch (e) { err = e.message; }
  }

  async function delContainer() {
    if (!confirm(`Delete this ${kind} and all its items?`)) return;
    await api.deleteContainer(id);
    goto(kind === 'file' ? '/files' : '/boxes');
  }

  onMount(load);
</script>

{#if loading}
  <p class="text-slate-500">Loading…</p>
{:else if !container}
  <div class="card text-center text-slate-500">{err || 'Not found'}</div>
{:else}
  <header class="mb-4">
    <a href={kind === 'file' ? '/files' : '/boxes'} class="text-sm text-brand-600">‹ Back</a>
    <div class="mt-1 flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        {#if editing}
          <input class="input mb-2" bind:value={label} />
          <input class="input" placeholder="Notes" bind:value={cnotes} />
        {:else}
          <h1 class="truncate text-2xl font-bold">{kind === 'file' ? '📁 File' : '📦 Box'} {container.label}</h1>
          {#if container.notes}<p class="text-sm text-slate-500">{container.notes}</p>{/if}
        {/if}
      </div>
      <div class="flex shrink-0 gap-2">
        {#if editing}
          <button class="btn-primary" on:click={saveContainer}>Save</button>
          <button class="btn-ghost" on:click={() => (editing = false)}>Cancel</button>
        {:else}
          <button class="btn-ghost" on:click={() => (editing = true)}>Edit</button>
          <button class="btn-danger" on:click={delContainer}>Delete</button>
        {/if}
      </div>
    </div>
  </header>

  <div class="mb-3 flex items-center justify-between">
    <h2 class="font-semibold">Items ({items.length})</h2>
    <button class="btn-primary" on:click={() => (showAdd = !showAdd)}>{showAdd ? 'Cancel' : '+ Add item'}</button>
  </div>

  {#if showAdd}
    <div class="card mb-4 space-y-3">
      <input class="input" placeholder="Item name (e.g. Tax return 2023)" bind:value={name} />
      <input class="input" placeholder="Tags (comma separated)" bind:value={tags} />
      <input class="input" placeholder="Notes (optional)" bind:value={notes} />
      {#if err}<p class="text-sm text-red-600">{err}</p>{/if}
      <button class="btn-primary w-full" on:click={addItem} disabled={!name.trim()}>Add Item</button>
    </div>
  {/if}

  {#if items.length === 0}
    <div class="card text-center text-slate-500">No items yet.</div>
  {:else}
    <ul class="space-y-2">
      {#each items as it}
        <li class="card flex items-start gap-3">
          <div class="min-w-0 flex-1">
            <div class="font-semibold">{it.name}</div>
            {#if it.tags}<div class="mt-1 flex flex-wrap gap-1">{#each it.tags.split(',') as t}{#if t.trim()}<span class="chip">{t.trim()}</span>{/if}{/each}</div>{/if}
            {#if it.notes}<div class="mt-1 text-sm text-slate-500">{it.notes}</div>{/if}
          </div>
          <button class="text-red-500" aria-label="Delete" on:click={() => delItem(it.id)}>✕</button>
        </li>
      {/each}
    </ul>
  {/if}
{/if}
