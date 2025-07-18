import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let tagSetMap = null;
export async function getTagSetMap(){
  if(tagSetMap===null){
    tagSetMap = await readTags().then(parseTagSetMap);
  }
  return tagSetMap;
}
export async function readTags() {
  try {
    const data = await fs.readFile(`${__dirname}/Taglist.csv`, 'utf-8');
    return data;
  } catch (err) {
    throw new Error(err);
  }
}
function parseTagSetMap(str) {
  const lines = str.split("\n");
  let table = lines.map(line => line.split(','));
  const tagList = {};
  const insertIntoTagList = (key, val) => {
    if (val === "") {
      return;
    }
    key = key.toLowerCase();
    if (!(key in tagList)) {
      tagList[key] = new Set();
    }
    tagList[key].add(val);
  };
  for (let i = 1; i < table.length; i++) {
    const currentLine = table[i];
    const [operator, rankTag, _,
      professionTag, rangeTag, otherTag1,
      otherTag2, otherTag3] = currentLine;
    insertIntoTagList(rankTag, operator);
    insertIntoTagList(professionTag, operator);
    insertIntoTagList(rangeTag, operator);
    insertIntoTagList(otherTag1, operator);
    insertIntoTagList(otherTag2, operator);
    insertIntoTagList(otherTag3, operator);

  }
  return tagList;
}
