const GetMessage = require('bindings')('kgramIPC')
//----------------------------------

class IGClient
{
  constructor()
  {
    this.name = "Instagram Client"
  }

  public init()                                        : boolean { return true }
  public info()                                        : boolean { return true }
  public getName()                                     : string  { return this.name }
  public post(text : string, media : Array<string>)    : boolean { return true }

  private name;

}

//----------------------------------
function run()
{
  setInterval(() => GetMessage(msg => console.log(msg)), 300)
}

run()
