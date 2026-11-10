using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Media;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: System.Reflection.AssemblyTitle("MallowKeys")]
[assembly: System.Reflection.AssemblyDescription("System-wide switch sounds for Mallow 68")]
[assembly: System.Reflection.AssemblyCompany("Mallow 68")]
[assembly: System.Reflection.AssemblyProduct("MallowKeys")]
[assembly: System.Reflection.AssemblyVersion("1.0.0.0")]
[assembly: System.Reflection.AssemblyFileVersion("1.0.0.0")]

namespace MallowKeys
{
    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            StartupLog.Write("Main started");
            Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
            Application.ThreadException += delegate(object sender, ThreadExceptionEventArgs args)
            {
                StartupLog.Write("UI exception: " + args.Exception);
                MessageBox.Show(args.Exception.Message, "MallowKeys error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            };
            AppDomain.CurrentDomain.UnhandledException += delegate(object sender, UnhandledExceptionEventArgs args)
            {
                StartupLog.Write("Unhandled: " + args.ExceptionObject);
            };

            try
            {
                bool created;
                using (Mutex mutex = new Mutex(true, "MallowKeys.SingleInstance", out created))
                {
                    if (!created)
                    {
                        MessageBox.Show(
                            "MallowKeys is already running in the system tray.",
                            "MallowKeys",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information);
                        return;
                    }

                    Application.EnableVisualStyles();
                    Application.SetCompatibleTextRenderingDefault(false);
                    Application.Run(new TrayContext());
                    GC.KeepAlive(mutex);
                }
                StartupLog.Write("Main exited normally");
            }
            catch (Exception ex)
            {
                StartupLog.Write("Startup exception: " + ex);
                MessageBox.Show(
                    "MallowKeys could not start.\r\n\r\n" + ex.Message,
                    "MallowKeys",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }
    }

    internal static class StartupLog
    {
        internal static void Write(string message)
        {
            try
            {
                string path = Path.Combine(Path.GetTempPath(), "MallowKeys.log");
                File.AppendAllText(
                    path,
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "  " + message + Environment.NewLine,
                    new UTF8Encoding(false));
            }
            catch
            {
            }
        }
    }

    internal sealed class TrayContext : ApplicationContext
    {
        private readonly NotifyIcon notifyIcon;
        private readonly ContextMenuStrip menu;
        private readonly KeyboardHook hook;
        private readonly SoundLibrary sounds;
        private readonly BridgeServer bridge;
        private readonly Control marshaler;
        private readonly ToolStripMenuItem enabledItem;
        private readonly ToolStripMenuItem startWithWindowsItem;
        private readonly ToolStripMenuItem privacyItem;
        private readonly Dictionary<string, ToolStripMenuItem> modeItems;
        private string mode;
        private bool enabled;
        private bool disposed;

        internal TrayContext()
        {
            StartupLog.Write("TrayContext start");
            marshaler = new Control();
            marshaler.CreateControl();

            SettingsStore.Load(out mode, out enabled);
            mode = SoundLibrary.NormalizeMode(mode);
            StartupLog.Write("Settings loaded: " + mode + " / " + enabled);

            sounds = new SoundLibrary(Path.Combine(Application.StartupPath, "sounds"));
            StartupLog.Write("Sounds ready: " + sounds.HasSounds);
            if (!sounds.HasSounds)
            {
                MessageBox.Show(
                    "The sounds folder is missing.\r\n\r\nKeep MallowKeys.exe and the sounds folder together.",
                    "MallowKeys",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                ExitThread();
                return;
            }

            modeItems = new Dictionary<string, ToolStripMenuItem>();
            menu = new ContextMenuStrip();
            menu.ShowImageMargin = false;
            menu.Font = new Font("Segoe UI", 9f, FontStyle.Regular);

            ToolStripMenuItem header = new ToolStripMenuItem("MallowKeys  ·  system-wide switch sounds");
            header.Enabled = false;
            menu.Items.Add(header);
            menu.Items.Add(new ToolStripSeparator());

            enabledItem = new ToolStripMenuItem("Sounds enabled");
            enabledItem.CheckOnClick = false;
            enabledItem.Click += delegate
            {
                ApplyState(mode, !enabled, true);
                if (enabled)
                {
                    PlayTest(mode);
                }
            };
            menu.Items.Add(enabledItem);

            ToolStripMenuItem switchMenu = new ToolStripMenuItem("Switch sound");
            string[,] profiles = new string[,]
            {
                { "red", "Red  ·  linear" },
                { "brown", "Brown  ·  tactile" },
                { "blue", "Blue  ·  clicky" },
                { "thock", "Thock  ·  soft" },
                { "clack", "Clack  ·  sharp" }
            };
            for (int i = 0; i < profiles.GetLength(0); i++)
            {
                string id = profiles[i, 0];
                string label = profiles[i, 1];
                ToolStripMenuItem item = new ToolStripMenuItem(label);
                item.CheckOnClick = false;
                item.Tag = id;
                item.Click += delegate
                {
                    ApplyState((string)((ToolStripMenuItem)item).Tag, enabled, true);
                    PlayTest(mode);
                };
                switchMenu.DropDownItems.Add(item);
                modeItems[id] = item;
            }
            menu.Items.Add(switchMenu);

            ToolStripMenuItem testItem = new ToolStripMenuItem("Test current sound");
            testItem.Click += delegate { PlayTest(mode); };
            menu.Items.Add(testItem);
            menu.Items.Add(new ToolStripSeparator());

            startWithWindowsItem = new ToolStripMenuItem("Start with Windows");
            startWithWindowsItem.CheckOnClick = false;
            startWithWindowsItem.Click += delegate
            {
                bool next = !StartupManager.IsEnabled();
                if (!StartupManager.SetEnabled(next))
                {
                    MessageBox.Show(
                        "Could not update the Windows startup entry.",
                        "MallowKeys",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning);
                }
                UpdateMenu();
            };
            menu.Items.Add(startWithWindowsItem);

            ToolStripMenuItem openSite = new ToolStripMenuItem("Open Mallow 68");
            openSite.Click += delegate
            {
                try
                {
                    Process.Start(new ProcessStartInfo("https://github.com/naitrous007/mallow-68")
                    {
                        UseShellExecute = true
                    });
                }
                catch
                {
                }
            };
            menu.Items.Add(openSite);

            privacyItem = new ToolStripMenuItem("Privacy and how it works");
            privacyItem.Click += delegate
            {
                MessageBox.Show(
                    "MallowKeys runs in the tray and listens only for key-down events so it can play a switch sound.\r\n\r\n"
                    + "It does not record which keys you press, does not save typed text, and never sends keystrokes over the network.\r\n\r\n"
                    + "The local bridge on 127.0.0.1:43783 only exchanges settings with the Mallow 68 website.",
                    "MallowKeys privacy",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            };
            menu.Items.Add(privacyItem);
            menu.Items.Add(new ToolStripSeparator());

            ToolStripMenuItem exitItem = new ToolStripMenuItem("Exit MallowKeys");
            exitItem.Click += delegate { ExitThread(); };
            menu.Items.Add(exitItem);

            notifyIcon = new NotifyIcon();
            notifyIcon.Icon = LoadAppIcon();
            notifyIcon.Text = "MallowKeys - switch sounds in your tray";
            notifyIcon.ContextMenuStrip = menu;
            notifyIcon.Visible = true;
            notifyIcon.DoubleClick += delegate
            {
                notifyIcon.ShowBalloonTip(
                    3000,
                    "MallowKeys",
                    "Typing anywhere plays " + DisplayName(mode) + " switch sounds.",
                    ToolTipIcon.Info);
            };
            StartupLog.Write("NotifyIcon ready");

            hook = new KeyboardHook();
            hook.KeyDown += delegate
            {
                if (enabled)
                {
                    sounds.Play(mode);
                }
            };
            try
            {
                hook.Start();
                StartupLog.Write("Keyboard hook installed");
            }
            catch (Exception hookError)
            {
                StartupLog.Write("Keyboard hook failed: " + hookError);
                MessageBox.Show(
                    "MallowKeys could not start the global keyboard listener.\r\n\r\n" + hookError.Message,
                    "MallowKeys",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                ExitThread();
                return;
            }

            bridge = new BridgeServer(this);
            try
            {
                bridge.Start();
                StartupLog.Write("Bridge listening");
            }
            catch (Exception ex)
            {
                StartupLog.Write("Bridge failed: " + ex);
                notifyIcon.ShowBalloonTip(
                    5000,
                    "MallowKeys sounds are ready",
                    "The local website bridge could not open port 43783. Sounds still work system-wide. " + ex.Message,
                    ToolTipIcon.Warning);
            }

            ApplyState(mode, enabled, false);
            notifyIcon.ShowBalloonTip(
                3500,
                "MallowKeys is listening",
                "Type in any app to hear " + DisplayName(mode) + " switches. Right-click the tray icon to change.",
                ToolTipIcon.Info);
            StartupLog.Write("TrayContext ready");
        }

        internal string CurrentMode
        {
            get { return mode; }
        }

        internal bool CurrentEnabled
        {
            get { return enabled; }
        }

        internal string StateJson()
        {
            return "{\"app\":\"MallowKeys\",\"version\":\"1.0.0\",\"enabled\":"
                + (enabled ? "true" : "false")
                + ",\"mode\":\"" + mode + "\",\"global\":true}";
        }

        internal void PlayTest(string requestedMode)
        {
            string safeMode = SoundLibrary.NormalizeMode(requestedMode);
            sounds.PlayPreview(safeMode);
        }

        internal void ApplyExternalState(string requestedMode, bool? requestedEnabled)
        {
            if (marshaler.InvokeRequired)
            {
                marshaler.Invoke(new Action<string, bool?>(ApplyExternalState), requestedMode, requestedEnabled);
                return;
            }
            string nextMode = string.IsNullOrEmpty(requestedMode) ? mode : SoundLibrary.NormalizeMode(requestedMode);
            bool nextEnabled = requestedEnabled.HasValue ? requestedEnabled.Value : enabled;
            ApplyState(nextMode, nextEnabled, true);
        }

        private void ApplyState(string nextMode, bool nextEnabled, bool persist)
        {
            string safeMode = SoundLibrary.NormalizeMode(nextMode);
            bool changed = safeMode != mode || nextEnabled != enabled;
            mode = safeMode;
            enabled = nextEnabled;
            if (persist)
            {
                SettingsStore.Save(mode, enabled);
            }
            UpdateMenu();
            if (changed)
            {
                notifyIcon.Text = "MallowKeys - " + DisplayName(mode) + (enabled ? " (on)" : " (muted)");
            }
        }

        private void UpdateMenu()
        {
            enabledItem.Checked = enabled;
            foreach (KeyValuePair<string, ToolStripMenuItem> pair in modeItems)
            {
                pair.Value.Checked = pair.Key == mode;
            }
            startWithWindowsItem.Checked = StartupManager.IsEnabled();
            notifyIcon.Text = "MallowKeys - " + DisplayName(mode) + (enabled ? " (on)" : " (muted)");
        }

        private static string DisplayName(string id)
        {
            if (id == "brown") return "Brown";
            if (id == "blue") return "Blue";
            if (id == "thock") return "Thock";
            if (id == "clack") return "Clack";
            return "Red";
        }

        private static Icon LoadAppIcon()
        {
            try
            {
                Icon icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
                if (icon != null) return icon;
            }
            catch
            {
            }
            return SystemIcons.Application;
        }

        protected override void ExitThreadCore()
        {
            if (disposed)
            {
                base.ExitThreadCore();
                return;
            }
            disposed = true;
            try
            {
                hook.Dispose();
            }
            catch
            {
            }
            try
            {
                bridge.Dispose();
            }
            catch
            {
            }
            try
            {
                notifyIcon.Visible = false;
                notifyIcon.Dispose();
            }
            catch
            {
            }
            try
            {
                menu.Dispose();
                marshaler.Dispose();
                sounds.Dispose();
            }
            catch
            {
            }
            base.ExitThreadCore();
        }
    }

    internal sealed class SoundLibrary : IDisposable
    {
        internal static readonly string[] Modes = new string[] { "red", "brown", "blue", "thock", "clack" };
        private readonly Dictionary<string, List<SoundPlayer>> pools = new Dictionary<string, List<SoundPlayer>>();
        private readonly Random random = new Random();
        private readonly object sync = new object();

        internal SoundLibrary(string soundsDirectory)
        {
            if (!Directory.Exists(soundsDirectory)) return;
            foreach (string id in Modes)
            {
                List<SoundPlayer> list = new List<SoundPlayer>();
                string[] files = Directory.GetFiles(soundsDirectory, id + "-*.wav");
                Array.Sort(files, StringComparer.OrdinalIgnoreCase);
                foreach (string file in files)
                {
                    for (int copy = 0; copy < 3; copy++)
                    {
                        try
                        {
                            SoundPlayer player = new SoundPlayer(file);
                            player.Load();
                            list.Add(player);
                        }
                        catch
                        {
                        }
                    }
                }
                if (list.Count > 0)
                {
                    pools[id] = list;
                }
            }
        }

        internal bool HasSounds
        {
            get
            {
                foreach (string id in Modes)
                {
                    if (!pools.ContainsKey(id)) return false;
                }
                return true;
            }
        }

        internal static string NormalizeMode(string value)
        {
            if (string.IsNullOrEmpty(value)) return "red";
            string lower = value.Trim().ToLowerInvariant();
            foreach (string mode in Modes)
            {
                if (mode == lower) return lower;
            }
            return "red";
        }

        internal void Play(string id)
        {
            string safeMode = NormalizeMode(id);
            List<SoundPlayer> list;
            if (!pools.TryGetValue(safeMode, out list) || list.Count == 0) return;
            SoundPlayer player;
            lock (sync)
            {
                player = list[random.Next(list.Count)];
            }
            ThreadPool.QueueUserWorkItem(delegate
            {
                try
                {
                    player.Play();
                }
                catch
                {
                }
            });
        }

        internal void PlayPreview(string id)
        {
            Play(id);
        }

        public void Dispose()
        {
            foreach (List<SoundPlayer> list in pools.Values)
            {
                foreach (SoundPlayer player in list)
                {
                    try
                    {
                        player.Dispose();
                    }
                    catch
                    {
                    }
                }
            }
            pools.Clear();
        }
    }

    internal static class SettingsStore
    {
        private static string SettingsPath()
        {
            string directory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "MallowKeys");
            return Path.Combine(directory, "settings.ini");
        }

        internal static void Load(out string mode, out bool enabled)
        {
            mode = "red";
            enabled = true;
            try
            {
                string path = SettingsPath();
                if (!File.Exists(path)) return;
                foreach (string raw in File.ReadAllLines(path))
                {
                    string line = raw.Trim();
                    int split = line.IndexOf('=');
                    if (split <= 0) continue;
                    string key = line.Substring(0, split).Trim();
                    string value = line.Substring(split + 1).Trim();
                    if (key.Equals("mode", StringComparison.OrdinalIgnoreCase))
                    {
                        mode = SoundLibrary.NormalizeMode(value);
                    }
                    else if (key.Equals("enabled", StringComparison.OrdinalIgnoreCase))
                    {
                        bool parsed;
                        if (bool.TryParse(value, out parsed)) enabled = parsed;
                    }
                }
            }
            catch
            {
            }
        }

        internal static void Save(string mode, bool enabled)
        {
            try
            {
                string path = SettingsPath();
                Directory.CreateDirectory(Path.GetDirectoryName(path));
                File.WriteAllText(
                    path,
                    "mode=" + mode + Environment.NewLine + "enabled=" + enabled.ToString().ToLowerInvariant() + Environment.NewLine,
                    new UTF8Encoding(false));
            }
            catch
            {
            }
        }
    }

    internal static class StartupManager
    {
        private const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
        private const string ValueName = "MallowKeys";

        internal static bool IsEnabled()
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(RunKey, false))
                {
                    if (key == null) return false;
                    string value = key.GetValue(ValueName) as string;
                    return !string.IsNullOrEmpty(value);
                }
            }
            catch
            {
                return false;
            }
        }

        internal static bool SetEnabled(bool enabled)
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(RunKey, true))
                {
                    if (key == null) return false;
                    if (enabled)
                    {
                        key.SetValue(ValueName, "\"" + Application.ExecutablePath + "\" --tray");
                    }
                    else
                    {
                        key.DeleteValue(ValueName, false);
                    }
                }
                return true;
            }
            catch
            {
                return false;
            }
        }
    }

    internal sealed class KeyboardHook : IDisposable
    {
        private const int WH_KEYBOARD_LL = 13;
        private const int WM_KEYDOWN = 0x0100;
        private const int WM_SYSKEYDOWN = 0x0104;
        private const int WM_KEYUP = 0x0101;
        private const int WM_SYSKEYUP = 0x0105;
        private const uint LLKHF_INJECTED = 0x00000010;

        private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

        [StructLayout(LayoutKind.Sequential)]
        private struct KBDLLHOOKSTRUCT
        {
            public uint vkCode;
            public uint scanCode;
            public uint flags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);

        private readonly LowLevelKeyboardProc proc;
        private readonly HashSet<int> downKeys = new HashSet<int>();
        private IntPtr handle = IntPtr.Zero;
        private bool disposed;

        internal event Action<int> KeyDown;

        internal KeyboardHook()
        {
            proc = HookCallback;
        }

        internal void Start()
        {
            if (handle != IntPtr.Zero) return;
            handle = SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(null), 0);
            if (handle == IntPtr.Zero)
            {
                throw new InvalidOperationException("Could not install the global keyboard hook (Win32 error " + Marshal.GetLastWin32Error() + ").");
            }
        }

        private IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0)
            {
                int message = wParam.ToInt32();
                KBDLLHOOKSTRUCT info = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));
                if ((info.flags & LLKHF_INJECTED) == 0)
                {
                    int vk = (int)info.vkCode;
                    if (message == WM_KEYDOWN || message == WM_SYSKEYDOWN)
                    {
                        if (downKeys.Add(vk))
                        {
                            Action<int> handler = KeyDown;
                            if (handler != null)
                            {
                                try
                                {
                                    handler(vk);
                                }
                                catch
                                {
                                }
                            }
                        }
                    }
                    else if (message == WM_KEYUP || message == WM_SYSKEYUP)
                    {
                        downKeys.Remove(vk);
                    }
                }
            }
            return CallNextHookEx(handle, nCode, wParam, lParam);
        }

        public void Dispose()
        {
            if (disposed) return;
            disposed = true;
            if (handle != IntPtr.Zero)
            {
                UnhookWindowsHookEx(handle);
                handle = IntPtr.Zero;
            }
        }
    }

    internal sealed class BridgeServer : IDisposable
    {
        public const int Port = 43783;
        private readonly TrayContext owner;
        private readonly TcpListener listener;
        private bool running;

        internal BridgeServer(TrayContext owner)
        {
            this.owner = owner;
            listener = new TcpListener(IPAddress.Loopback, Port);
        }

        internal void Start()
        {
            if (running) return;
            listener.Start();
            running = true;
            Task.Run(new Func<Task>(AcceptLoop));
        }

        private async Task AcceptLoop()
        {
            while (running)
            {
                try
                {
                    TcpClient client = await listener.AcceptTcpClientAsync();
                    Task ignored = Task.Run(new Action(() => HandleClient(client)));
                }
                catch (ObjectDisposedException)
                {
                    break;
                }
                catch (SocketException)
                {
                    break;
                }
                catch
                {
                    if (!running) break;
                }
            }
        }

        private void HandleClient(TcpClient client)
        {
            try
            {
                using (client)
                using (NetworkStream stream = client.GetStream())
                {
                    stream.ReadTimeout = 2500;
                    stream.WriteTimeout = 2500;
                    Request request = ReadRequest(stream);
                    if (request == null)
                    {
                        WriteResponse(stream, 400, "Bad Request", "{\"error\":\"bad request\"}");
                        return;
                    }
                    if (request.Method == "OPTIONS")
                    {
                        WriteResponse(stream, 204, "No Content", null);
                        return;
                    }
                    if (request.Method == "GET" && (request.Path == "/state" || request.Path == "/health"))
                    {
                        WriteResponse(stream, 200, "OK", owner.StateJson());
                        return;
                    }
                    if (request.Method == "POST" && request.Path == "/config")
                    {
                        string mode = null;
                        bool? enabled = null;
                        Match modeMatch = Regex.Match(request.Body, "\"mode\"\\s*:\\s*\"([a-zA-Z]+)\"");
                        if (modeMatch.Success) mode = modeMatch.Groups[1].Value;
                        Match enabledMatch = Regex.Match(request.Body, "\"enabled\"\\s*:\\s*(true|false)", RegexOptions.IgnoreCase);
                        if (enabledMatch.Success) enabled = enabledMatch.Groups[1].Value.Equals("true", StringComparison.OrdinalIgnoreCase);
                        owner.ApplyExternalState(mode, enabled);
                        WriteResponse(stream, 200, "OK", owner.StateJson());
                        return;
                    }
                    if (request.Method == "POST" && request.Path == "/test")
                    {
                        Match modeMatch = Regex.Match(request.Body, "\"mode\"\\s*:\\s*\"([a-zA-Z]+)\"");
                        string mode = modeMatch.Success ? modeMatch.Groups[1].Value : owner.CurrentMode;
                        owner.PlayTest(mode);
                        WriteResponse(stream, 200, "OK", "{\"ok\":true}");
                        return;
                    }
                    WriteResponse(stream, 404, "Not Found", "{\"error\":\"not found\"}");
                }
            }
            catch
            {
                try
                {
                    client.Close();
                }
                catch
                {
                }
            }
        }

        private sealed class Request
        {
            internal string Method;
            internal string Path;
            internal string Body;
        }

        private static Request ReadRequest(NetworkStream stream)
        {
            byte[] buffer = new byte[8192];
            MemoryStream memory = new MemoryStream();
            int headerEnd = -1;
            int contentLength = 0;
            while (memory.Length < 65536)
            {
                int read = stream.Read(buffer, 0, buffer.Length);
                if (read <= 0) break;
                memory.Write(buffer, 0, read);
                byte[] data = memory.ToArray();
                if (headerEnd < 0)
                {
                    string text = Encoding.ASCII.GetString(data);
                    int end = text.IndexOf("\r\n\r\n", StringComparison.Ordinal);
                    if (end >= 0)
                    {
                        headerEnd = end + 4;
                        string[] lines = text.Substring(0, end).Split(new string[] { "\r\n" }, StringSplitOptions.None);
                        for (int i = 1; i < lines.Length; i++)
                        {
                            int colon = lines[i].IndexOf(':');
                            if (colon <= 0) continue;
                            string name = lines[i].Substring(0, colon).Trim();
                            string value = lines[i].Substring(colon + 1).Trim();
                            if (name.Equals("Content-Length", StringComparison.OrdinalIgnoreCase))
                            {
                                int parsed;
                                if (int.TryParse(value, out parsed)) contentLength = parsed;
                            }
                        }
                    }
                }
                if (headerEnd >= 0 && data.Length >= headerEnd + contentLength) break;
            }
            if (headerEnd < 0) return null;
            byte[] all = memory.ToArray();
            string requestText = Encoding.ASCII.GetString(all, 0, headerEnd);
            string[] requestLines = requestText.Split(new string[] { "\r\n" }, StringSplitOptions.None);
            if (requestLines.Length == 0) return null;
            string[] first = requestLines[0].Split(' ');
            if (first.Length < 2) return null;
            string body = "";
            if (contentLength > 0 && all.Length > headerEnd)
            {
                int available = Math.Min(contentLength, all.Length - headerEnd);
                body = Encoding.UTF8.GetString(all, headerEnd, available);
            }
            return new Request
            {
                Method = first[0].ToUpperInvariant(),
                Path = first[1].Split('?')[0],
                Body = body
            };
        }

        private static void WriteResponse(NetworkStream stream, int code, string reason, string json)
        {
            string body = json ?? "";
            byte[] bodyBytes = Encoding.UTF8.GetBytes(body);
            StringBuilder headers = new StringBuilder();
            headers.Append("HTTP/1.1 ").Append(code).Append(' ').Append(reason).Append("\r\n");
            headers.Append("Content-Type: application/json; charset=utf-8\r\n");
            headers.Append("Content-Length: ").Append(bodyBytes.Length).Append("\r\n");
            headers.Append("Connection: close\r\n");
            headers.Append("Cache-Control: no-store\r\n");
            headers.Append("Access-Control-Allow-Origin: *\r\n");
            headers.Append("Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n");
            headers.Append("Access-Control-Allow-Headers: Content-Type\r\n");
            headers.Append("Access-Control-Max-Age: 86400\r\n");
            headers.Append("Access-Control-Allow-Private-Network: true\r\n");
            headers.Append("\r\n");
            byte[] headerBytes = Encoding.ASCII.GetBytes(headers.ToString());
            stream.Write(headerBytes, 0, headerBytes.Length);
            if (bodyBytes.Length > 0)
            {
                stream.Write(bodyBytes, 0, bodyBytes.Length);
            }
            stream.Flush();
        }

        public void Dispose()
        {
            running = false;
            try
            {
                listener.Stop();
            }
            catch
            {
            }
        }
    }
}
