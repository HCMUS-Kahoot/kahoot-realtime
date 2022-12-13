import * as nanoid from 'nanoid';

export const createPollID = nanoid.customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  6,
);

export const createUserID = () => nanoid.nanoid();
export const createRoomID = () => nanoid.nanoid(10);
export const createRoomPIN = () => nanoid.nanoid(8);
