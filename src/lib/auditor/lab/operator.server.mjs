import {createHash, timingSafeEqual} from 'node:crypto';
import {AI_OPERATOR_SECRET_LENGTH} from './ai-contract.mjs';

const sessionKey = Symbol.for('architectmentor.auditor-lab.operator-session');
const validSecret = value => typeof value === 'string'
  && value.length === AI_OPERATOR_SECRET_LENGTH && !/[^0-9a-f]/.test(value);
const hash = value => createHash('sha256').update(value, 'ascii').digest();

export function createOperatorSession(secret) {
  if (!validSecret(secret)) throw new Error('Sekret operatora musi mieć 64 małe znaki szesnastkowe.');
  const expected = hash(secret);
  let spent = false;
  return Object.freeze({
    authorizes(value) {
      return validSecret(value) && timingSafeEqual(expected, hash(value));
    },
    consume() {
      if (spent) return false;
      spent = true;
      return true;
    }
  });
}

export function getOperatorSession() {
  return process[sessionKey];
}

export function initializeOperatorSession(secret) {
  if (getOperatorSession()) throw new Error('Sesja już istnieje. Zatrzymaj i uruchom nowy proces eksperymentalny.');
  // Astro/Vite may re-evaluate modules without replacing the process.
  Object.defineProperty(process, sessionKey, {value:createOperatorSession(secret)});
}
