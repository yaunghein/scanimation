<script>
import { onMount } from 'svelte';

import convertFilesToBase64 from '$lib/utils/convertFilesToBase64';
import transformToImageObjects from '$lib/utils/transformToImageObjects';
import drawBars from '$lib/utils/drawBars';
import downloadImages from '$lib/utils/downloadImages';

import { gsap } from 'gsap';
import { Draggable } from 'gsap/dist/Draggable';

onMount(() => {
  gsap.registerPlugin(Draggable);
});

let px = 1;
let images = [];
let name = '';
let duration = 10;
let autoPlay = false;

const DISPLAY_WIDTH = 720;

const setDisplayDimention = (canvas, naturalWidth, naturalHeight, isBars) => {
  if (naturalWidth > 500) {
    if (isBars) {
      canvas.width = 2 * DISPLAY_WIDTH;
      canvas.height = DISPLAY_WIDTH * (naturalHeight / naturalWidth);
    } else {
      canvas.width = DISPLAY_WIDTH;
      canvas.height = DISPLAY_WIDTH * (naturalHeight / naturalWidth);
    }
  } else {
    canvas.width = isBars ? naturalWidth * 2 : naturalWidth;
    canvas.height = naturalHeight;
  }
};

const generateBaseAndBars = (px) => {
  const base = document.getElementById('base');
  const bars = document.getElementById('bars');

  const imgW = images[0].naturalWidth;
  const imgH = images[0].naturalHeight;

  base.width = imgW;
  base.height = imgH;

  bars.width = imgW * 2;
  bars.height = imgH;

  const ctx = base.getContext('2d');

  const sliceSequence = [...Array(1000).keys()].map((i) => i * px * images.length);
  for (const [index, image] of images.entries()) {
    for (const i of sliceSequence) {
      ctx.drawImage(image, i + px * index, 0, px, imgH, i + px * index, 0, px, imgH);
    }
  }

  drawBars(bars, images, px);

  const displayContainer = document.getElementById('display-base');
  const displayBase = document.getElementById('display-base');
  const displayBars = document.getElementById('display-bars');

  setDisplayDimention(displayContainer, imgW, imgH, false);
  setDisplayDimention(displayBase, imgW, imgH, false);
  setDisplayDimention(displayBars, imgW, imgH, true);

  const displayBaseCtx = displayBase.getContext('2d');
  const displayBarsCtx = displayBars.getContext('2d');

  displayBaseCtx.drawImage(base, 0, 0, base.width, base.height, 0, 0, displayBase.width, displayBase.height);
  displayBarsCtx.drawImage(bars, 0, 0, bars.width, bars.height, 0, 0, displayBars.width, displayBars.height);
};

$: if (duration && images.length > 0) {
  autoPlay = false;
  setTimeout(() => {
    autoPlay = true;
  }, 1000);
}

let move;
let drag;
$: if (images.length > 0) {
  console.log({ autoPlay });
  generateBaseAndBars(px);
  if (autoPlay) {
    drag[0]?.disable();
    move = gsap.fromTo(
      '#display-bars',
      { x: '0%' },
      {
        x: '50%',
        duration: duration * 3,
        ease: 'linear',
        repeat: -1,
      }
    );
    console.log('reach play');
  } else {
    move && move.kill();
    move && (move = undefined);
    drag = Draggable.create('#display-bars', { type: 'x,y', edgeResistance: 0, bounds: '.display-inner-container' });
  }
}

const handleFilesChange = async (node) => {
  node.addEventListener('change', async () => {
    const { files } = node;
    if (files.length === 0) return;

    const base64Images = await convertFilesToBase64(files);
    const imagesObjects = await transformToImageObjects(base64Images);
    images = imagesObjects;
  });
};

const handleDownload = (node) => {
  node.addEventListener('click', () => {
    if (name === '') {
      alert('Please enter your scanimation name.');
      return;
    }
    const base = document.getElementById('base');
    const bars = document.getElementById('bars');
    downloadImages(name, [base, bars]);
  });
};
</script>

<div class="overflow-hidden min-h-screen w-full p-10 flex flex-col items-center">
  <label
    for="select-files"
    class="bg-sky-600 w-[200px] h-10 text-white rounded-full cursor-pointer grid place-items-center"
  >
    <input use:handleFilesChange type="file" multiple id="select-files" class="hidden" />
    <span>Select Frames</span>
  </label>

  <!-- <div> -->
  <div class="hidden">
    <canvas data-name="base" id="base" />
    <canvas data-name="bars" id="bars" />
  </div>

  <div id="display-container" class="w-full h-full mt-10 flex items-center justify-center">
    <div class="  display-inner-container relative overflow-hidden">
      <canvas data-name="base" id="display-base" />
      <canvas data-name="bars" id="display-bars" class="absolute top-0 right-0" />
    </div>
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
        use:handleDownload
        class="appearance-none bg-sky-600 w-[120px] h-10 text-white rounded-full cursor-pointer mr-10"
      >
        Donwload
      </button>
      <label for="bar-width" class="flex items-center gap-2">
        Bar Width
        <input
          id="bar-width"
          type="number"
          bind:value={px}
          class="border border-sky-600 h-10 flex items-center outline-none rounded-full px-3 w-[6rem]"
        />
      </label>
      <button
        on:click={() => (autoPlay = !autoPlay)}
        class="bg-sky-600 mx-10 h-10 w-[10rem] rounded-full text-white grid place-items-center"
        >Auto Play: {autoPlay ? 'Off' : 'On'}</button
      >
      <label for="duration" class="flex items-center gap-2">
        Duration
        <input
          id="duration"
          type="number"
          bind:value={duration}
          class="border border-sky-600 h-10 flex items-center outline-none rounded-full px-3 w-[6rem]"
        />
      </label>
    </div>
  {/if}
</div>
