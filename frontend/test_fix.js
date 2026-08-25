const iconv = require('iconv-lite');
const str = 'ط§ظ„ط±ط¦ظٹط³ظٹط©';
const buf = iconv.encode(str, 'win1256');
console.log('Original corrupted:', str);
console.log('Fixed:', buf.toString('utf8'));
