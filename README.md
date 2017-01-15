# Seffi
seffi is a library that enables writing complex asynchronous code that can be resumed.

seffi saves the state of the execution internally and when it is resumed it plays back the execution until the last call that was made without actually running the side effects again.

For instance, if during an execution a call was made to an http server it will not run again when the execution is resumed - the result from the original call will be used.

## Install
```sh
$ npm install seffi --save
```

## Usage
Comming soon

## Contributing
Thanks for thinking about contributing! We are looking for contributions of any sort and size - features, bug fixes, documentation or anything else that you think will make shisell better.
* Fork and clone locally
* Create a topic specific branch
* Add a cool feature or fix a bug
* Add tests
* Send a Pull Request

#### Running Tests
```sh
$ npm test
```

## Why the name Seffi?
We give names to our open source projects according to our office dogs names. Seffi is one of our favorite dogs so we deciced that it deserves an open source project.
For more open sourced dogs, see:
https://github.com/Soluto/shisell-js
https://github.com/Soluto/congo-core
