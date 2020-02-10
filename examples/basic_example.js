const Database = require('../lib/database');
const constants = Database.constants;

function assert(condition) {
    if (!condition) throw new Error('Assert failed');
}

console.log('Starting engine');
let config = {"path":"/dev/shm", "size":1073741824};
const db = new Database('vsmap', config, 'String');

console.log('Putting new keys');
try{
    db.put('key1', 'value1');
    db.put('key2', Buffer.from('value2'));
    assert(db.count_all === 1);
}
catch(e){
    if (e.status == constants.status.OUT_OF_MEMORY)
        console.log(e.message);
}

console.log('Reading keys back');
assert(db.get('key1') === 'value1');
db.get_as_buffer('key2', (v) => {
    assert(v.toString() === 'value2');
});

console.log('Iterating existing keys');
db.put('key3', 'value3');
db.put('key4', 'value4');
db.get_keys((k) => console.log(`  visited: ${k}`));

console.log('Iterating keys above');
db.get_keys_above('key2', (k) => console.log(`  visited: ${k}`));

console.log('Iterating keys below');
db.get_keys_below('key2', (k) => console.log(`  visited: ${k}`));

console.log('Iterating keys between');
db.get_keys_between('key2', 'key4', (k) => console.log(`  visited: ${k}`));

console.log('Iterating key-value pairs');
db.get_all((k, v) => console.log(`  visited: (${k}, ${v})`));

console.log('Iterating key-value pairs above');
db.get_above('key2', (k, v) => console.log(`  visited: (${k}, ${v})`));

console.log('Iterating key-value pairs below');
db.get_below('key2', (k, v) => console.log(`  visited: (${k}, ${v})`));

console.log('Iterating key-value pairs between');
db.get_between('key2', 'key4', (k, v) => console.log(`  visited: (${k}, ${v})`));

console.log('Removing existing key');
db.remove('key1');
assert(!db.exists('key1'));

console.log('Stopping engine');
db.stop();
