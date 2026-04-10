<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api.js';
  import { LIMITS } from '$lib/limits.js';

  let containers = [];
  let loading = true;

  let kind = 'file';
  let container_id = '';
  let name = '';
  let tags = '';
  let notes = '';
  let err = '';
  let saving = false;

  async function load() {
    containers = await api.listContainers();
    loading = false;
  }
  onMount(load);

  $: filtered = containers.filter((c) => c.kind === kind);
  $: if (filtered.length && !filtered.find((c) => String(c.id) === String(container_id))) {
    container_id = String(filtered[0].id);
  }

  async function submit() {
    err = '';
    saving = true;
    try {
      await api.createItem({
        container_id: Number(container_id),
        name: name.trim(),
        tags,
        notes
      });
      const target = kind === 'file' ? `/files/${container_id}` : `/boxes/${container_id}`;
      goto(target);
    } catch (e) {
      err = e.message;
      saving = false;
    }
  }
</script>

<header class="mb-5 flex items-center gap-3">
  <div class="icon-box bg-gradient-to-br from-brand-500 to-brand-700 text-white">
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14m-7-7h14" stroke-linecap="round"/></svg>
  </div>
  <div>
    <h1 class="page-header">Quick Add</h1>
    <p class="page-subtitle">Drop a new item into a file or box</p>
  </div>
</header>

{#if loading}
  <div class="space-y-3">
    <div class="skeleton h-12"></div>
    <div class="skeleton h-12"></div>
    <div class="skeleton h-12"></div>
  </div>
{:else}
  <div class="card space-y-4 fade-in">
    <div class="flex gap-2">
      <button
        class="flex-1 rounded-xl py-3 text-sm font-semibold transition-all duration-200
          {kind === 'file' ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-150 dark:bg-slate-800 dark:text-slate-400'}"
        on:click={() => (kind = 'file')}>
        <span class="flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          File
        </span>
      </button>
      <button
        class="flex-1 rounded-xl py-3 text-sm font-semibold transition-all duration-200
          {kind === 'box' ? 'bg-amber-50 text-amber-700 ring-2 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-150 dark:bg-slate-800 dark:text-slate-400'}"
        on:click={() => (kind = 'box')}>
        <span class="flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-4-9 4m18 0v8l-9 4m9-12l-9 4m0 0l-9-4m9 4v8m-9-12v8l9 4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Box
        </span>
      </button>
    </div>

    {#if filtered.length === 0}
      <div class="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800">
        <p class="text-sm text-slate-500">
          No {kind === 'file' ? 'files' : 'boxes'} yet.
          <a class="font-medium text-brand-600" href={kind === 'file' ? '/files' : '/boxes'}>Create one first</a>
        </p>
      </div>
    {:else}
      <select class="input" bind:value={container_id}>
        {#each filtered as c}
          <option value={String(c.id)}>{kind === 'file' ? 'File' : 'Box'} {c.label}</option>
        {/each}
      </select>

      <div>
        <input class="input" placeholder="Item name" bind:value={name} maxlength={LIMITS.ITEM_NAME_MAX} />
        <div class="counter">{name.length}/{LIMITS.ITEM_NAME_MAX}</div>
      </div>
      <div>
        <input class="input" placeholder="Tags (comma separated)" bind:value={tags} />
        <div class="counter">{tags ? tags.split(',').filter(t => t.trim()).length : 0}/{LIMITS.TAG_MAX_COUNT} tags</div>
      </div>
      <input class="input" placeholder="Notes (optional)" bind:value={notes} maxlength={LIMITS.NOTES_MAX} />

      {#if err}<p class="text-sm text-red-600 rounded-lg bg-red-50 p-3">{err}</p>{/if}

      <button class="btn-primary w-full !py-3.5" on:click={submit} disabled={!name.trim() || saving}>
        {#if saving}
          <span class="spinner mr-2"></span> Saving...
        {:else}
          Add item
        {/if}
      </button>
    {/if}
  </div>
{/if}
