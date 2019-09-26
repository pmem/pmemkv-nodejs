const Database = require('../lib/database');
const constants = Database.constants;

function assert(condition) {
    if (!condition) throw new Error('Assert failed');
}

console.log('Starting engine');
let config = {"path":"/dev/shm", "size":1073741824};
const db = new Database('vsmap', config);

console.log('Putting new key');
try{
    db.put('key1', 'value1');
    assert(db.count_all === 1);
}
catch(e){
    if (e.status == constants.status.OUT_OF_MEMORY)
        console.log(e.message);
}

console.log('Reading key back');
assert(db.get('key1') === 'value1');

console.log('Iterating existing keys');
db.put('key2', 'value2');
db.put('key3', 'value3');
db.get_keys((k) => console.log(`  visited: ${k}`));

console.log('Removing existing key');
db.remove('key1');
assert(!db.exists('key1'));

console.log('Stopping engine');
db.stop();
