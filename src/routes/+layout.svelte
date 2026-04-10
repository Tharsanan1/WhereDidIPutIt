<script>
  import '../app.css';
  import { page } from '$app/stores';

  const tabs = [
    { href: '/', label: 'Search', icon: 'search' },
    { href: '/files', label: 'Files', icon: 'folder' },
    { href: '/boxes', label: 'Boxes', icon: 'box' },
    { href: '/add', label: 'Add', icon: 'plus' },
    { href: '/backup', label: 'Backup', icon: 'backup' }
  ];

  $: path = $page.url.pathname;
  $: isActive = (href) => href === '/' ? path === '/' : path.startsWith(href);
</script>

<div class="mx-auto flex h-full max-w-xl flex-col">
  <main class="flex-1 overflow-y-auto px-4 pb-28 pt-6">
    <slot />
  </main>

  <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80" style="padding-bottom: env(safe-area-inset-bottom);">
    <div class="mx-auto flex max-w-xl items-stretch justify-around">
      {#each tabs as t}
        <a
          href={t.href}
          class="relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-all duration-200
            {isActive(t.href) ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}"
        >
          {#if isActive(t.href)}
            <span class="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-brand-600 dark:bg-brand-400"></span>
          {/if}
          <span class="transition-transform duration-200 {isActive(t.href) ? 'scale-110' : ''}">
            {#if t.icon === 'search'}
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3" stroke-linecap="round"/></svg>
            {:else if t.icon === 'folder'}
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {:else if t.icon === 'box'}
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-4-9 4m18 0v8l-9 4m9-12l-9 4m0 0l-9-4m9 4v8m-9-12v8l9 4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {:else if t.icon === 'plus'}
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14m-7-7h14" stroke-linecap="round"/></svg>
            {:else if t.icon === 'backup'}
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {/if}
          </span>
          <span class="text-[11px]">{t.label}</span>
        </a>
      {/each}
    </div>
  </nav>
</div>
