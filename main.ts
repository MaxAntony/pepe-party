#!/usr/bin/env node

import chalk from "chalk";
import { promises } from "fs";
import { setTimeout } from "timers/promises";

const { readdir, readFile } = promises;
const { log, clear } = console;

interface RangeColor {
  start: number;
  end: number;
  color: number;
}

const resourcesPath = "./resources";
const framesPath = `${resourcesPath}/frames`;
const entitiesPath = `${resourcesPath}/entities`;

async function entityLoader(path: string): Promise<RangeColor[][]> {
  const entities = await getFiles(path);
  const colorFrames: RangeColor[][] = [];
  for (const entity of entities) {
    const frameColor: RangeColor[] = [];
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
  let frames: string[] = [];
  const framePromises: Promise<string>[] = [];
  for (const file of files) {
    framePromises.push(readFile(`${path}/${file}`, "utf-8"));
  }
  frames = await Promise.all(framePromises);
  return frames;
}

async function render(frame: string, entity: RangeColor[]) {
  for (const range of entity) {
    const color = chalk.ansi256(range.color);
    const partColored = frame.slice(range.start, range.end);
    const start = frame.slice(0, range.start);
    const end = frame.slice(range.end);
    frame = start + color(partColored) + end;
  }
  log(frame);
}

async function main() {
  let frameIndex = 0;
  const frames: string[] = await getFiles(framesPath);
  const entities: RangeColor[][] = await entityLoader(entitiesPath);

  clear();
  while (true) {
    await render(frames[frameIndex], entities[frameIndex]);
    frameIndex++;
    if (frameIndex >= frames.length) {
      frameIndex = 0;
    }
    await setTimeout(100);
    clear();
  }
}

main();
