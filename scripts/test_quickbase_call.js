(async ()=>{
  try {
    const url = 'http://localhost:5001/homma-analytics/us-central1/quickbaseProxy';
    const payload = {
      data: {
        method: 'POST',
        endpoint: 'query',
        body: {
          from: 'bs8cmihpr',
          select: [3],
          where: "{6.EX.'Active'}AND{292.EX.'Yes'}",
          options: { skip: 0, top: 1 }
        }
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('STATUS', res.status);
    const text = await res.text();
    console.log('BODY:\n', text);
  } catch (err) {
    console.error('REQUEST ERROR', err);
    process.exit(2);
  }
})();
