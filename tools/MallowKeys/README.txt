MALLOWKEYS
==========
System-wide switch sounds for Mallow 68
Version 1.0.1

WHAT IT DOES
------------
MallowKeys is a tiny Windows tray app. It watches for key-down events so it can
play the switch sound you choose — Red, Brown, Blue, Thock or Clack — while you
type in any application: Word, Discord, a game, or Mallow 68 in your browser.

It never records which keys you press, never saves typed text, and never sends
keystrokes anywhere. The only network endpoint is a local website bridge on
127.0.0.1:43783 that exchanges sound settings with the Mallow 68 page. You can
read the source in the GitHub repository.

HOW TO RUN
----------
1. Extract the whole ZIP to a folder. Keep MallowKeys.exe and the sounds folder
   together.
2. Double-click MallowKeys.exe.
3. Right-click the pink keycap icon in the Windows system tray to choose a
   switch, mute, or enable "Start with Windows".
4. Type anywhere. The sound is played by your normal Windows audio output.

Windows may show a SmartScreen warning because this is a new unsigned app.
Choose "More info" > "Run anyway" if you trust the source. No administrator
rights are required.

TRAY MENU
---------
Sounds enabled        Master on/off.
Switch sound          Red, Brown, Blue, Thock, Clack.
Test current sound    Preview without pressing a key.
Start with Windows    Optional auto-start for the current Windows user.
Open Mallow 68        Opens the project repository.
Privacy and how it works
Exit MallowKeys

REQUIREMENTS
------------
Windows 10 or Windows 11.
.NET Framework 4.7.2 or newer (included with current Windows versions).

NOTES
-----
- MallowKeys does not block or alter keystrokes; it only listens and plays audio.
- Version 1.0.1 plays directly from pinned memory through the Windows low-latency
  waveOut path, so rapid typing starts each sound immediately. If you still hear
  lag, use wired headphones/speakers (Bluetooth adds 100–300 ms) and turn off
  audio enhancements or spatial sound for that device.
- Some elevated applications may not send keys to a normal-privilege app because
  of Windows security boundaries.
- The Mallow 68 website also has browser-only sounds. When MallowKeys is running,
  the site detects it and hands sound playback over to the tray app so the two
  do not double up.
- The source code is in the repository:
  https://github.com/naitrous007/mallow-68
