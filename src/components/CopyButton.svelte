<script lang="ts">
    import { ClipboardDocument, ClipboardDocumentCheck } from "svelte-heros-v2";
    import { tick } from "svelte";

    export let copied: boolean = false;
    export let text: string = "";
    let timeout: ReturnType<typeof setTimeout>;

    async function copyToClipboard() {
        await tick();
        navigator.clipboard
            .writeText(text)
            .then(() => {
                copied = true;
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    copied = false;
                }, 2000);
            })
            .catch((err) => {
                console.error("Failed to copy: ", err);
            });
    }
</script>

<button on:click={copyToClipboard}>
    {#if copied}
        <ClipboardDocumentCheck />
    {:else}
        <ClipboardDocument />
    {/if}
</button>
