# Seffi
seffi is a library that enables writing complex asynchronous code that can be resumed.

seffi saves the state of the execution internally and when it is resumed it plays back the execution until the last call that was made without actually running the side effects again.

For instance, if during an execution a call was made to an http server it will not run again when the execution is resumed - the result from the original call will be used.

# Usage
Comming soon
