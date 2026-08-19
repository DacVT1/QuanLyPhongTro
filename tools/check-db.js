const Database = require('better-sqlite3');
const db = new Database('D:\\QuanLyNhaTro\\backend\\database.sqlite');
console.log('TABLES', JSON.stringify(db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all(), null, 2));
console.log('nha_tro', db.prepare('SELECT COUNT(*) as c FROM nha_tro').get());
console.log('phong', db.prepare('SELECT COUNT(*) as c FROM phong').get());
console.log('giuong', db.prepare('SELECT COUNT(*) as c FROM giuong').get());
console.log('hop_dong', db.prepare('SELECT COUNT(*) as c FROM hop_dong').get());
console.log('hoa_don', db.prepare('SELECT COUNT(*) as c FROM hoa_don').get());
db.close();
