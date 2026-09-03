const query = 'Honda P0420 parts diagram schematic'.replace(/\s+/g, '+')
const htmlRes = await fetch(\https://duckduckgo.com/?q=\\, {
  headers: { 'User-Agent': 'Mozilla/5.0' }
})
const html = await htmlRes.text()
const vqdMatch = html.match(/vqd=(["']?)([\d-]+)\1/)
const vqd = vqdMatch[2]

const imgRes = await fetch(\https://duckduckgo.com/i.js?q=\&vqd=\&p=-1\, {
  headers: { 'User-Agent': 'Mozilla/5.0' }
})
const imgData = await imgRes.json()
console.log(imgData.results[0].image)
console.log(imgData.results[0].thumbnail)
