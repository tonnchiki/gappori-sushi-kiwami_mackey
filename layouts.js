'use strict';
// 17 fixed ordinary pockets. The special pocket is inserted at one block boundary.
const SushiLayouts = (() => {
  const rows = [
    ['122345','oya'], ['112355','oya'], ['14444','oya'], ['23345','okami'],
    ['1112345','oya'], ['13445','oya'], ['123344','okami'], ['113345','oya'],
    ['33335','oya'], ['22445','oya'], ['222335','either'], ['1122335','oya'],
    ['112445','oya'], ['12455','oya'], ['223334','oya'], ['122345','oya'],
    ['11555','okami'], ['22355','oya'], ['23345','oya'], ['13445','either'],
    ['123344','oya'], ['2222333','oya'], ['113345','oya'], ['111455','okami'],
    ['22445','okami'], ['222335','oya'], ['112445','oya'], ['223334','oya'],
    ['2222225','either']
  ];
  const presets = rows.map(([digits, mode], i) => ({number:i+1, groups:[...digits].map(Number), mode}));
  const names = {oya:'おやじSP', okami:'おかみSP', either:'どっちかSP'};
  const letter = i => String.fromCharCode(65+i);
  const nextNumber = n => n === 29 ? 1 : n+1;
  function buildLayout(groups, gap) {
    if (!Number.isInteger(gap) || gap < 0 || gap >= groups.length) throw Error('SPを置く境目を選んでください。');
    const labels = [];
    groups.forEach((count, i) => {
      for(let j=0;j<count;j++) labels.push(i);
      if(i === gap) labels.push(-1);
    });
    if(labels.length !== 18) throw Error('通常17穴＋SP1穴の配置が必要です。');
    return labels;
  }
  return {presets, names, letter, nextNumber, buildLayout};
})();
if(typeof module !== 'undefined') module.exports = SushiLayouts;
