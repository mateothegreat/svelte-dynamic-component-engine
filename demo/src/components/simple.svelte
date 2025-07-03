<script lang="ts">
  let testState = $state(1);
  let { name }: { name: string } = $props();
</script>

<div class="border-3 flex w-[600px] flex-col gap-4 rounded-md border-slate-500 bg-zinc-600/20 p-5">
  <div class="flex flex-col gap-2">
    <p class="text-lg font-semibold text-pink-500">Simple Component</p>
    <p class="text-sm font-medium text-slate-500">This is a simple component that is rendered on the receiving side.<br />See the <a href="https://github.com/mateothegreat/svelte-dynamic-component-engine/blob/main/demo/src/components/simple.svelte" class="text-green-400"> source code </a> for more details.</p>
  </div>
  <div class="border-3 mt-4 flex items-center gap-2 rounded-md border-slate-500/50 p-2 px-4">
    <span class="text-lg font-medium text-slate-500">`name` from $props():</span>
    <span class="text-lg font-medium text-green-400">"{name}"</span>
  </div>
  <div class="border-3 flex items-center gap-2 rounded-md border-slate-500/50 p-2 px-4">
    <span class="text-lg font-medium text-slate-500">testState:</span>
    <span class="text-lg font-medium text-green-400">{testState}</span>
  </div>
  <button class="mt-4 cursor-pointer rounded-md border-none bg-green-600 p-2 text-white transition-all duration-300 hover:bg-green-700 active:scale-95 active:bg-green-800" onclick={() => testState++}>
    <span class="text-lg font-medium">🔥 increment testState</span>
  </button>
</div>
