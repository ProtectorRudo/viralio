const LEVEL_L = 1;

interface VersionSpec {
  version: number;
  dataCodewords: number;
  ecCodewords: number;
  byteCapacity: number;
  alignmentCenters: number[];
}

const versions: VersionSpec[] = [
  { version: 1, dataCodewords: 19, ecCodewords: 7, byteCapacity: 17, alignmentCenters: [] },
  { version: 2, dataCodewords: 34, ecCodewords: 10, byteCapacity: 32, alignmentCenters: [6, 18] },
  { version: 3, dataCodewords: 55, ecCodewords: 15, byteCapacity: 53, alignmentCenters: [6, 22] },
  { version: 4, dataCodewords: 80, ecCodewords: 20, byteCapacity: 78, alignmentCenters: [6, 26] },
];

const gfExp = new Uint8Array(512);
const gfLog = new Uint8Array(256);
let value = 1;
for (let index = 0; index < 255; index += 1) {
  gfExp[index] = value;
  gfLog[value] = index;
  value <<= 1;
  if (value & 0x100) value ^= 0x11d;
}
for (let index = 255; index < 512; index += 1) gfExp[index] = gfExp[index - 255];

function gfMultiply(left: number, right: number): number {
  if (!left || !right) return 0;
  return gfExp[gfLog[left] + gfLog[right]];
}

function generatorPolynomial(degree: number): number[] {
  let polynomial = [1];
  for (let exponent = 0; exponent < degree; exponent += 1) {
    const next = new Array(polynomial.length + 1).fill(0) as number[];
    for (let index = 0; index < polynomial.length; index += 1) {
      next[index] ^= polynomial[index];
      next[index + 1] ^= gfMultiply(polynomial[index], gfExp[exponent]);
    }
    polynomial = next;
  }
  return polynomial;
}

function errorCorrection(data: number[], degree: number): number[] {
  const generator = generatorPolynomial(degree);
  const buffer = [...data, ...new Array(degree).fill(0) as number[]];
  for (let index = 0; index < data.length; index += 1) {
    const coefficient = buffer[index];
    if (!coefficient) continue;
    for (let offset = 0; offset < generator.length; offset += 1) {
      buffer[index + offset] ^= gfMultiply(generator[offset], coefficient);
    }
  }
  return buffer.slice(data.length);
}

class BitBuffer {
  readonly bits: boolean[] = [];

  append(value: number, length: number): void {
    for (let bit = length - 1; bit >= 0; bit -= 1) this.bits.push(((value >>> bit) & 1) === 1);
  }
}

function encodeData(text: string, spec: VersionSpec): number[] {
  const bytes = [...new TextEncoder().encode(text)];
  if (bytes.length > spec.byteCapacity) throw new Error("QR content is too long");

  const bits = new BitBuffer();
  bits.append(0b0100, 4);
  bits.append(bytes.length, 8);
  for (const byte of bytes) bits.append(byte, 8);

  const totalBits = spec.dataCodewords * 8;
  const terminator = Math.min(4, totalBits - bits.bits.length);
  for (let index = 0; index < terminator; index += 1) bits.bits.push(false);
  while (bits.bits.length % 8 !== 0) bits.bits.push(false);

  const data: number[] = [];
  for (let offset = 0; offset < bits.bits.length; offset += 8) {
    let byte = 0;
    for (let bit = 0; bit < 8; bit += 1) byte = (byte << 1) | (bits.bits[offset + bit] ? 1 : 0);
    data.push(byte);
  }
  let pad = true;
  while (data.length < spec.dataCodewords) {
    data.push(pad ? 0xec : 0x11);
    pad = !pad;
  }
  return data;
}

function formatBits(mask: number): number {
  let valueBits = (LEVEL_L << 3) | mask;
  let remainder = valueBits << 10;
  const generator = 0x537;
  while (bitLength(remainder) >= bitLength(generator)) {
    remainder ^= generator << (bitLength(remainder) - bitLength(generator));
  }
  return ((valueBits << 10) | remainder) ^ 0x5412;
}

function bitLength(valueBits: number): number {
  let length = 0;
  while (valueBits) {
    length += 1;
    valueBits >>>= 1;
  }
  return length;
}

type Module = boolean | null;

function finder(matrix: Module[][], row: number, column: number): void {
  const size = matrix.length;
  for (let dy = -1; dy <= 7; dy += 1) {
    const y = row + dy;
    if (y < 0 || y >= size) continue;
    for (let dx = -1; dx <= 7; dx += 1) {
      const x = column + dx;
      if (x < 0 || x >= size) continue;
      const dark = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 && (
        dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
      );
      matrix[y][x] = dark;
    }
  }
}

function alignment(matrix: Module[][], centers: number[]): void {
  for (const row of centers) {
    for (const column of centers) {
      if (matrix[row][column] !== null) continue;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          matrix[row + dy][column + dx] = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
        }
      }
    }
  }
}

function timing(matrix: Module[][]): void {
  const size = matrix.length;
  for (let index = 8; index < size - 8; index += 1) {
    if (matrix[index][6] === null) matrix[index][6] = index % 2 === 0;
    if (matrix[6][index] === null) matrix[6][index] = index % 2 === 0;
  }
}

function writeFormat(matrix: Module[][], mask: number): void {
  const size = matrix.length;
  const bits = formatBits(mask);
  for (let index = 0; index < 15; index += 1) {
    const dark = ((bits >>> index) & 1) === 1;
    if (index < 6) matrix[index][8] = dark;
    else if (index < 8) matrix[index + 1][8] = dark;
    else matrix[size - 15 + index][8] = dark;

    if (index < 8) matrix[8][size - index - 1] = dark;
    else if (index < 9) matrix[8][15 - index] = dark;
    else matrix[8][14 - index] = dark;
  }
  matrix[size - 8][8] = true;
}

function maskApplies(mask: number, row: number, column: number): boolean {
  switch (mask) {
    case 0: return (row + column) % 2 === 0;
    case 1: return row % 2 === 0;
    case 2: return column % 3 === 0;
    case 3: return (row + column) % 3 === 0;
    case 4: return (Math.floor(row / 2) + Math.floor(column / 3)) % 2 === 0;
    case 5: return (row * column) % 2 + (row * column) % 3 === 0;
    case 6: return ((row * column) % 2 + (row * column) % 3) % 2 === 0;
    default: return ((row + column) % 2 + (row * column) % 3) % 2 === 0;
  }
}

function placeData(matrix: Module[][], codewords: number[], mask: number): void {
  const size = matrix.length;
  let row = size - 1;
  let direction = -1;
  let byteIndex = 0;
  let bitIndex = 7;

  for (let column = size - 1; column > 0; column -= 2) {
    if (column === 6) column -= 1;
    while (true) {
      for (let offset = 0; offset < 2; offset += 1) {
        const x = column - offset;
        if (matrix[row][x] !== null) continue;
        let dark = false;
        if (byteIndex < codewords.length) dark = ((codewords[byteIndex] >>> bitIndex) & 1) === 1;
        if (maskApplies(mask, row, x)) dark = !dark;
        matrix[row][x] = dark;
        bitIndex -= 1;
        if (bitIndex < 0) {
          byteIndex += 1;
          bitIndex = 7;
        }
      }
      row += direction;
      if (row < 0 || row >= size) {
        row -= direction;
        direction = -direction;
        break;
      }
    }
  }
}

function makeMatrix(text: string, mask = 0): boolean[][] {
  const byteLength = new TextEncoder().encode(text).length;
  const spec = versions.find((candidate) => byteLength <= candidate.byteCapacity);
  if (!spec) throw new Error("QR content is too long");

  const data = encodeData(text, spec);
  const codewords = [...data, ...errorCorrection(data, spec.ecCodewords)];
  const size = 21 + (spec.version - 1) * 4;
  const matrix: Module[][] = Array.from({ length: size }, () => Array<Module>(size).fill(null));

  finder(matrix, 0, 0);
  finder(matrix, size - 7, 0);
  finder(matrix, 0, size - 7);
  alignment(matrix, spec.alignmentCenters);
  timing(matrix);
  writeFormat(matrix, mask);
  placeData(matrix, codewords, mask);
  return matrix.map((row) => row.map(Boolean));
}

export function qrSvg(text: string): string {
  const matrix = makeMatrix(text);
  const quiet = 4;
  const size = matrix.length + quiet * 2;
  const commands: string[] = [];
  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix.length; column += 1) {
      if (matrix[row][column]) commands.push(`M${column + quiet} ${row + quiet}h1v1h-1z`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="Código QR"><rect width="100%" height="100%" fill="#fff"/><path d="${commands.join("")}" fill="#000"/></svg>`;
}

export function qrMatrixForTesting(text: string): boolean[][] {
  return makeMatrix(text);
}

export function qrFormatBitsForTesting(mask = 0): number {
  return formatBits(mask);
}
