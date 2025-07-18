import { getTagSetMap } from "../Model/tagmodel.js"
import { promises as fsPromises } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import VALID_TAGS_DATA from "../helpers/tags.json" with { type: 'json' };

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);
const validTagSet = new Set(VALID_TAGS_DATA.map(tag => tag.toUpperCase()));

export const getCharactersByTags = async (req, res) => {
  const { tag1, tag2, tag3, tag4, tag5 } = req.query;
  const tagSetMap = await getTagSetMap();
};

const getMatchingTagList = (tagSetMap, tagsArr) => {
  const result = {};
  if (tagsArr.length === 0) {
    tagsArr = Object.keys(tagSetMap);
  }
  const key = tagsArr.sort();
  const tagSets = tagsArr.map(tag => tagSetMap[tag.toLowerCase()] || new Set());
  // Intersection requires node version 22+
  const intersection = tagSets.reduce((tagSet, x) => tagSet.intersection(x));
  result[key] = intersection;
  return result;
}

const getAllMatchingTags = (tagSetMap, arr) => {
  const totalCombinations = [];

  const getCombinations = (sourceArray, i = 0, curr = []) => {
    if (i === sourceArray.length) {
      totalCombinations.push(curr.slice());
      return;
    }
    curr.push(sourceArray[i]);
    getCombinations(sourceArray, i + 1, curr);
    curr.pop()
    getCombinations(sourceArray, i + 1, curr);
  }

  getCombinations(arr);

  const results = totalCombinations
    .filter(combination => combination.length > 0)
    .reduce((obj, combinationArray, i) => {
      const resultSet = getMatchingTagList(tagSetMap, combinationArray);
      if (resultSet[combinationArray].size > 0) {
        obj[combinationArray] = resultSet[combinationArray];
      }
      return obj;
    }, {});

  return results;
}

const loadSampleImageAsBase64 = async (samplePath = "../SampleImage/sampleImage.png") => {
  let filehandle;
  let sampleCompletePath = path.join(__dirname, samplePath);
  try {
    let base64String = await fsPromises.readFile(sampleCompletePath, { encoding: 'base64' });
    return base64String;
  } catch (e) {
    console.log("There was an error loading the file: " + sampleCompletePath);
    console.error(e);
  }
  finally {
    if (filehandle !== undefined)
      await filehandle.close();
  }
}
const sendBase64ImageToFreeOCR = async (image) => {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  const base64WithPrefix = "data:image/png;base64," + image;
  const params = new URLSearchParams();
  params.append('apikey', process.env.FREE_OCR_API_KEY);
  params.append('base64Image', base64WithPrefix);
  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers,
    body: params
  });
  const data = await response.json();
  return data;
}
const extractParsedText = (text) => text.ParsedResults[0].ParsedText;

const matchTagsFromParsedText = (text) => text.replaceAll("\r", "").split('\n').filter(tag => validTagSet.has(tag.toUpperCase()))


const testTagListRetrieval = async () => {
  try {
    const tagSetMap = await getTagSetMap();
    const sampleBase64Image = await loadSampleImageAsBase64();
    const jsonResponse = await sendBase64ImageToFreeOCR(sampleBase64Image);
    const parsedText = extractParsedText(jsonResponse);
    const matchedTagsFromAPI = matchTagsFromParsedText(parsedText);
    const tagMatches = getAllMatchingTags(tagSetMap, matchedTagsFromAPI);
    console.log(tagMatches)
  }
  catch (e) {
    console.log("There was an error testing TagListRetrieval");
    console.error(e);
  }
}
//testTagListRetrieval();
const tagSetMap = await getTagSetMap();
await loadSampleImageAsBase64()
  .then(sendBase64ImageToFreeOCR)
  .then(extractParsedText)
  .then(matchTagsFromParsedText)
  .then(tagList => getAllMatchingTags(tagSetMap, tagList))
  .then(r => console.log(r))
  .catch(err => "there was an error sending your image to OCR Server");

// console.log(matches)
//console.log(process.env.FREE_OCR_API_KEY)