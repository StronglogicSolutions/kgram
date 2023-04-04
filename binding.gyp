{
  "targets": [
    {
      "target_name": "kgramIPC",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [ "cpp/native.cpp" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "third_party/kproto/include",
        "third_party/kutils/include"
      ],
      "libraries": ["-lzmq", "-lpthread"],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
      "cflags_cc": ["-std=c++17"]
    }
  ]
}
