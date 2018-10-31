{
  "targets": [
    {
      "target_name": "pmemkv",
      "sources": ["engine.cc", "pmemkv.cc"],
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "/usr/local",
        "/usr"
      ],
       "libraries": [
        "-lpmemkv",
       ],
       'cflags_cc!': [ '-fno-rtti'],
       'cflags_cc': ['-fexceptions']
    }
  ]
}
