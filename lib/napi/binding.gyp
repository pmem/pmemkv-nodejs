{
  "targets": [
    {
      "target_name": "pmemkv",
      "sources": ["kvengine.cc", "pmemkv.cc"],
      "include_dirs": [
          "<!@(node -p \"require('node-addon-api').include\")"
      ],
      
      "dependencies": [
          "<!(node -p \"require('node-addon-api').gyp\")"
      ],
       "libraries": [
        "-lpmemkv",
       ],
       'cflags_cc!': [ '-fno-rtti'],
       'cflags_cc': ['-fexceptions']
    }
  ]
}
