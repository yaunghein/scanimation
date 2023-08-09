<script>
import { onMount } from 'svelte';

import { gsap } from 'gsap';
import { Draggable } from 'gsap/dist/Draggable';

import Switch from './components/Switch.svelte';

import convertFilesToBase64 from '$lib/utils/convertFilesToBase64';
import transformToImageObjects from '$lib/utils/transformToImageObjects';
import drawBars from '$lib/utils/drawBars';
import downloadImages from '$lib/utils/downloadImages';

onMount(() => {
  gsap.registerPlugin(Draggable);
});

let px = 1;
let images = [];
let name = '';

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

let autoPlay = true;
let speed = 20;
let speedPreset;
let drag;
let movingId;
let movingPixels = 0;

$: if (px) {
  autoPlay = false;
}

$: if (speedPreset) {
  console.log('reach');
  if (speedPreset === 'slow') speed = 20;
  if (speedPreset === 'medium') speed = 140;
  if (speedPreset === 'fast') speed = 200;
}

const animateMove = () => {
  const bars = document.getElementById('display-bars');
  const move = () => {
    if (movingPixels < 100) {
      movingPixels += 0.001 * speed;
    } else {
      movingPixels = 0;
    }
    bars.style.transform = `translateX(${movingPixels}px)`;
    movingId = requestAnimationFrame(move);
  };
  move();
};

const cancleMoveAnimation = () => {
  cancelAnimationFrame(movingId);
};

$: if (images.length > 0) {
  document.querySelector('#display-container').style.display = 'flex';
  generateBaseAndBars(px);

  if (autoPlay) {
    drag[0]?.disable();
    animateMove();
  } else {
    cancleMoveAnimation();
    if (drag) {
      drag[0].enable();
    } else {
      drag = Draggable.create('#display-bars', { type: 'x,y', edgeResistance: 0, bounds: '.display-inner-container' });
    }
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

<div class="overflow-hidden h-screen w-full p-5">
  <div class="h-full flex gap-5">
    <!-- Controls -->
    <div class="h-full w-1/4 flex flex-col">
      <div class="flex flex-col items-center pb-4 border-b border-gray-300">
        <img src="/sand-logo.gif" alt="SAND Studio" class="w-14 h-14 overflow-hidden rounded-full" />
        <h1 class="font-bold text-lg mt-3">SAND Scan</h1>
        <p class="text-sm text-gray-400">Scanimation by SAND Studio</p>
      </div>

      <div class="p-4 border-b border-gray-300">
        <h2 class="font-medium mb-2">Bar Width</h2>
        <div class="flex gap-5 items-center justify-between">
          <input
            type="range"
            bind:value={px}
            min="1"
            max="50"
            class="appearance-none bg-transparent cursor-pointer w-[15rem]"
          />
          <input
            type="number"
            bind:value={px}
            class="appearance-none px-2 w-[4rem] bg-gray-100 rounded-none border border-gray-200"
          />
        </div>
      </div>

      <div class="p-4 border-b border-gray-300">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="font-medium">Auto Play?</h2>
            <p class="text-xs text-gray-400">You can drag while this is off.</p>
          </div>
          <Switch bind:checked={autoPlay} />
        </div>

        <div class="mt-5">
          <h2 class="font-medium mb-2">Speed</h2>
          <div class="flex gap-5 items-center justify-between">
            <input
              type="range"
              bind:value={speed}
              min="1"
              max="200"
              class="appearance-none bg-transparent cursor-pointer w-[15rem]"
              on:change={() => (speedPreset = 'reset')}
            />
            <input
              type="number"
              bind:value={speed}
              class="appearance-none px-2 w-[4rem] bg-gray-100 rounded-none border border-gray-200"
              on:change={() => (speedPreset = 'reset')}
            />
          </div>

          <div class="mt-2 flex items-center gap-4 mb-1">
            <label class="text-xs flex item-center gap-1">
              <input type="radio" bind:group={speedPreset} name="speed" value="slow" class="accent-black" />
              Slow
            </label>
            <label class="text-xs flex item-center gap-1">
              <input type="radio" bind:group={speedPreset} name="speed" value="medium" class="accent-black" />
              Medium
            </label>
            <label class="text-xs flex item-center gap-1">
              <input type="radio" bind:group={speedPreset} name="speed" value="fast" class="accent-black" />
              Fast
            </label>
          </div>
        </div>
      </div>

      <div class="mt-auto flex flex-col gap-2">
        <label for="name">
          <input
            type="text"
            id="name"
            bind:value={name}
            placeholder="Enter Scanimation Name"
            class="appearance-none mt-1 px-2 w-full h-[2.9rem] bg-gray-100 rounded-none border border-gray-200 outline-black"
            autocomplete="off"
          />
        </label>

        <button
          use:handleDownload
          class="appearance-none mt-auto bg-black w-full h-12 text-white rounded-none cursor-pointer mr-10 border border-black"
        >
          Export
        </button>
      </div>
    </div>

    <!-- Animation -->
    <div class="grow bg-gray-50 border border-gray-200 rounded-none flex flex-col items-center justify-center gap-5">
      <div class="hidden">
        <canvas data-name="base" id="base" />
        <canvas data-name="bars" id="bars" />
      </div>

      <div id="display-container" class="mt-10 hidden items-center justify-center">
        <div class="display-inner-container relative overflow-hidden">
          <canvas data-name="base" id="display-base" />
          <canvas data-name="bars" id="display-bars" class="absolute top-0 right-0" />
        </div>
      </div>
      <label
        for="select-files"
        class="bg-transparent w-[200px] h-12 text-black rounded-none cursor-pointer grid place-items-center border border-gray-400 border-dashed"
      >
        <input use:handleFilesChange type="file" multiple id="select-files" class="hidden" />
        <span>Select Frames</span>
      </label>
    </div>
  </div>
</div>

<style>
input[type='range']::-webkit-slider-runnable-track {
  background: #000;
  height: 3px;
  border-radius: none;
}

input[type='range']::-moz-range-track {
  background: #000;
  height: 3px;
  border-radius: none;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none; /* Override default look */
  appearance: none;
  margin-top: -6.5px; /* Centers thumb on the track */
  background-color: #000;
  width: 1rem;
  height: 1rem;
  border-radius: 100vw;
}

input[type='range']::-moz-slider-thumb {
  -webkit-appearance: none; /* Override default look */
  appearance: none;
  margin-top: -6.5px; /* Centers thumb on the track */
  background-color: #000;
  width: 1rem;
  height: 1rem;
  border-radius: 100vw;
}
</style>
