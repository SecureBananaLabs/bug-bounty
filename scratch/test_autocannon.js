import autocannon from 'autocannon';
autocannon({ url: 'http://localhost:4000/health', connections: 10, duration: 2 }, (err, result) => {
  console.log('err:', err);
  console.log('result:', JSON.stringify(result, null, 2));
});
