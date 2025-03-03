<script lang="ts">
    import { onMount } from 'svelte';
    import { createEventDispatcher } from "svelte";
    import { writable } from "svelte/store";
    import { isStreaming, focusTextarea } from "../stores/common";

    export let disabled: boolean = false;
    export let messageText: string = "";
    export let stopStreaming: () => void;
    export let sendMessage: () => Promise<void>; // Typo: should be handleSend
    let isComposing: boolean = false;
    let textareaRef: HTMLTextAreaElement;

    // 处理 Enter 键提交
    async function handelSend(event: KeyboardEvent) {
        // 如果正在输入法组合中，忽略 Enter 键
        if (isComposing) return;
        if (event.key === "Enter" && event.shiftKey) {
            console.log("es");
            const lineCount = messageText.split("\n").length;
            rows.set(Math.min(lineCount || 1, 2)); // Ensure minimum of 1 row
        } else if (event.key === "Enter") {
            await sendMessage();
            textareaRef.focus();
        }
    }

    // Function to scroll textarea into view when focused
    function ensureVisible() {
      if (/Android/.test(navigator.userAgent) && textareaRef) {
        setTimeout(() => {
          textareaRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300); // Delay to wait for keyboard to fully appear
      }
    }
  
    onMount(() => {
      // Add resize listener for Android keyboard
      if (/Android/.test(navigator.userAgent)) {
        window.addEventListener('resize', ensureVisible);
      }
  
      return () => {
        window.removeEventListener('resize', ensureVisible);
      };
        const unsubscribe = focusTextarea.subscribe((shouldFocus) => {
            if (shouldFocus && textareaRef) {
                textareaRef.focus();
                focusTextarea.set(false); // Reset the trigger
            }
        });

        return unsubscribe;
    });

    const rows = writable<number>(2);

    function onBlur() {
        rows.set(2);
    }

    const dispatch = createEventDispatcher<{
        change: string; // Define event name and payload type
    }>();

    function handleInput(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        dispatch("change", target.value);
    }

    function handleCompositionStart() {
        isComposing = true;
    }

    function handleCompositionEnd() {
        isComposing = false;
    }
    function handleLeftButton() {

    }
</script>

<textarea
    bind:value={messageText}
    bind:this={textareaRef}
    placeholder="Type a message..."
    class="flex-1 pl-12 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 resize-y"
    disabled={$isStreaming || disabled}
    on:input={handleInput}
    on:blur={onBlur}
    on:keydown={handelSend}
    on:compositionstart={handleCompositionStart}
    on:compositionend={handleCompositionEnd}
    rows={$rows}
></textarea>

<!-- Left Button -->
<button
    on:click={handleLeftButton}
    class="absolute left-2 top-2 px-3 bg-white-500 text-black rounded hover:bg-white-600 focus:outline-none"
>
    +
</button>
{#if $isStreaming}
    <button
        type="button"
        on:click={stopStreaming}
        class="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 disabled:opacity-50"
        {disabled}
    >
        ✋
    </button>
{:else}
    <button
        type="button"
        on:click={sendMessage}
        disabled={!messageText.trim()}
        class="absolute right-2 top-2 p-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
    >
        🌹
    </button>
{/if}
