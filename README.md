# Delux

Control your [Luxafor](http://www.luxafor.com) device via JS, with some extra functionality.

This builds on the [luxafor-api](https://github.com/iamthefox/luxafor) enabling setting brightness and transition speeds for individual and groups of LEDs. It also enables some advanced features like custom sequences (think animations with light). 

## Installation

Open your terminal/command prompt and type in:

    git clone https://github.com/blacksmithstudio/delux.git
    cd delux
    npm install

## Demos

There are a couple of demos for you to try out the Delux functionality with your device:

### Web Service

To demo the Delux functionality with your Luxafor device, type into the command line:

    npm run demo:webservice

Then open [http://localhost:3000](http://localhost:3000) in your browser. You can then visit these endpoints:
 * [/available](http://localhost:3000/available): Set yourself available
 * [/busy](http://localhost:3000/busy): Set yourself busy
 * [/color](http://localhost:3000/color?color=#ffffff): Set a specific color (use query params to set the color, e.g. [`/color?color=#ffffff`](http://localhost:3000/color?color=#ffffff))
 * [/random](http://localhost:3000/random): Set to a random colour
 * [/meeting](http://localhost:3000/meeting): Set to meeting mode (45 minute long meeting, with warning 5 minutes before it ends)
 * [/disco](http://localhost:3000/disco): Set to disco mode!
 * [/france](http://localhost:3000/france): Set to France mode!
 * [/off](http://localhost:3000/off): Turn it off

### Electron App

To demo the Electron desktop app with your Luxafor device, type into the command lin:

    npm run demo:electronapp

## License

               DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                       Version 2, December 2004
   
    Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>
   
    Everyone is permitted to copy and distribute verbatim or modified
    copies of this license document, and changing it is allowed as long
    as the name is changed.
   
               DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
      TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION
   
     0. You just DO WHAT THE FUCK YOU WANT TO.
