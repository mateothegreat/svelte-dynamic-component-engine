<script lang="ts">
  let testState = $state(1);
  let { name }: { name: string } = $props();
</script>

<div class="border-1 flex w-[600px] flex-col gap-2 rounded-md border-slate-700/50 p-4">
  <div class="flex flex-col gap-4">
    <p class="text-lg font-semibold text-fuchsia-500">Simple.svelte</p>
    <p class="text-sm font-medium text-slate-500">This is a simple component that is rendered on the receiving side.<br />See the <a href="https://github.com/mateothegreat/svelte-dynamic-component-engine/blob/main/demo/src/components/simple.svelte" class="text-green-400"> source code </a> for more details.</p>
  </div>
  <div class="border-1 mt-4 flex items-center gap-2 rounded-md border-slate-700/50 p-2 text-sm bg-zinc-800/50">
    <span class="font-medium text-slate-500">`name` from $props():</span>
    <span class="font-medium text-green-400">"{name}"</span>
  </div>
  <div class="border-1 flex items-center gap-2 rounded-md border-slate-700/50 p-2 text-sm bg-zinc-800/50">
    <span class="font-medium text-slate-500">testState:</span>
    <span class="font-medium text-green-400">{testState}</span>
  </div>
  <button class="mt-4 cursor-pointer rounded-md border-none bg-green-600 p-2 text-white transition-all duration-300 hover:bg-green-700 active:scale-95 active:bg-green-800" onclick={() => testState++}>
    <span class="font-medium">🔥 increment testState</span>
  </button>
</div>
