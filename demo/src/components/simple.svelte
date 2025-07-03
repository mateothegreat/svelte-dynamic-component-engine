<script lang="ts">
  let testState = $state(0);
  let { name }: { name: string } = $props();
</script>

<div>name from $props(): {name}</div>

<button onclick={() => testState++}>{testState}</button>
