<script>
  let exporting = false;
  let importing = false;
  let result = null;
  let err = '';
  let fileInput;

  async function doExport() {
    exporting = true;
    err = '';
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wheredidiputit-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { err = e.message; }
    exporting = false;
  }

  async function doImport() {
    const file = fileInput?.files?.[0];
    if (!file) return;
    importing = true;
    err = '';
    result = null;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Import failed');
      }
      result = await res.json();
      fileInput.value = '';
    } catch (e) { err = e.message; }
    importing = false;
  }
</script>

<header class="mb-5 flex items-center gap-3">
  <div class="icon-box bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <div>
    <h1 class="page-header">Backup</h1>
    <p class="page-subtitle">Export & import your data</p>
  </div>
</header>

<!-- Export -->
<div class="card mb-4 fade-in">
  <div class="flex items-start gap-3">
    <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0 dark:bg-blue-900/30 dark:text-blue-400">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="flex-1">
      <h2 class="font-semibold text-slate-900 dark:text-white">Export</h2>
      <p class="text-sm text-slate-500 mt-0.5">Download all your files, boxes, and items as a JSON file. Save it to Google Drive for safekeeping.</p>
      <button class="btn-primary mt-3" on:click={doExport} disabled={exporting}>
        {#if exporting}
          <span class="spinner mr-2"></span> Exporting...
        {:else}
          Download backup
        {/if}
      </button>
    </div>
  </div>
</div>

<!-- Import -->
<div class="card fade-in">
  <div class="flex items-start gap-3">
    <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0 dark:bg-amber-900/30 dark:text-amber-400">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="flex-1">
      <h2 class="font-semibold text-slate-900 dark:text-white">Import</h2>
      <p class="text-sm text-slate-500 mt-0.5">Restore from a previously exported JSON backup. Duplicates (same label or item name) are automatically skipped.</p>

      <div class="mt-3">
        <label class="block">
          <input
            bind:this={fileInput}
            type="file"
            accept=".json,application/json"
            class="block w-full text-sm text-slate-500
              file:mr-3 file:rounded-xl file:border-0
              file:bg-brand-50 file:px-4 file:py-2.5
              file:text-sm file:font-semibold
              file:text-brand-700 hover:file:bg-brand-100
              dark:file:bg-brand-900/20 dark:file:text-brand-400"
          />
        </label>
        <button
          class="btn-primary mt-3"
          on:click={doImport}
          disabled={importing}
        >
          {#if importing}
            <span class="spinner mr-2"></span> Importing...
          {:else}
            Upload & import
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

{#if err}
  <div class="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400 fade-in">
    {err}
  </div>
{/if}

{#if result}
  <div class="mt-4 card fade-in !bg-emerald-50 !border-emerald-200 dark:!bg-emerald-900/20 dark:!border-emerald-800">
    <h3 class="font-semibold text-emerald-800 dark:text-emerald-400">Import complete</h3>
    <div class="mt-2 space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
      <p>Containers imported: <strong>{result.containersImported}</strong> {#if result.containersSkipped}(skipped {result.containersSkipped} duplicates){/if}</p>
      <p>Items imported: <strong>{result.itemsImported}</strong> {#if result.itemsSkipped}(skipped {result.itemsSkipped} duplicates){/if}</p>
    </div>
  </div>
{/if}
