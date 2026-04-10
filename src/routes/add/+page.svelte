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

<header class="mb-4">
  <h1 class="text-2xl font-bold">➕ Quick Add</h1>
  <p class="text-sm text-slate-500">Drop a new item into a file or box</p>
</header>

{#if loading}
  <p class="text-slate-500">Loading…</p>
{:else}
  <div class="card space-y-3">
    <div class="flex gap-2">
      <button
        class="btn flex-1 {kind === 'file' ? 'btn-primary' : 'btn-ghost'}"
        on:click={() => (kind = 'file')}>📁 File</button>
      <button
        class="btn flex-1 {kind === 'box' ? 'btn-primary' : 'btn-ghost'}"
        on:click={() => (kind = 'box')}>📦 Box</button>
    </div>

    {#if filtered.length === 0}
      <p class="text-sm text-slate-500">
        No {kind === 'file' ? 'files' : 'boxes'} yet. <a class="text-brand-600" href={kind === 'file' ? '/files' : '/boxes'}>Create one →</a>
      </p>
    {:else}
      <select class="input" bind:value={container_id}>
        {#each filtered as c}
          <option value={String(c.id)}>{kind === 'file' ? 'File' : 'Box'} {c.label}</option>
        {/each}
      </select>

      <input class="input" placeholder="Item name (e.g. Tax return 2023)" bind:value={name} maxlength={LIMITS.ITEM_NAME_MAX} />
      <div class="text-right text-xs text-slate-400">{name.length}/{LIMITS.ITEM_NAME_MAX}</div>
      <input class="input" placeholder="Tags (comma separated, max {LIMITS.TAG_MAX_COUNT})" bind:value={tags} />
      <div class="text-right text-xs text-slate-400">{tags ? tags.split(',').filter(t => t.trim()).length : 0}/{LIMITS.TAG_MAX_COUNT} tags</div>
      <input class="input" placeholder="Notes (optional)" bind:value={notes} maxlength={LIMITS.NOTES_MAX} />

      {#if err}<p class="text-sm text-red-600">{err}</p>{/if}

      <button class="btn-primary w-full" on:click={submit} disabled={!name.trim() || saving}>
        {saving ? 'Saving…' : 'Add item'}
      </button>
    {/if}
  </div>
{/if}
