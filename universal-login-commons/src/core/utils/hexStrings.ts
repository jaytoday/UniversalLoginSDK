import {ensure} from './errors/ensure';

export const isProperHexString = (hexString: string) => {
  return !!hexString.match(/^0x([0-9A-Fa-f]{2})*$/);
};

export const isProperAddress = (address: string) => {
  return !!address.match(/^0x[0-9A-Fa-f]{40}$/);
};

export const reverseHexString = (hex: string) => {
  ensure(hex.startsWith('0x'), Error, 'Not a hex string');
  return hex.slice(0, 2) + hex.slice(2, hex.length).split('').reverse().join('');
};

export const createZeroedHexString = (bytesLength: number) => {
  return `0x${'00'.repeat(bytesLength)}`;
};

export const createFullHexString = (bytesLength: number) => {
  return `0x${'ff'.repeat(bytesLength)}`;
};
