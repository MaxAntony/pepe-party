#!/usr/bin/env node

import chalk from "chalk";
import { promises } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const { readdir, readFile } = promises;
const { log, clear } = console;

interface LineColor {
  start: number;
  end: number;
  color: number;
}

type FrameColor = LineColor[];

const __filename = fileURLToPath(import.meta.url);
const resourcesPath = dirname(__filename) + "/resources";
const framesPath = `${resourcesPath}/frames`;
const entitiesPath = `${resourcesPath}/frame-colors`;

async function frameColorsLoader(path: string): Promise<FrameColor[]> {
  const entities = await getFiles(path);
  const colorFrames: FrameColor[] = [];
  for (const entity of entities) {
    const frameColor: FrameColor = [];
    const lines = entity.split("\n");
    for (const line of lines) {
      const range = line.split("-");
      frameColor.push({
        start: parseInt(range[0]),
        end: parseInt(range[1]),
        color: parseInt(range[2]),
      });
    }
    colorFrames.push(frameColor.reverse());
  }
  return colorFrames;
}

async function getFiles(path: string) {
  const files = await readdir(path);
  const collator = new Intl.Collator([], { numeric: true });
  files.sort((a, b) => collator.compare(a, b));
  const framePromises: Promise<string>[] = [];
  for (const file of files) {
    framePromises.push(readFile(`${path}/${file}`, "utf-8"));
  }
  return Promise.all(framePromises);
}

function renderFrame(frame: string, frameColor: FrameColor): void {
  for (const sectionColor of frameColor) {
    const colorize = chalk.ansi256(sectionColor.color);
    const sectionFrame = frame.slice(sectionColor.start, sectionColor.end);
    const start = frame.slice(0, sectionColor.start);
    const end = frame.slice(sectionColor.end);
    frame = start + colorize(sectionFrame) + end;
  }
  log(frame);
}

async function main() {
  let frameIndex = 0;
  const frames: string[] = await getFiles(framesPath);
  const colorFrames: FrameColor[] = await frameColorsLoader(entitiesPath);

  setInterval(() => {
    clear();
    renderFrame(frames[frameIndex], colorFrames[frameIndex]);
    frameIndex++;
    if (frameIndex >= frames.length) {
      frameIndex = 0;
    }
  }, 100);
}

process.on("SIGINT", () => {
  console.clear();
  process.exit();
});

main();
