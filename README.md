# **VR-mony**
### A platonic solid love experience.
<br>
<p align="center"> <img src="./images/doc/cuball.png" width="50%"></p>

- [Introduction](#introduction)
- [Navigating in VR-mony](#navigating-in-vr-mony)
    - [The Book](#the-book)
    - [The Room](#the-room)
        - [The Spheres](#the-spheres)
        - [Reference System](#reference-system)
        - [Controls](#controls)
        - [User Interface](#user-interface)
        - [Multi-user Interaction](#multi-user-interaction)
- [Music Theory](#music-theory)
    - [Vogel's Tonnetz](#vogels-tonnetz)
    - [Implementation](#implementation)
        - [Audio](#audio)
        - [3D](#3d)
        - [VR](#vr)
- [Demo Video](#demo-video)
- [Useful Links](#useful-links)
- [Group Members](#group-members)

# **Introduction**
This project has been developed for the course "**Advanced Coding Tools and Methodologies**" of the MSc in *Music and Acoustic Engineering* of the *Politecnico di Milano*.

**VR-mony** is a minimalistic abstract cubic space in which the user can interact with spherical synthetic sound sources.

It is a 3D web-based application accessible both from VR headsets and from PCs.
<br><br>

# **Navigating in VR-mony**
The app can be accessed either by downloading the whole repository and running it with a live server or by clicking on the following link.

<a href="https://fradelgs.github.io/VRmony">VR-mony</a>

Remember to wear your headphones and to switch on the audio of your device.

The best way to appreciate VR-mony is to access the link from the browser of a VR headset with 6 degrees of freedom.
<br><br>

## **The Book**
The homepage is just a joke.<br>
If the user knows where to touch, the app will ask him/her/them to play.

There are just two rules:
- No means no.
- Two is love, three is a chord.

<p align="center"> <img src="./images/doc/homepage.png" width="100%"></p>
<br><br>

## **The Room**
The user is suddenly teleported into a minimalistic tridimensional room with just a bunch of organized spheres, three lines and a user interface.

<p align="center"> <img src="./images/doc/room.png" width="100%"></p>
<br><br>

### **Controls**
**PC** users can move into the space, activate sounds and modify them with a mouse:

PAN/TILT : Hold the left mouse button to rotate in 3D.
<br>
DOLLY : Hold the mouse wheel to move back and forth.
<br>
MOVE : Hold the right mouse button to move horizontally and vertically.
<br>
PLAY : Left click on a sphere to activate or deactivate its sound.
<br><br>

**VR** users will be able to see a green button on the bottom right of the screen if their device is VR-ready and clicking it they can access the VR experience and get out of it.

Enter VR                   |  Exit VR
:-------------------------:|:-------------------------:
<img src="./images/doc/enter.png" width="70%">  |  <img src="./images/doc/exit.png" width="70%">


- 3 DoF headsets (e.g. smartphones inside a Google Cardboard) can rotate the camera around the 3 axes and click by means of a bluetooth controller.

- 6 DoF headsets (Oculus Quest, HTC Vive) can move in 3 directions, rotate around 3 axes and use controllers to click.<br>☰ Use the hamburger button on the left controller to exit.
<br><br>

### **The Spheres**
A cube of 3x3x3 spheres is the core of VR-mony.

The glowing sphere at the center of the cube plays the fundamental note while the spheres around it have different notes depending on the direction they are located with respect to the fundamental one.

Default settings generate a cube with a C3 on the fundamental sphere and then develop the other spheres with the following intervals:
- x axis: Fifth
- y axis: Major Third
- z axis: minor Seventh
<br><br>

### **Reference System**
Three lines with different colours constitute a reference system with the origin in the center of the fundamental note sphere.
<br>
Each line is thicker on the side where the interval goes toward higher frequencies, while it is thinner going towards lower frequencies.
<br>
Line colours match the colors in the GUI.
<!--<br>
The setted intervals are reported on the thicker end of each line.-->
<br><br>

### **User Interface**
A simple user interface allows the user to control the sound generator and the interval on each axis.
<p align="center"> <img src="./images/doc/gui.png" width="80%"></p>

- **WAVE FORM:** allows to set the wave form of the generated sounds
    <p align="center">
    
    | sine | square | sawtooth | triangle |
    | ---- |:------:|:--------:| --------:|
    </p>

    <p align="center">
    <img src="./images/doc/wf_sine.webp" width="20%">
    <img src="./images/doc/wf_square.webp" width="20%">
    </p>
    <p align="center">
    <img src="./images/doc/wf_saw.webp" width="20%">
    <img src="./images/doc/wf_triangle.webp" width="20%">
    </p>
<br>

- **FUNDAMENTAL FREQUENCY:** allows to set the note of the central sphere

<p align="center">

| C   | C#  | D   | D#  | E   | E#  | F   | F#  | G   | G#  | A   | A#  | B   |
| --- |:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:| ---:|
</p>

<br>

- **OCTAVE:** allows to set the octave of the fundamental frequency from 1 to 6 where C3 is the middle C with *f = 262 Hz*.
<br><br>

- **X-AXIS / Y-AXIS / Z-AXIS:** allow to set the development interval on each axis.

<p align="center">

| minII | MajII | minIII | MajIII | IV | minV | V | minVI | MajVI | minVII | MajVII | VIII |
| ----- |:-----:|:------:|:------:|:--:|:----:|:-:|:-----:|:-----:|:------:|:------:| ----:|
</p>
<br><br>

### **Multi-user Interaction**
Thanks to an external database on Firebase it is possible for 2 or more users to access VR-mony at the same time and see and hear changes made by other players in real-time.
<br><br>

# **Music Theory**

<br><br>

## **Vogel's Tonnetz**

<br><br>

# **Implementation**

<br><br>

## **Audio**

<br><br>

## **3D**

<br><br>

## **VR**

<br><br>

# **Demo Video**

<br><br>

# Useful Links
- [THREE.js](https://threejs.org/)
- [WebXR API](https://www.w3.org/TR/webxr/)
- [Web Audio API](https://www.w3.org/TR/webaudio/)
- [FontAwesome](https://fontawesome.com/)

- [Interval](https://en.wikipedia.org/wiki/Interval_(music))
- [Euler's Tonnetz](https://en.wikipedia.org/wiki/Tonnetz)
- [Vogel's Tonnetz](https://en.wikipedia.org/wiki/Vogel%27s_Tonnetz)
<br><br>

# *Group members*
- Francesca Del Gaudio (francesca.delgaudio@mail.polimi.it)
- Valerio Maiolo (valerio.maiolo@mail.polimi.it) 
