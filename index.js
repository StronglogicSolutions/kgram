const GetMessage = require('bindings')('kgramIPC')
//----------------------------------
function createIG()
{
  return
  {
    name: "Instagram Client",
    function init() {},
    function post(text, media) {},
    function info() {}
  }
}
//----------------------------------
function run()
{
  setInterval(() => GetMessage(msg => console.log(msg)), 300)
}

run()
