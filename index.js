const Test = require('bindings')('Test')

Test(msg => { console.log(msg) })

function run() {
  setInterval(() => console.log('Waiting for request'), 300)
}

run()
