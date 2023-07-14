<script>
import Error from './+error.svelte';

let images;

const convertToBase64 = async (files) => {
  const filePromises = Array.from(files).map((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  });

  const results = await Promise.all(filePromises);
  return results;
};

const generateBaseImage = (node) => {
  node.addEventListener('change', async () => {
    const { files } = node;
    if (files.length === 0) return;

    const base64Images = await convertToBase64(files);
    images = base64Images;
    console.log(base64Images);
  });
};

const setBackground = (node, data) => {
  const { image, index } = data;

  node.style.background = `linear-gradient(to right, white 0, white 7px, transparent 7px, transparent 8px), url(${image})`;
  node.style.backgroundSize = '8px 100%, contain';
  node.style.backgroundPosition = '0px 0px 0px 0px';
  node.style.backgroundRepeatY = 'no-repeat';

  if (index === 0) {
    node.style.backgroundPosition = '0px 0px';
  } else {
    node.style.backgroundPositionX = `${1 * index}px`;
  }
};

const play = () => {
  document.getElementsByClassName('cover')[0].classList.toggle('opacity-0');
};

function downloadimage() {
  var node = document.getElementById('base-image');

  fetch('/api/generate-image', { method: 'POST', body: JSON.stringify({ html: node.outerHTML }) })
    .then((resp) => resp.json())
    .then((data) => {
      const img = new Image();
      img.src = data.image;
      document.body.appendChild(img);
      console.log(data.image);
    });
}
</script>

<input use:generateBaseImage type="file" accept="image/*" multiple />
<button on:click={play}>Play</button>
<button on:click={downloadimage}>Download</button>

{#if images}
  <div id="base-image" class="relative w-96 h-96">
    <div class="w-full h-full">
      {#each images as image, index}
        <h1>Hello</h1>
        <!-- <img src={image} alt="" class="border border-red-500 absolute mix-blend-multiply" /> -->
        <!-- <div use:setBackground={{ image, index }} class="absolute inset-0 mix-blend-multiply" /> -->
      {/each}
    </div>

    <div class="cover absolute z-50 inset-0 opacity-0" />
  </div>
{/if}
