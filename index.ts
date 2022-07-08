import { binance } from 'ccxt';
import secret from './.secret.json';

console.log('你好，世界');
console.log(secret.SECRET_KEY);

async function main() {
  const client = new binance({
    apiKey: secret.API_KEY,
    secret: secret.SECRET_KEY,
    enableRateLimit: true,
  });
  await client.loadMarkets();
}

main();
