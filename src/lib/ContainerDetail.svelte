<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api.js';
  import { LIMITS } from '$lib/limits.js';

  export let id;
  export let kind;

  let container = null;
  let items = [];
  let loading = true;
  let err = '';

  let showAdd = false;
  let name = '', notes = '', tags = '';

  let editing = false;
  let label = '', cnotes = '';

  async function load() {
    loading = true;
    err = '';
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
  <div class="space-y-3">
    <div class="skeleton h-10 w-24"></div>
    <div class="skeleton h-16"></div>
    {#each [1,2] as _}<div class="skeleton h-20"></div>{/each}
  </div>
{:else if !container}
  <div class="fade-in text-center mt-8">
    <div class="card py-8">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
        <svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <p class="text-slate-500 font-medium">{err || 'Not found'}</p>
      <a href={kind === 'file' ? '/files' : '/boxes'} class="mt-3 inline-block text-sm font-medium text-brand-600">Go back</a>
    </div>
  </div>
{:else}
  <div class="fade-in">
    <a href={kind === 'file' ? '/files' : '/boxes'} class="inline-flex items-center gap-1 text-sm font-medium text-brand-600 mb-3 hover:text-brand-700">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Back
    </a>

    <div class="card mb-5">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="icon-box shrink-0 {kind === 'file' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}">
            {#if kind === 'file'}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {:else}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-4-9 4m18 0v8l-9 4m9-12l-9 4m0 0l-9-4m9 4v8m-9-12v8l9 4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {/if}
          </div>
          <div class="min-w-0 flex-1">
            {#if editing}
              <input class="input mb-2" bind:value={label} maxlength={LIMITS.LABEL_MAX} />
              <div class="counter">{label.length}/{LIMITS.LABEL_MAX}</div>
              <input class="input" placeholder="Notes" bind:value={cnotes} maxlength={LIMITS.NOTES_MAX} />
            {:else}
              <h1 class="truncate text-xl font-bold text-slate-900 dark:text-white">{kind === 'file' ? 'File' : 'Box'} {container.label}</h1>
              {#if container.notes}<p class="text-sm text-slate-500 mt-0.5">{container.notes}</p>{/if}
            {/if}
          </div>
        </div>
        <div class="flex shrink-0 gap-2">
          {#if editing}
            <button class="btn-primary !px-3 !py-2 !text-xs" on:click={saveContainer}>Save</button>
            <button class="btn-ghost !px-3 !py-2 !text-xs" on:click={() => (editing = false)}>Cancel</button>
          {:else}
            <button class="btn-ghost !px-3 !py-2 !text-xs" on:click={() => (editing = true)}>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="btn-danger !px-3 !py-2 !text-xs" on:click={delContainer}>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          {/if}
        </div>
      </div>
    </div>

    {#if err}<p class="text-sm text-red-600 mb-3">{err}</p>{/if}

    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Items ({items.length})</h2>
      <button class="btn-primary !py-2 !text-xs" on:click={() => (showAdd = !showAdd)}>{showAdd ? 'Cancel' : '+ Add item'}</button>
    </div>

    {#if showAdd}
      <div class="card mb-4 space-y-3 fade-in">
        <input class="input" placeholder="Item name" bind:value={name} maxlength={LIMITS.ITEM_NAME_MAX} />
        <div class="counter">{name.length}/{LIMITS.ITEM_NAME_MAX}</div>
        <input class="input" placeholder="Tags (comma separated, max {LIMITS.TAG_MAX_COUNT})" bind:value={tags} />
        <div class="counter">{tags ? tags.split(',').filter(t => t.trim()).length : 0}/{LIMITS.TAG_MAX_COUNT} tags</div>
        <input class="input" placeholder="Notes (optional)" bind:value={notes} maxlength={LIMITS.NOTES_MAX} />
        <button class="btn-primary w-full" on:click={addItem} disabled={!name.trim()}>Add Item</button>
      </div>
    {/if}

    {#if items.length === 0 && !showAdd}
      <div class="card !border-dashed !border-slate-300 py-8 text-center">
        <p class="text-slate-400">No items yet. Tap "+ Add item" to start.</p>
      </div>
    {:else}
      <ul class="space-y-2">
        {#each items as it}
          <li class="card flex items-start gap-3">
            <div class="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0 dark:bg-slate-800">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold text-slate-900 dark:text-white">{it.name}</div>
              {#if it.tags}
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  {#each it.tags.split(',') as t}
                    {#if t.trim()}<span class="chip">{t.trim()}</span>{/if}
                  {/each}
                </div>
              {/if}
              {#if it.notes}<div class="mt-1 text-sm text-slate-500">{it.notes}</div>{/if}
            </div>
            <button class="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition shrink-0" aria-label="Delete" on:click={() => delItem(it.id)}>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}
