<script>
  import { page } from '$app/stores';
  import ContainerDetail from '$lib/ContainerDetail.svelte';
  $: id = $page.params.id;
</script>

{#key id}
  <ContainerDetail {id} kind="file" />
{/key}
