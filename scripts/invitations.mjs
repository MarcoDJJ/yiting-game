import { randomBytes,createHash } from 'node:crypto';
// Run privately on YOUR machine. Never commit this output or paste raw codes into public issues.
const hashes={};for(const name of ['yiting','marco']){const code=randomBytes(24).toString('hex');hashes[name]=createHash('sha256').update(code).digest('hex');console.log(`${name.toUpperCase()} private login code: ${code}`);}console.log('\nStore the following JSON as the Cloudflare encrypted secret PASSPORT_CODES:\n'+JSON.stringify(hashes));
