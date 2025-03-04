<script lang="ts">
    import { selectedModel } from "../stores/common";
    import {getModels} from '../lib/api'
    import { onMount } from "svelte";
    let models = ["llama3.2", "deepseek-r1:7b"];

    onMount(async() => {
        models = await getModels()
    })
</script>

<select bind:value={$selectedModel}>
    {#each models as m}
        <option value={m}>
            {m}
        </option>
    {/each}
</select>
