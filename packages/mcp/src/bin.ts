import { main } from './index';

main(process.argv.slice(2)).catch((e: Error) => {
  process.stderr.write(`${e.message}\n`);
  process.exit(1);
});
