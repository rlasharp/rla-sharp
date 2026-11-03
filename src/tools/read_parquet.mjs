import { parquetReadObjects, parquetMetadata } from './hyparquet/src/index.js'
import fs from 'fs'
import zlib from 'zlib'
const compressors={ZSTD:(input,len)=>new Uint8Array(zlib.zstdDecompressSync(Buffer.from(input)))}
const f=process.argv[2];const buf=fs.readFileSync(f);const ab=buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)
const rows=await parquetReadObjects({file:ab,compressors})
const out=process.argv[3];fs.writeFileSync(out,JSON.stringify(rows,(k,v)=>typeof v==='bigint'?Number(v):v))
console.log(f,rows.length,Object.keys(rows[0]).join(','))
