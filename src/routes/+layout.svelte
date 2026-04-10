<script>
  import '../app.css';
  import { page } from '$app/stores';

  const tabs = [
    { href: '/', label: 'Search', icon: '🔍' },
    { href: '/files', label: 'Files', icon: '📁' },
    { href: '/boxes', label: 'Boxes', icon: '📦' },
    { href: '/add', label: 'Add', icon: '➕' }
  ];

  $: path = $page.url.pathname;
  $: isActive = (href) => href === '/' ? path === '/' : path.startsWith(href);
</script>

<div class="mx-auto flex h-full max-w-xl flex-col">
  <main class="flex-1 overflow-y-auto px-4 pb-28 pt-4">
    <slot />
  </main>

  <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90" style="padding-bottom: env(safe-area-inset-bottom);">
    <div class="mx-auto flex max-w-xl items-stretch justify-around">
      {#each tabs as t}
        <a
          href={t.href}
          class="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition {isActive(t.href) ? 'text-brand-600 dark:text-brand-50' : 'text-slate-500 dark:text-slate-400'}"
        >
          <span class="text-2xl leading-none">{t.icon}</span>
          <span>{t.label}</span>
        </a>
      {/each}
    </div>
  </nav>
</div>
