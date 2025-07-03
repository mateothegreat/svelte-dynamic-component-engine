<script lang="ts">
  let testState = $state(1);
  let { name }: { name: string } = $props();
</script>

<div class="border-3 flex flex-col gap-4 rounded-md border-slate-500 p-4">
  <div class="border-3 flex items-center gap-2 rounded-md border-green-500 p-2 px-4">
    <span class="text-lg font-medium text-slate-500">name from $props():</span>
    <span class="text-lg font-medium text-green-400">{name}</span>
  </div>
  <div class="border-3 flex items-center gap-2 rounded-md border-green-500 p-2 px-4">
    <span class="text-lg font-medium text-slate-500">testState:</span>
    <span class="text-lg font-medium text-green-400">{testState}</span>
  </div>
  <button class="cursor-pointer rounded-md border-none bg-green-600 p-2 text-white transition-all duration-300 hover:bg-green-700 active:scale-95 active:bg-green-800" onclick={() => testState++}>
    <span class="text-lg font-medium">🔥 increment testState</span>
  </button>
</div>
