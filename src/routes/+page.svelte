<script>
import { onMount } from 'svelte';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/dist/Draggable';
import JSZip from 'jszip';

onMount(() => {
  gsap.registerPlugin(Draggable);
});

let px = 1;
let images = [];
let realImages = [];
let name = '';

const displayWidth = 720;

const setDisplayDimention = (canvas, naturalWidth, naturalHeight) => {
  if (naturalWidth > 500) {
    canvas.width = displayWidth;
    canvas.height = displayWidth * (naturalHeight / naturalWidth);
  } else {
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;
  }
};

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

const transformToActualImages = (base64Images) => {
  return new Promise((resolve, reject) => {
    try {
      const images = [];
      for (const image of base64Images) {
        const actualImage = document.createElement('img');
        actualImage.src = image;
        images.push(actualImage);
      }
      resolve(images);
    } catch (error) {
      reject(error);
    }
  });
};

const drawBars = () => {
  const bars = document.getElementById('bars');
  const imagesCount = images.length;
  const barsCount = Math.ceil(bars.width / imagesCount);

  const ctx = bars.getContext('2d');
  for (const i of [...Array(barsCount).keys()]) {
    ctx.fillStyle = '#000';
    ctx.fillRect(i * imagesCount, 0, imagesCount - px, realImages[0].naturalHeight);
  }
};

const generateBaseImage = async (node) => {
  node.addEventListener('change', async () => {
    const { files } = node;
    if (files.length === 0) return;

    const base64Images = await convertToBase64(files);
    images = base64Images;

    const imagesX = await transformToActualImages(images);
    realImages = imagesX;

    const base = document.getElementById('base');
    const bars = document.getElementById('bars');

    const imgW = imagesX[0].naturalWidth;
    const imgH = imagesX[0].naturalHeight;

    base.width = imgW;
    base.height = imgH;

    bars.width = imgW;
    bars.height = imgH;

    const ctx = base.getContext('2d');

    const sliceSequence = [...Array(1000).keys()].map((i) => i * px * imagesX.length);
    for (const [index, image] of imagesX.entries()) {
      for (const i of sliceSequence) {
        ctx.drawImage(image, i + px * index, 0, px, imgH, i + px * index, 0, px, imgH);
      }
    }

    drawBars();

    const displayContainer = document.getElementById('display-base');
    const displayBase = document.getElementById('display-base');
    const displayBars = document.getElementById('display-bars');

    setDisplayDimention(displayContainer, imgW, imgH);
    setDisplayDimention(displayBase, imgW, imgH);
    setDisplayDimention(displayBars, imgW, imgH);

    const displayBaseCtx = displayBase.getContext('2d');
    const displayBarsCtx = displayBars.getContext('2d');

    displayBaseCtx.drawImage(base, 0, 0, base.width, base.height, 0, 0, displayBase.width, displayBase.height);
    displayBarsCtx.drawImage(bars, 0, 0, bars.width, bars.height, 0, 0, displayBars.width, displayBars.height);

    Draggable.create('#display-bars', { type: 'x,y', edgeResistance: 0, bounds: '#display-container' });
  });
};

const downloadImage = (node) => {
  node.addEventListener('click', () => {
    if (name === '') {
      alert('Please enter your scanimation name.');
      return;
    }

    const zip = new JSZip();
    const base = document.getElementById('base');
    const bars = document.getElementById('bars');

    for (const canvas of [base, bars]) {
      zip.file(`${canvas.dataset.name}.png`, canvas.toDataURL('image/png').split('base64,')[1], { base64: true });
    }

    zip.generateAsync({ type: 'blob' }).then((content) => {
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(content);
      downloadLink.download = `${name}-scanimation.zip`;
      downloadLink.click();
    });
  });
};
</script>

<div class="overflow-hidden min-h-screen w-full p-10 flex flex-col items-center">
  <label
    for="select-files"
    class="bg-sky-600 w-[200px] h-10 text-white rounded-full cursor-pointer grid place-items-center"
  >
    <input use:generateBaseImage type="file" multiple id="select-files" class="hidden" />
    <span>Select Frames</span>
  </label>

  <div class="hidden">
    <canvas data-name="base" id="base" />
    <canvas data-name="bars" id="bars" />
  </div>

  <div id="display-container" class="relative w-full h-full mt-10 flex items-center justify-center">
    <canvas data-name="base" id="display-base" />
    <canvas data-name="bars" id="display-bars" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
  </div>

  {#if images.length > 0}
    <div class="flex items-center justify-center gap-2 mt-10">
      <input
        bind:value={name}
        type="text"
        placeholder="Scanimation Name..."
        class="border border-sky-600 h-10 flex items-center outline-none rounded-full px-3 w-[12rem]"
      />
      <button
        use:downloadImage
        class="appearance-none bg-sky-600 w-[120px] h-10 text-white rounded-full cursor-pointer"
      >
        Donwload
      </button>
    </div>
  {/if}
</div>
